use rusqlite::{params, Connection, Result as SqlResult};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn init(app_data_dir: PathBuf) -> SqlResult<Self> {
        std::fs::create_dir_all(&app_data_dir).ok();
        let db_path = app_data_dir.join("automation_lab.db");
        let conn = Connection::open(db_path)?;

        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };

        db.migrate()?;
        db.seed_defaults()?;

        Ok(db)
    }

    pub fn migrate(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS workflows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                enabled INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS workflow_steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workflow_id INTEGER NOT NULL,
                step_order INTEGER NOT NULL,
                name TEXT NOT NULL,
                expected_state TEXT NOT NULL,
                required_phrases TEXT NOT NULL,
                minimum_confidence REAL NOT NULL,
                timeout_ms INTEGER NOT NULL,
                retry_limit INTEGER NOT NULL,
                simulator_action TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS test_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workflow_id INTEGER,
                status TEXT NOT NULL,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                result TEXT,
                error_message TEXT
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                level TEXT NOT NULL,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                details_json TEXT,
                created_at TEXT NOT NULL
            );
            ",
        )?;

        Ok(())
    }

    pub fn seed_defaults(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();

        // Seed default settings if missing
        let default_settings = [
            ("min_confidence", "80.0"),
            ("capture_interval_ms", "1500"),
            ("auto_save_screenshots", "false"),
            ("dry_run_mode", "false"),
            ("approved_window_titles", "Simulator,Desktop Vision,Vision Lab,Test Target"),
            ("tesseract_path", ""),
        ];

        for (k, v) in default_settings {
            conn.execute(
                "INSERT OR IGNORE INTO settings (setting_key, setting_value, updated_at) VALUES (?1, ?2, datetime('now'))",
                params![k, v],
            )?;
        }

        // Seed default workflow if missing
        let mut count_stmt = conn.prepare("SELECT COUNT(*) FROM workflows")?;
        let count: i64 = count_stmt.query_row([], |r| r.get(0))?;

        if count == 0 {
            let default_wf = crate::workflow::get_default_workflow();
            conn.execute(
                "INSERT INTO workflows (name, description, enabled, created_at, updated_at) VALUES (?1, ?2, 1, datetime('now'), datetime('now'))",
                params![default_wf.name, default_wf.description],
            )?;
            let wf_id = conn.last_insert_rowid();

            for step in default_wf.steps {
                let phrases_json = serde_json::to_string(&step.required_phrases).unwrap_or_default();
                conn.execute(
                    "INSERT INTO workflow_steps (workflow_id, step_order, name, expected_state, required_phrases, minimum_confidence, timeout_ms, retry_limit, simulator_action, created_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'))",
                    params![
                        wf_id,
                        step.step_order,
                        step.name,
                        step.expected_state,
                        phrases_json,
                        step.minimum_confidence,
                        step.timeout_ms as i64,
                        step.retry_limit,
                        step.simulator_action,
                    ],
                )?;
            }
        }

        Ok(())
    }

    pub fn insert_log(
        &self,
        session_id: Option<&str>,
        level: &str,
        event_type: &str,
        message: &str,
        details_json: Option<&str>,
    ) -> SqlResult<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO activity_logs (session_id, level, event_type, message, details_json, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))",
            params![session_id, level, event_type, message, details_json],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_logs(&self, limit: usize) -> SqlResult<Vec<serde_json::Value>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, session_id, level, event_type, message, details_json, created_at
             FROM activity_logs ORDER BY id DESC LIMIT ?1",
        )?;

        let rows = stmt.query_map(params![limit as i64], |row| {
            let id: i64 = row.get(0)?;
            let session_id: Option<String> = row.get(1)?;
            let level: String = row.get(2)?;
            let event_type: String = row.get(3)?;
            let message: String = row.get(4)?;
            let details_json: Option<String> = row.get(5)?;
            let created_at: String = row.get(6)?;

            Ok(serde_json::json!({
                "id": id,
                "session_id": session_id,
                "level": level,
                "event_type": event_type,
                "message": message,
                "details_json": details_json,
                "created_at": created_at,
            }))
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn clear_logs(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM activity_logs", [])?;
        Ok(())
    }

    pub fn save_setting(&self, key: &str, value: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO settings (setting_key, setting_value, updated_at) VALUES (?1, ?2, datetime('now'))
             ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_settings(&self) -> SqlResult<std::collections::HashMap<String, String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT setting_key, setting_value FROM settings")?;
        let rows = stmt.query_map([], |row| {
            let k: String = row.get(0)?;
            let v: String = row.get(1)?;
            Ok((k, v))
        })?;

        let mut map = std::collections::HashMap::new();
        for r in rows {
            let (k, v) = r?;
            map.insert(k, v);
        }
        Ok(map)
    }
}
