use chrono::Utc;
use serde_json::{Map, Value, json};
use std::collections::{BTreeMap, HashSet};

use crate::utils::nanoid::generate_db_id;

pub fn translate_responses_request(body: &Value) -> Result<Value, String> {
    let mut tools = body
        .get("tools")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let tool_choice = translate_tool_choice_for_upstream(body, &mut tools);
    let messages = build_openai_messages(body)?;

    let mut translated = Map::new();

    if let Some(model) = body.get("model").and_then(Value::as_str) {
        translated.insert("model".to_string(), Value::String(model.to_string()));
    }

    translated.insert("messages".to_string(), Value::Array(messages));

    if !tools.is_empty() {
        translated.insert("tools".to_string(), Value::Array(tools));
    }

    if let Some(tool_choice) = tool_choice {
        translated.insert("tool_choice".to_string(), tool_choice);
    }

    copy_if_present(
        body,
        &mut translated,
        &[
            "stream",
            "stream_options",
            "temperature",
            "top_p",
            "presence_penalty",
            "frequency_penalty",
            "parallel_tool_calls",
            "top_logprobs",
        ],
    );

    if let Some(max_output_tokens) = body.get("max_output_tokens")
        && !max_output_tokens.is_null()
    {
        translated.insert("max_tokens".to_string(), max_output_tokens.clone());
    }

    if let Some(response_format) = translate_text_format_for_upstream(body) {
        translated.insert("response_format".to_string(), response_format);
    }

    Ok(Value::Object(translated))
}

pub fn translate_chat_completions_response(request: &Value, upstream: &Value) -> Value {
    let created_at = upstream
        .get("created")
        .and_then(Value::as_i64)
        .unwrap_or_else(current_unix_seconds);

    let usage = upstream.get("usage").map(openresponses_usage_from_upstream);
    let mut output = Vec::new();

    if let Some(choices) = upstream.get("choices").and_then(Value::as_array) {
        for choice in choices {
            output.extend(output_items_from_choice(choice));
        }
    }

    build_response_resource(
        request,
        upstream,
        &response_id_from_upstream(upstream),
        created_at,
        Some(created_at),
        "completed",
        output,
        usage,
    )
}

pub fn openresponses_usage_from_upstream(usage: &Value) -> Value {
    let input_tokens = usage
        .get("input_tokens")
        .or_else(|| usage.get("prompt_tokens"))
        .and_then(Value::as_i64)
        .unwrap_or(0);
    let output_tokens = usage
        .get("output_tokens")
        .or_else(|| usage.get("completion_tokens"))
        .and_then(Value::as_i64)
        .unwrap_or(0);
    let cached_tokens = usage
        .get("cache_read_input_tokens")
        .and_then(Value::as_i64)
        .or_else(|| {
            usage
                .get("prompt_tokens_details")
                .and_then(|value| value.get("cached_tokens"))
                .and_then(Value::as_i64)
        })
        .unwrap_or(0);
    let reasoning_tokens = usage
        .get("completion_tokens_details")
        .and_then(|value| value.get("reasoning_tokens"))
        .and_then(Value::as_i64)
        .unwrap_or(0);

    json!({
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "input_tokens_details": {
            "cached_tokens": cached_tokens
        },
        "output_tokens_details": {
            "reasoning_tokens": reasoning_tokens
        }
    })
}

#[derive(Clone, Debug, PartialEq, Eq)]
enum OutputKey {
    Assistant,
    ToolCall(usize),
}

#[derive(Clone, Debug)]
struct AssistantMessageState {
    item_id: String,
    text: String,
    content_started: bool,
}

#[derive(Clone, Debug)]
struct ToolCallState {
    item_id: String,
    call_id: String,
    name: String,
    arguments: String,
}

pub struct OpenResponsesStreamTranslator {
    request: Value,
    response_id: String,
    created_at: i64,
    output_sequence: Vec<OutputKey>,
    assistant: Option<AssistantMessageState>,
    tool_calls: BTreeMap<usize, ToolCallState>,
    usage: Option<Value>,
    sequence_number: i64,
    finished: bool,
}

