use serde_json::Value;
use tiktoken_rs::bpe_for_model;

/// Count tokens in a message content string using tiktoken.
/// Falls back to a simple character-based estimation if tiktoken initialization fails.
pub fn count_tokens_for_content(content: &str, model: &str) -> i32 {
    if let Ok(bpe) = bpe_for_model(model) {
        let tokens = bpe.encode_ordinary(content);
        return tokens.len() as i32;
    }

    if let Ok(bpe) = bpe_for_model("gpt-3.5-turbo") {
        let tokens = bpe.encode_ordinary(content);
        return tokens.len() as i32;
    }

    (content.len() as f32 / 4.0).ceil() as i32
}

/// Count input tokens from the messages array in the request body.
/// Supports both OpenAI and Anthropic message formats.
pub fn count_input_tokens(body: &Value, model: &str) -> i32 {
    let mut total_tokens = 0;

    if let Some(messages) = body.get("messages").and_then(|m| m.as_array()) {
        for message in messages {
            if let Some(content) = message.get("content") {
                match content {
                    Value::String(text) => {
                        total_tokens += count_tokens_for_content(text, model);
                    }
                    Value::Array(items) => {
                        for item in items {
                            if let Some(text) = item.get("text").and_then(|t| t.as_str()) {
                                total_tokens += count_tokens_for_content(text, model);
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    let message_count = body
        .get("messages")
        .and_then(|m| m.as_array())
        .map(|arr| arr.len())
        .unwrap_or(0);

    total_tokens += (message_count * 4) as i32;

    if let Some(system) = body.get("system").and_then(|s| s.as_str()) {
        total_tokens += count_tokens_for_content(system, model);
    }

    total_tokens.max(1)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_count_input_tokens_simple() {
        let body = json!({
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "user", "content": "Hello"}
            ]
        });

        let tokens = count_input_tokens(&body, "gpt-3.5-turbo");
        assert!(tokens > 0);
    }

    #[test]
    fn test_count_input_tokens_multiple_messages() {
        let body = json!({
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are helpful"},
                {"role": "user", "content": "Hello world"},
                {"role": "assistant", "content": "Hi"}
            ]
        });

        let tokens = count_input_tokens(&body, "gpt-3.5-turbo");
        assert!(tokens > 0);
    }

    #[test]
    fn test_count_tokens_for_content() {
        // Basic content that should return some tokens
        let tokens = count_tokens_for_content("Hello, world!", "gpt-3.5-turbo");
        assert!(tokens > 0);
    }
}
