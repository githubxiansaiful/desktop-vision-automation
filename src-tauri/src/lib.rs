pub mod capture;
pub mod commands;
pub mod logging;
pub mod ocr;
pub mod safety;
pub mod simulator;
pub mod storage;
pub mod workflow;

use commands::AppState;
use logging::Logger;
use std::sync::{Arc, Mutex};
use storage::Database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();
            let app_data_dir = app_handle
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("./data"));

            let db = Arc::new(
                Database::init(app_data_dir).expect("Failed to initialize SQLite database"),
            );
            let logger = Arc::new(Logger::new(Arc::clone(&db)));
            let default_wf = workflow::get_default_workflow();

            let app_state = AppState {
                db,
                logger,
                selected_window_id: Mutex::new(None),
                selected_window_title: Mutex::new(None),
                app_status: Mutex::new("Idle".to_string()),
                detected_state: Mutex::new("IDLE".to_string()),
                active_workflow: Mutex::new(default_wf),
            };

            app.manage(app_state);
            tracing::info!("Desktop Vision Automation Lab initialized successfully.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_windows,
            commands::select_test_window,
            commands::capture_test_window,
            commands::run_ocr,
            commands::get_current_state,
            commands::get_app_status,
            commands::emergency_stop,
            commands::reset_emergency_stop,
            commands::stop_all_tasks,
            commands::start_simulator_test,
            commands::pause_simulator_test,
            commands::resume_simulator_test,
            commands::execute_simulator_action,
            commands::get_activity_logs,
            commands::clear_activity_logs,
            commands::get_settings,
            commands::save_setting,
            commands::get_workflows,
            commands::check_ocr_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