impl OpenResponsesStreamTranslator {
    pub fn new(request: &Value) -> Self {
        Self {
            request: request.clone(),
            response_id: prefixed_id("resp"),
            created_at: current_unix_seconds(),
            output_sequence: Vec::new(),
            assistant: None,
            tool_calls: BTreeMap::new(),
            usage: None,
            sequence_number: 0,
            finished: false,
        }
    }

    pub fn take_initial_events(&mut self) -> Vec<Value> {
        let response = build_response_resource(
            &self.request,
            &json!({}),
            &self.response_id,
            self.created_at,
            None,
            "in_progress",
            Vec::new(),
            None,
        );

        vec![
            self.make_event(json!({
                "type": "response.created",
                "response": response.clone(),
            })),
            self.make_event(json!({
                "type": "response.in_progress",
                "response": response,
            })),
        ]
    }

    pub fn capture_usage(&mut self, chunk: &Value) {
        if let Some(usage) = chunk.get("usage") && !usage.is_null() {
            self.usage = Some(openresponses_usage_from_upstream(usage));
        }
    }

    pub fn process_chunk(&mut self, chunk: &Value) -> Vec<Value> {
        let mut events = Vec::new();

        let Some(choice) = chunk
            .get("choices")
            .and_then(Value::as_array)
            .and_then(|choices| choices.first())
        else {
            return events;
        };

        if let Some(delta) = choice.get("delta").and_then(Value::as_object) {
            if let Some(content) = delta.get("content").and_then(Value::as_str)
                && !content.is_empty()
            {
                events.extend(self.push_assistant_text(content));
            }

            if let Some(tool_calls) = delta.get("tool_calls").and_then(Value::as_array) {
                for (fallback_index, tool_call) in tool_calls.iter().enumerate() {
                    events.extend(self.push_tool_call_delta(tool_call, fallback_index));
                }
            }
        }

        events
    }

    pub fn finish(&mut self) -> Vec<Value> {
        if self.finished {
            return Vec::new();
        }

        let mut events = Vec::new();

        for output_key in self.output_sequence.clone() {
            match output_key {
                OutputKey::Assistant => {
                    if let Some(assistant) = self.assistant.clone() {
                        let output_index = self.output_index(&OutputKey::Assistant);
                        let part = output_text_part(&assistant.text);
                        events.push(self.make_event(json!({
                            "type": "response.output_text.done",
                            "item_id": assistant.item_id,
                            "output_index": output_index,
                            "content_index": 0,
                            "text": assistant.text,
                            "logprobs": [],
                        })));
                        events.push(self.make_event(json!({
                            "type": "response.content_part.done",
                            "item_id": assistant.item_id,
                            "output_index": output_index,
                            "content_index": 0,
                            "part": part,
                        })));
                        events.push(self.make_event(json!({
                            "type": "response.output_item.done",
                            "output_index": output_index,
                            "item": assistant_item(&assistant.item_id, &assistant.text, "completed"),
                        })));
                    }
                }
                OutputKey::ToolCall(index) => {
                    if let Some(tool_call) = self.tool_calls.get(&index).cloned() {
                        let output_index = self.output_index(&OutputKey::ToolCall(index));
                        events.push(self.make_event(json!({
                            "type": "response.function_call_arguments.done",
                            "item_id": tool_call.item_id,
                            "output_index": output_index,
                            "arguments": tool_call.arguments,
                        })));
                        events.push(self.make_event(json!({
                            "type": "response.output_item.done",
                            "output_index": output_index,
                            "item": tool_call_item(
                                &tool_call.item_id,
                                &tool_call.call_id,
                                &tool_call.name,
                                &tool_call.arguments,
                                "completed",
                            ),
                        })));
                    }
                }
            }
        }

        events.push(self.make_event(json!({
            "type": "response.completed",
            "response": build_response_resource(
                &self.request,
                &json!({}),
                &self.response_id,
                self.created_at,
                Some(current_unix_seconds()),
                "completed",
                self.output_items(),
                self.usage.clone(),
            ),
        })));

        self.finished = true;
        events
    }

