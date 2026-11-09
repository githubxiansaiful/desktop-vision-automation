use crate::capture::{self, CaptureResult, WindowInfo};
use crate::logging::Logger;
use crate::ocr::{self, OcrConfig, OcrResult};
use crate::safety;
use crate::simulator::{self, SimulatorActionRequest, SimulatorActionResult};
use crate::storage::Database;
use crate::workflow::Workflow;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;

pub struct AppState {
    pub db: Arc<Database>,
    pub logger: Arc<Logger>,
    pub selected_window_id: Mutex<Option<isize>>,
    pub selected_window_title: Mutex<Option<String>>,
    pub app_status: Mutex<String>,
    pub detected_state: Mutex<String>,
    pub active_workflow: Mutex<Workflow>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppStatusResponse {
    pub status: String,
    pub selected_window: Option<String>,
    pub detected_state: String,
    pub is_emergency_stopped: bool,
    pub last_ocr_text: Option<String>,
    pub active_workflow_name: String,
}

#[tauri::command]
pub fn list_windows() -> Vec<WindowInfo> {
    capture::enumerate_windows()
}

#[tauri::command]
pub fn select_test_window(
    id: isize,
    title: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut win_id = state.selected_window_id.lock().unwrap();
    let mut win_title = state.selected_window_title.lock().unwrap();

    *win_id = Some(id);
    *win_title = Some(title.clone());

    state.logger.info(
        "WINDOW_SELECTED",
        &format!("Target window selected: '{}' (HWND: {})", title, id),
    );

    Ok(format!("Window '{}' selected as active test target.", title))
}

#[tauri::command]
pub fn capture_test_window(
    window_id: Option<isize>,
    state: State<'_, AppState>,
) -> Result<CaptureResult, String> {
    if safety::is_emergency_stopped() {
        return Err("Operation blocked: Emergency Stop is active.".to_string());
    }

    let target = window_id
        .or_else(|| *state.selected_window_id.lock().unwrap())
        .ok_or_else(|| "No test window currently selected.".to_string())?;

    let res = capture::capture_window(target)?;
    state.logger.info("SCREEN_CAPTURED", &format!("Captured screenshot for HWND {}", target));
    Ok(res)
}

#[tauri::command]
pub fn run_ocr(
    image_base64: String,
    target_phrases: Option<Vec<String>>,
    state: State<'_, AppState>,
) -> Result<OcrResult, String> {
    let clean_b64 = if let Some(idx) = image_base64.find(',') {
        &image_base64[idx + 1..]
    } else {
        &image_base64
    };

    let image_bytes = base64::Engine::decode(
        &base64::engine::general_purpose::STANDARD,
        clean_b64,
    )
    .map_err(|e| format!("Base64 decoding failed: {}", e))?;

    let settings = state.db.get_settings().unwrap_or_default();
    let tesseract_path = settings.get("tesseract_path").filter(|s| !s.is_empty()).cloned();
    let min_conf: f32 = settings
        .get("min_confidence")
        .and_then(|v| v.parse().ok())
        .unwrap_or(80.0);

    let config = OcrConfig {
        tesseract_path,
        min_confidence: min_conf,
        target_phrases: target_phrases.unwrap_or_default(),
    };

    let result = ocr::run_ocr(&image_bytes, &config)?;

    // Detect state candidate
    let (candidate, _conf) = ocr::detect_state_candidate(&result, min_conf);
    {
        let mut cur_state = state.detected_state.lock().unwrap();
        *cur_state = candidate.clone();
    }

    state.logger.info(
        "OCR_PROCESSED",
        &format!("OCR extracted {} words. State candidate: {}", result.words.len(), candidate),
    );

    Ok(result)
}

#[tauri::command]
pub fn get_current_state(state: State<'_, AppState>) -> String {
    state.detected_state.lock().unwrap().clone()
}

#[tauri::command]
pub fn get_app_status(state: State<'_, AppState>) -> AppStatusResponse {
    let status = state.app_status.lock().unwrap().clone();
    let selected_window = state.selected_window_title.lock().unwrap().clone();
    let detected_state = state.detected_state.lock().unwrap().clone();
    let active_wf = state.active_workflow.lock().unwrap().name.clone();

    AppStatusResponse {
        status,
        selected_window,
        detected_state,
        is_emergency_stopped: safety::is_emergency_stopped(),
        last_ocr_text: None,
        active_workflow_name: active_wf,
    }
}

#[tauri::command]
pub fn emergency_stop(state: State<'_, AppState>) -> String {
    safety::trigger_emergency_stop();
    {
        let mut s = state.app_status.lock().unwrap();
        *s = "Emergency Stop".to_string();
    }
    state.logger.error("EMERGENCY_STOP", "GLOBAL EMERGENCY STOP ENGAGED BY USER", None);
    "EMERGENCY STOP ENGAGED. All tasks halted.".to_string()
}

#[tauri::command]
pub fn reset_emergency_stop(state: State<'_, AppState>) -> String {
    safety::reset_emergency_stop();
    {
        let mut s = state.app_status.lock().unwrap();
        *s = "Idle".to_string();
    }
    state.logger.info("EMERGENCY_STOP_RESET", "Emergency Stop lock cleared.");
    "Emergency Stop cleared. Ready.".to_string()
}

#[tauri::command]
pub fn stop_all_tasks(state: State<'_, AppState>) -> String {
    {
        let mut s = state.app_status.lock().unwrap();
        *s = "Stopped".to_string();
    }
    state.logger.info("TASKS_STOPPED", "User stopped all active automation tasks.");
    "Tasks stopped.".to_string()
}

#[tauri::command]
pub fn start_simulator_test(state: State<'_, AppState>) -> Result<String, String> {
    if safety::is_emergency_stopped() {
        return Err("Cannot start: Emergency Stop is actively engaged.".to_string());
    }

    let win_id = *state.selected_window_id.lock().unwrap();
    if win_id.is_none() {
        return Err("Please select a target simulator window before starting a test.".to_string());
    }

    {
        let mut s = state.app_status.lock().unwrap();
        *s = "Running Test".to_string();
    }

    state.logger.info("TEST_STARTED", "Simulator test workflow started.");
    Ok("Test workflow started.".to_string())
}

#[tauri::command]
pub fn pause_simulator_test(state: State<'_, AppState>) -> Result<String, String> {
    {
        let mut s = state.app_status.lock().unwrap();
        *s = "Paused".to_string();
    }
    state.logger.info("TEST_PAUSED", "Simulator test paused.");
    Ok("Test paused.".to_string())
}

#[tauri::command]
pub fn resume_simulator_test(state: State<'_, AppState>) -> Result<String, String> {
    if safety::is_emergency_stopped() {
        return Err("Cannot resume while Emergency Stop is engaged.".to_string());
    }
    {
        let mut s = state.app_status.lock().unwrap();
        *s = "Running Test".to_string();
    }
    state.logger.info("TEST_RESUMED", "Simulator test resumed.");
    Ok("Test resumed.".to_string())
}

#[tauri::command]
pub fn execute_simulator_action(
    req: SimulatorActionRequest,
    state: State<'_, AppState>,
) -> Result<SimulatorActionResult, String> {
    let settings = state.db.get_settings().unwrap_or_default();
    let approved_raw = settings
        .get("approved_window_titles")
        .cloned()
        .unwrap_or_else(|| "Simulator,Desktop Vision,Vision Lab".to_string());
    let approved_titles: Vec<String> = approved_raw.split(',').map(|s| s.trim().to_string()).collect();

    let result = simulator::execute_simulator_action(&req, &approved_titles)?;

    state.logger.action(
        &format!("Executed simulator action '{}'", req.action),
        Some(&format!("HWND: {}, DryRun: {}", req.target_hwnd, req.dry_run)),
    );

    Ok(result)
}

#[tauri::command]
pub fn get_activity_logs(
    limit: Option<usize>,
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    state.db.get_logs(limit.unwrap_or(100)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_activity_logs(state: State<'_, AppState>) -> Result<String, String> {
    state.db.clear_logs().map_err(|e| e.to_string())?;
    state.logger.info("LOGS_CLEARED", "Activity log history cleared by user.");
    Ok("Logs cleared successfully.".to_string())
}

#[tauri::command]
pub fn get_settings(
    state: State<'_, AppState>,
) -> Result<std::collections::HashMap<String, String>, String> {
    state.db.get_settings().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_setting(
    key: String,
    value: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    state.db.save_setting(&key, &value).map_err(|e| e.to_string())?;
    state.logger.info("SETTING_UPDATED", &format!("Setting '{}' updated.", key));
    Ok(format!("Setting '{}' saved.", key))
}

#[tauri::command]
pub fn get_workflows(state: State<'_, AppState>) -> Result<Vec<Workflow>, String> {
    // Return active default workflow
    let wf = state.active_workflow.lock().unwrap().clone();
    Ok(vec![wf])
}

#[tauri::command]
pub fn check_ocr_status(state: State<'_, AppState>) -> serde_json::Value {
    let settings = state.db.get_settings().unwrap_or_default();
    let tesseract_path = settings.get("tesseract_path").filter(|s| !s.is_empty()).map(|s| s.as_str());
    let (installed, details) = ocr::check_tesseract_installed(tesseract_path);

    serde_json::json!({
        "tesseract_detected": installed,
        "details": details,
        "fallback_active": !installed
    })
}
