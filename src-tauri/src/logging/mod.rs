use crate::storage::Database;
use std::sync::Arc;

pub struct Logger {
    db: Arc<Database>,
}

impl Logger {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub fn log(&self, level: &str, event_type: &str, message: &str, details: Option<&str>) {
        match level {
            "ERROR" => tracing::error!("{}: {}", event_type, message),
            "WARN" => tracing::warn!("{}: {}", event_type, message),
            _ => tracing::info!("{}: {}", event_type, message),
        }

        let _ = self.db.insert_log(None, level, event_type, message, details);
    }

    pub fn info(&self, event_type: &str, message: &str) {
        self.log("INFO", event_type, message, None);
    }

    pub fn warn(&self, event_type: &str, message: &str) {
        self.log("WARN", event_type, message, None);
    }

    pub fn error(&self, event_type: &str, message: &str, details: Option<&str>) {
        self.log("ERROR", event_type, message, details);
    }

    pub fn action(&self, message: &str, details: Option<&str>) {
        self.log("ACTION", "SIMULATOR_ACTION", message, details);
    }
}