    fn push_assistant_text(&mut self, content: &str) -> Vec<Value> {
        let mut events = Vec::new();

        if self.assistant.is_none() {
            let item_id = prefixed_id("msg");
            self.assistant = Some(AssistantMessageState {
                item_id: item_id.clone(),
                text: String::new(),
                content_started: false,
            });
            self.output_sequence.push(OutputKey::Assistant);
            let output_index = self.output_index(&OutputKey::Assistant);
            events.push(self.make_event(json!({
                "type": "response.output_item.added",
                "output_index": output_index,
                "item": assistant_item(&item_id, "", "in_progress"),
            })));
        }

        let mut emit_content_part_added = false;
        let item_id = {
            let assistant = self.assistant.as_mut().expect("assistant exists");
            if !assistant.content_started {
                assistant.content_started = true;
                emit_content_part_added = true;
            }
            assistant.text.push_str(content);
            assistant.item_id.clone()
        };

        let output_index = self.output_index(&OutputKey::Assistant);
        if emit_content_part_added {
            events.push(self.make_event(json!({
                "type": "response.content_part.added",
                "item_id": item_id,
                "output_index": output_index,
                "content_index": 0,
                "part": output_text_part(""),
            })));
        }

        events.push(self.make_event(json!({
            "type": "response.output_text.delta",
            "item_id": item_id,
            "output_index": output_index,
            "content_index": 0,
            "delta": content,
            "logprobs": [],
        })));

        events
    }

    fn push_tool_call_delta(&mut self, tool_call: &Value, fallback_index: usize) -> Vec<Value> {
        let mut events = Vec::new();

        let index = tool_call
            .get("index")
            .and_then(Value::as_u64)
            .map(|value| value as usize)
            .unwrap_or(fallback_index);
        let call_id = tool_call
            .get("id")
            .and_then(Value::as_str)
            .map(ToString::to_string);
        let function = tool_call.get("function").and_then(Value::as_object);
        let name = function
            .and_then(|value| value.get("name"))
            .and_then(Value::as_str)
            .map(ToString::to_string);
        let arguments_delta = function
            .and_then(|value| value.get("arguments"))
            .and_then(Value::as_str)
            .unwrap_or("");

        if !self.tool_calls.contains_key(&index) {
            let state = ToolCallState {
                item_id: prefixed_id("fc"),
                call_id: call_id.clone().unwrap_or_else(|| prefixed_id("call")),
                name: name.clone().unwrap_or_else(|| format!("tool_{}", index)),
                arguments: String::new(),
            };
            let output_index = self.output_sequence.len();
            let added_item = tool_call_item(
                &state.item_id,
                &state.call_id,
                &state.name,
                "",
                "in_progress",
            );
            self.tool_calls.insert(index, state);
            self.output_sequence.push(OutputKey::ToolCall(index));
            events.push(self.make_event(json!({
                "type": "response.output_item.added",
                "output_index": output_index,
                "item": added_item,
            })));
        }

        let mut emit_delta = false;
        let item_id = {
            let state = self.tool_calls.get_mut(&index).expect("tool call exists");
            if let Some(name) = name && state.name.starts_with("tool_") {
                state.name = name;
            }
            if let Some(call_id) = call_id && state.call_id.starts_with("call_") {
                state.call_id = call_id;
            }
            if !arguments_delta.is_empty() {
                state.arguments.push_str(arguments_delta);
                emit_delta = true;
            }
            state.item_id.clone()
        };

        if emit_delta {
            let output_index = self.output_index(&OutputKey::ToolCall(index));
            events.push(self.make_event(json!({
                "type": "response.function_call_arguments.delta",
                "item_id": item_id,
                "output_index": output_index,
                "delta": arguments_delta,
            })));
        }

        events
    }

    fn output_index(&self, output_key: &OutputKey) -> usize {
        self.output_sequence
            .iter()
            .position(|candidate| candidate == output_key)
            .unwrap_or(0)
    }

