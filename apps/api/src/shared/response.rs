use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    pub code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
}

impl<T> ApiResponse<T>
where
    T: Serialize,
{
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            message: "OK".to_string(),
            code: "SUCCESS".to_string(),
            data: Some(data),
        }
    }

    pub fn error(message: &str, code: &str) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            message: message.to_string(),
            code: code.to_string(),
            data: None,
        }
    }

    pub fn to_res(self, status: StatusCode) -> Response {
        (status, Json(self)).into_response()
    }
}

#[derive(Debug, Serialize)]
pub struct ListResponse<T> {
    pub object: String,
    pub data: Vec<T>,
}

impl<T> ListResponse<T> {
    pub fn new(data: Vec<T>) -> Self {
        Self {
            object: "list".to_string(),
            data,
        }
    }
}
