use crate::safety;
use serde::{Deserialize, Serialize};
use windows::Win32::Foundation::{HWND, LPARAM, RECT, WPARAM};
use windows::Win32::UI::WindowsAndMessaging::{
    GetWindowRect, PostMessageW, WM_LBUTTONDOWN, WM_LBUTTONUP,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulatorActionRequest {
    pub target_hwnd: isize,
    pub action: String,
    pub x_percent: Option<f32>,
    pub y_percent: Option<f32>,
    pub dry_run: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulatorActionResult {
    pub success: bool,
    pub action: String,
    pub message: String,
    pub target_hwnd: isize,
    pub dry_run: bool,
}

pub fn execute_simulator_action(
    req: &SimulatorActionRequest,
    approved_titles: &[String],
) -> Result<SimulatorActionResult, String> {
    // 1. Strict safety guard check
    safety::validate_safety_guards(req.target_hwnd, approved_titles)?;

    if req.dry_run {
        return Ok(SimulatorActionResult {
            success: true,
            action: req.action.clone(),
            message: format!("[DRY RUN] Would execute action '{}' at simulator target.", req.action),
            target_hwnd: req.target_hwnd,
            dry_run: true,
        });
    }

    let hwnd = HWND(req.target_hwnd as _);
    let mut rect = RECT::default();
    unsafe {
        let _ = GetWindowRect(hwnd, &mut rect);
    }
    let width = (rect.right - rect.left).max(1) as f32;
    let height = (rect.bottom - rect.top).max(1) as f32;

    // Relative coordinates for buttons in standard simulator layout
    let (target_x, target_y) = match req.action.as_str() {
        "CLICK_START_TEST" => (width * 0.5, height * 0.75),
        "CLICK_FIND_SCENARIO" => (width * 0.5, height * 0.65),
        "CLICK_BEGIN_TEST" => (width * 0.5, height * 0.8),
        "CLICK_SCENE_TARGET" => (width * 0.5, height * 0.5), // Center of safe interaction zone
        "CLICK_RETURN_HOME" => (width * 0.5, height * 0.85),
        _ => {
            let px = req.x_percent.unwrap_or(0.5).clamp(0.1, 0.9);
            let py = req.y_percent.unwrap_or(0.5).clamp(0.1, 0.9);
            (width * px, height * py)
        }
    };

    let client_x = target_x as i32;
    let client_y = target_y as i32;
    let lparam = LPARAM(((client_y << 16) | (client_x & 0xFFFF)) as isize);

    unsafe {
        // Send click to simulator message queue
        let _ = PostMessageW(hwnd, WM_LBUTTONDOWN, WPARAM(1), lparam);
        std::thread::sleep(std::time::Duration::from_millis(60));
        let _ = PostMessageW(hwnd, WM_LBUTTONUP, WPARAM(0), lparam);
    }

    Ok(SimulatorActionResult {
        success: true,
        action: req.action.clone(),
        message: format!(
            "Executed simulator test action '{}' at ({}, {}).",
            req.action, client_x, client_y
        ),
        target_hwnd: req.target_hwnd,
        dry_run: false,
    })
}