    fn output_items(&self) -> Vec<Value> {
        let mut items = Vec::new();

        for output_key in &self.output_sequence {
            match output_key {
                OutputKey::Assistant => {
                    if let Some(assistant) = &self.assistant {
                        items.push(assistant_item(&assistant.item_id, &assistant.text, "completed"));
                    }
                }
                OutputKey::ToolCall(index) => {
                    if let Some(tool_call) = self.tool_calls.get(index) {
                        items.push(tool_call_item(
                            &tool_call.item_id,
                            &tool_call.call_id,
                            &tool_call.name,
                            &tool_call.arguments,
                            "completed",
                        ));
                    }
                }
            }
        }

        items
    }

    fn make_event(&mut self, mut payload: Value) -> Value {
        self.sequence_number += 1;
        if let Some(object) = payload.as_object_mut() {
            object.insert(
                "sequence_number".to_string(),
                Value::Number(self.sequence_number.into()),
            );
        }
        payload
    }
}

fn build_openai_messages(body: &Value) -> Result<Vec<Value>, String> {
    let mut messages = Vec::new();

    if let Some(instructions) = body.get("instructions").and_then(Value::as_str)
        && !instructions.is_empty()
    {
        messages.push(json!({
            "role": "system",
            "content": instructions,
        }));
    }

    match body.get("input") {
        None | Some(Value::Null) => {}
        Some(Value::String(text)) => {
            messages.push(json!({
                "role": "user",
                "content": text,
            }));
        }
        Some(Value::Array(items)) => {
            for item in items {
                if let Some(message) = translate_input_item_to_message(item)? {
                    messages.push(message);
                }
            }
        }
        Some(_) => return Err("OpenResponses input must be a string or item array".to_string()),
    }

    Ok(messages)
}

fn translate_input_item_to_message(item: &Value) -> Result<Option<Value>, String> {
    let item_type = item.get("type").and_then(Value::as_str).unwrap_or("message");
    match item_type {
        "message" => translate_message_item(item).map(Some),
        "function_call" => Ok(Some(translate_function_call_item(item))),
        "function_call_output" => Ok(Some(translate_function_call_output_item(item))),
        "item_reference" | "reasoning" => Ok(None),
        _ => Ok(None),
    }
}

fn translate_message_item(item: &Value) -> Result<Value, String> {
    let role = item
        .get("role")
        .and_then(Value::as_str)
        .unwrap_or("user");
    let content = item.get("content").unwrap_or(&Value::Null);

    let message = match role {
        "user" => json!({
            "role": "user",
            "content": translate_user_content(content),
        }),
        "assistant" => json!({
            "role": "assistant",
            "content": flatten_message_text(content),
        }),
        "system" | "developer" => json!({
            "role": role,
            "content": flatten_message_text(content),
        }),
        other => return Err(format!("Unsupported OpenResponses message role: {}", other)),
    };

    Ok(message)
}

fn translate_function_call_item(item: &Value) -> Value {
    json!({
        "role": "assistant",
        "content": Value::Null,
        "tool_calls": [
            {
                "id": item
                    .get("call_id")
                    .and_then(Value::as_str)
                    .map(ToString::to_string)
                    .unwrap_or_else(|| prefixed_id("call")),
                "type": "function",
                "function": {
                    "name": item.get("name").and_then(Value::as_str).unwrap_or("tool"),
                    "arguments": item.get("arguments").and_then(Value::as_str).unwrap_or("{}"),
                }
            }
        ]
    })
}

fn translate_function_call_output_item(item: &Value) -> Value {
    json!({
        "role": "tool",
        "tool_call_id": item.get("call_id").and_then(Value::as_str).unwrap_or(""),
        "content": flatten_tool_output(item.get("output").unwrap_or(&Value::Null)),
    })
}

