pub mod chat_completions;
pub mod embeddings;
pub mod health;
pub mod messages;
pub mod models;
pub mod responses;

pub use chat_completions::chat_completions_handler;
pub use embeddings::embeddings_handler;
pub use health::health_check_handler;
pub use messages::messages_handler;
pub use models::list_models_handler;
pub use responses::responses_handler;