fn translate_user_content(content: &Value) -> Value {
    match content {
        Value::Null => Value::String(String::new()),
        Value::String(text) => Value::String(text.clone()),
        Value::Array(parts) => {
            let translated_parts: Vec<Value> = parts
                .iter()
                .filter_map(translate_user_content_part)
                .collect();

            let has_non_text = translated_parts
                .iter()
                .any(|part| part.get("type").and_then(Value::as_str) != Some("text"));

            if !has_non_text {
                Value::String(
                    translated_parts
                        .iter()
                        .filter_map(|part| part.get("text").and_then(Value::as_str))
                        .collect::<Vec<_>>()
                        .join("\n"),
                )
            } else {
                Value::Array(translated_parts)
            }
        }
        _ => Value::String(String::new()),
    }
}

fn translate_user_content_part(part: &Value) -> Option<Value> {
    let part_type = part.get("type").and_then(Value::as_str)?;
    match part_type {
        "input_text" | "text" | "output_text" | "summary_text" | "reasoning_text" => {
            part.get("text")
                .and_then(Value::as_str)
                .map(|text| json!({ "type": "text", "text": text }))
        }
        "refusal" => part
            .get("refusal")
            .and_then(Value::as_str)
            .map(|text| json!({ "type": "text", "text": text })),
        "input_image" => Some(json!({
            "type": "image_url",
            "image_url": {
                "url": part.get("image_url").cloned().unwrap_or(Value::Null),
                "detail": part
                    .get("detail")
                    .cloned()
                    .unwrap_or_else(|| Value::String("auto".to_string())),
            }
        })),
        "input_file" => Some(json!({
            "type": "text",
            "text": describe_file_input(part),
        })),
        "input_video" => Some(json!({
            "type": "text",
            "text": format!(
                "Video input: {}",
                part.get("video_url").and_then(Value::as_str).unwrap_or("")
            ),
        })),
        _ => None,
    }
}

fn translate_tool_choice_for_upstream(body: &Value, tools: &mut Vec<Value>) -> Option<Value> {
    let tool_choice = body.get("tool_choice")?;

    match tool_choice {
        Value::String(value) => Some(Value::String(value.clone())),
        Value::Object(object) => {
            let choice_type = object.get("type").and_then(Value::as_str).unwrap_or("auto");
            match choice_type {
                "function" => object.get("name").and_then(Value::as_str).map(|name| {
                    json!({
                        "type": "function",
                        "function": { "name": name }
                    })
                }),
                "allowed_tools" => {
                    let allowed_names: HashSet<String> = object
                        .get("tools")
                        .and_then(Value::as_array)
                        .into_iter()
                        .flat_map(|items| items.iter())
                        .filter_map(|item| item.get("name").and_then(Value::as_str))
                        .map(ToString::to_string)
                        .collect();

                    if !allowed_names.is_empty() {
                        tools.retain(|tool| {
                            tool.get("name")
                                .and_then(Value::as_str)
                                .is_some_and(|name| allowed_names.contains(name))
                        });
                    }

                    let mode = object.get("mode").and_then(Value::as_str).unwrap_or("auto");
                    if mode == "none" {
                        Some(Value::String("none".to_string()))
                    } else if tools.len() == 1 && mode == "required" {
                        tools[0].get("name").and_then(Value::as_str).map(|name| {
                            json!({
                                "type": "function",
                                "function": { "name": name }
                            })
                        })
                    } else {
                        Some(Value::String(mode.to_string()))
                    }
                }
                _ => None,
            }
        }
        _ => None,
    }
}

fn translate_text_format_for_upstream(body: &Value) -> Option<Value> {
    let format = body
        .get("text")
        .and_then(|text| text.get("format"))
        .and_then(Value::as_object)?;

    match format.get("type").and_then(Value::as_str).unwrap_or("text") {
        "text" => None,
        "json_object" => Some(json!({ "type": "json_object" })),
        "json_schema" => Some(json!({
            "type": "json_schema",
            "json_schema": {
                "name": format.get("name").and_then(Value::as_str).unwrap_or("response"),
                "description": format.get("description").cloned().unwrap_or(Value::Null),
                "schema": format.get("schema").cloned().unwrap_or_else(|| json!({})),
                "strict": format.get("strict").and_then(Value::as_bool).unwrap_or(false),
            }
        })),
        _ => None,
    }
}

fn output_items_from_choice(choice: &Value) -> Vec<Value> {
    let mut output = Vec::new();

    let Some(message) = choice.get("message") else {
        return output;
    };

    let content = message
        .get("content")
        .and_then(Value::as_str)
        .unwrap_or("");
    let refusal = message
        .get("refusal")
        .and_then(Value::as_str)
        .unwrap_or("");

    if !content.is_empty() || !refusal.is_empty() {
        let item_id = prefixed_id("msg");
        let item_content = if !refusal.is_empty() && content.is_empty() {
            json!([
                {
                    "type": "refusal",
                    "refusal": refusal,
                }
            ])
        } else {
            json!([output_text_part(content)])
        };

        output.push(json!({
            "type": "message",
            "id": item_id,
            "status": "completed",
            "role": "assistant",
            "content": item_content,
        }));
    }

    if let Some(tool_calls) = message.get("tool_calls").and_then(Value::as_array) {
        for tool_call in tool_calls {
            let call_id = tool_call
                .get("id")
                .and_then(Value::as_str)
                .unwrap_or("");
            let function = tool_call.get("function").and_then(Value::as_object);
            let name = function
                .and_then(|value| value.get("name"))
                .and_then(Value::as_str)
                .unwrap_or("tool");
            let arguments = function
                .and_then(|value| value.get("arguments"))
                .and_then(Value::as_str)
                .unwrap_or("{}");

            output.push(tool_call_item(
                &prefixed_id("fc"),
                call_id,
                name,
                arguments,
                "completed",
            ));
        }
    }

    output
}

fn build_response_resource(
    request: &Value,
    upstream: &Value,
    response_id: &str,
    created_at: i64,
    completed_at: Option<i64>,
    status: &str,
    output: Vec<Value>,
    usage: Option<Value>,
) -> Value {
    json!({
        "id": response_id,
        "object": "response",
        "created_at": created_at,
        "completed_at": completed_at,
        "status": status,
        "incomplete_details": Value::Null,
        "model": request
            .get("model")
            .and_then(Value::as_str)
            .or_else(|| upstream.get("model").and_then(Value::as_str))
            .unwrap_or(""),
        "previous_response_id": request.get("previous_response_id").cloned().unwrap_or(Value::Null),
        "instructions": request.get("instructions").cloned().unwrap_or(Value::Null),
        "output": output,
        "error": Value::Null,
        "tools": request.get("tools").cloned().unwrap_or_else(|| json!([])),
        "tool_choice": normalize_tool_choice_for_response(request),
        "truncation": request
            .get("truncation")
            .cloned()
            .unwrap_or_else(|| Value::String("disabled".to_string())),
        "parallel_tool_calls": request
            .get("parallel_tool_calls")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        "text": normalize_text_for_response(request),
        "top_p": request.get("top_p").and_then(Value::as_f64).unwrap_or(1.0),
        "presence_penalty": request
            .get("presence_penalty")
            .and_then(Value::as_f64)
            .unwrap_or(0.0),
        "frequency_penalty": request
            .get("frequency_penalty")
            .and_then(Value::as_f64)
            .unwrap_or(0.0),
        "top_logprobs": request.get("top_logprobs").and_then(Value::as_i64).unwrap_or(0),
        "temperature": request
            .get("temperature")
            .and_then(Value::as_f64)
            .unwrap_or(1.0),
        "reasoning": request.get("reasoning").cloned().unwrap_or(Value::Null),
        "usage": usage.unwrap_or(Value::Null),
        "max_output_tokens": request.get("max_output_tokens").cloned().unwrap_or(Value::Null),
        "max_tool_calls": request.get("max_tool_calls").cloned().unwrap_or(Value::Null),
        "store": request.get("store").and_then(Value::as_bool).unwrap_or(false),
        "background": request.get("background").and_then(Value::as_bool).unwrap_or(false),
        "service_tier": request
            .get("service_tier")
            .cloned()
            .unwrap_or_else(|| Value::String("auto".to_string())),
        "metadata": request.get("metadata").cloned().unwrap_or_else(|| json!({})),
        "safety_identifier": request.get("safety_identifier").cloned().unwrap_or(Value::Null),
        "prompt_cache_key": request.get("prompt_cache_key").cloned().unwrap_or(Value::Null),
    })
}

fn normalize_tool_choice_for_response(request: &Value) -> Value {
    request
        .get("tool_choice")
        .cloned()
        .unwrap_or_else(|| Value::String("auto".to_string()))
}

fn normalize_text_for_response(request: &Value) -> Value {
    let verbosity = request
        .get("text")
        .and_then(|value| value.get("verbosity"))
        .cloned();

    let format = match request
        .get("text")
        .and_then(|value| value.get("format"))
        .and_then(Value::as_object)
    {
        Some(format) => match format.get("type").and_then(Value::as_str).unwrap_or("text") {
            "json_object" => json!({ "type": "json_object" }),
            "json_schema" => json!({
                "type": "json_schema",
                "name": format.get("name").and_then(Value::as_str).unwrap_or("response"),
                "description": format.get("description").cloned().unwrap_or(Value::Null),
                "schema": Value::Null,
                "strict": format.get("strict").and_then(Value::as_bool).unwrap_or(false),
            }),
            _ => json!({ "type": "text" }),
        },
        None => json!({ "type": "text" }),
    };

    let mut text = Map::new();
    text.insert("format".to_string(), format);
    if let Some(verbosity) = verbosity {
        text.insert("verbosity".to_string(), verbosity);
    }
    Value::Object(text)
}

fn flatten_message_text(content: &Value) -> String {
    match content {
        Value::Null => String::new(),
        Value::String(text) => text.clone(),
        Value::Array(parts) => parts
            .iter()
            .filter_map(extract_part_text)
            .collect::<Vec<_>>()
            .join("\n"),
        _ => String::new(),
    }
}

fn flatten_tool_output(output: &Value) -> String {
    match output {
        Value::String(text) => text.clone(),
        Value::Array(parts) => parts
            .iter()
            .filter_map(extract_part_text)
            .collect::<Vec<_>>()
            .join("\n"),
        other => other.to_string(),
    }
}

fn extract_part_text(part: &Value) -> Option<String> {
    let part_type = part.get("type").and_then(Value::as_str)?;
    match part_type {
        "input_text" | "text" | "output_text" | "summary_text" | "reasoning_text" => {
            part.get("text")
                .and_then(Value::as_str)
                .map(ToString::to_string)
        }
        "refusal" => part
            .get("refusal")
            .and_then(Value::as_str)
            .map(ToString::to_string),
        "input_image" => part
            .get("image_url")
            .and_then(Value::as_str)
            .map(|url| format!("Image input: {}", url)),
        "input_file" => Some(describe_file_input(part)),
        "input_video" => part
            .get("video_url")
            .and_then(Value::as_str)
            .map(|url| format!("Video input: {}", url)),
        _ => None,
    }
}

fn describe_file_input(part: &Value) -> String {
    let filename = part.get("filename").and_then(Value::as_str).unwrap_or("");
    let file_url = part.get("file_url").and_then(Value::as_str).unwrap_or("");

    match (filename.is_empty(), file_url.is_empty()) {
        (false, false) => format!("File input: {} ({})", filename, file_url),
        (false, true) => format!("File input: {}", filename),
        (true, false) => format!("File input: {}", file_url),
        (true, true) => "File input".to_string(),
    }
}

fn assistant_item(item_id: &str, text: &str, status: &str) -> Value {
    json!({
        "type": "message",
        "id": item_id,
        "status": status,
        "role": "assistant",
        "content": [output_text_part(text)],
    })
}

fn output_text_part(text: &str) -> Value {
    json!({
        "type": "output_text",
        "text": text,
        "annotations": [],
        "logprobs": [],
    })
}

fn tool_call_item(item_id: &str, call_id: &str, name: &str, arguments: &str, status: &str) -> Value {
    json!({
        "type": "function_call",
        "id": item_id,
        "call_id": call_id,
        "name": name,
        "arguments": arguments,
        "status": status,
    })
}

fn copy_if_present(source: &Value, target: &mut Map<String, Value>, keys: &[&str]) {
    for key in keys {
        if let Some(value) = source.get(*key) && !value.is_null() {
            target.insert((*key).to_string(), value.clone());
        }
    }
}

fn response_id_from_upstream(upstream: &Value) -> String {
    upstream
        .get("id")
        .and_then(Value::as_str)
        .map(|id| format!("resp_{}", id))
        .unwrap_or_else(|| prefixed_id("resp"))
}

fn prefixed_id(prefix: &str) -> String {
    format!("{}_{}", prefix, generate_db_id(24))
}

fn current_unix_seconds() -> i64 {
    Utc::now().timestamp()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn translates_basic_responses_request_to_chat_completions() {
        let request = json!({
            "model": "gpt-4.1",
            "instructions": "Be concise",
            "input": [
                { "type": "message", "role": "user", "content": "hello" }
            ],
            "tools": [
                {
                    "type": "function",
                    "name": "get_weather",
                    "description": "Weather",
                    "parameters": { "type": "object" }
                }
            ],
            "tool_choice": { "type": "function", "name": "get_weather" },
            "stream": true,
            "text": {
                "format": { "type": "json_object" }
            }
        });

        let translated = translate_responses_request(&request).expect("request should translate");

        assert_eq!(translated["messages"][0]["role"], "system");
        assert_eq!(translated["messages"][1]["role"], "user");
        assert_eq!(translated["tool_choice"]["function"]["name"], "get_weather");
        assert_eq!(translated["response_format"]["type"], "json_object");
        assert_eq!(translated["stream"], true);
    }

    #[test]
    fn translates_non_stream_chat_completion_response() {
        let request = json!({
            "model": "gpt-4.1",
            "tools": [],
            "metadata": { "team": "a" }
        });
        let upstream = json!({
            "id": "chatcmpl_123",
            "created": 1710000000,
            "model": "gpt-4.1",
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "hello world"
                    }
                }
            ],
            "usage": {
                "prompt_tokens": 3,
                "completion_tokens": 2,
                "prompt_tokens_details": {
                    "cached_tokens": 1
                }
            }
        });

        let translated = translate_chat_completions_response(&request, &upstream);

        assert_eq!(translated["object"], "response");
        assert_eq!(translated["status"], "completed");
        assert_eq!(translated["output"][0]["type"], "message");
        assert_eq!(translated["output"][0]["content"][0]["type"], "output_text");
        assert_eq!(translated["usage"]["input_tokens"], 3);
        assert_eq!(translated["usage"]["input_tokens_details"]["cached_tokens"], 1);
    }

    #[test]
    fn translates_streaming_text_deltas_to_openresponses_events() {
        let request = json!({
            "model": "gpt-4.1",
            "tools": []
        });
        let mut translator = OpenResponsesStreamTranslator::new(&request);

        let initial = translator.take_initial_events();
        let deltas = translator.process_chunk(&json!({
            "choices": [
                {
                    "delta": {
                        "role": "assistant",
                        "content": "Hello"
                    }
                }
            ]
        }));
        translator.capture_usage(&json!({
            "usage": {
                "prompt_tokens": 3,
                "completion_tokens": 1
            }
        }));
        let finished = translator.finish();

        assert_eq!(initial[0]["type"], "response.created");
        assert_eq!(initial[1]["type"], "response.in_progress");
        assert_eq!(deltas[0]["type"], "response.output_item.added");
        assert_eq!(deltas[1]["type"], "response.content_part.added");
        assert_eq!(deltas[2]["type"], "response.output_text.delta");
        assert_eq!(finished.last().expect("has completion event")["type"], "response.completed");
    }
}