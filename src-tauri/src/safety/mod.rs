use std::sync::atomic::{AtomicBool, Ordering};
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW, IsWindow};

static EMERGENCY_STOP_TRIGGERED: AtomicBool = AtomicBool::new(false);

pub fn trigger_emergency_stop() {
    EMERGENCY_STOP_TRIGGERED.store(true, Ordering::SeqCst);
    tracing::warn!("EMERGENCY STOP TRIGGERED! All automation and test tasks are terminated.");
}

pub fn reset_emergency_stop() {
    EMERGENCY_STOP_TRIGGERED.store(false, Ordering::SeqCst);
    tracing::info!("Emergency stop flag reset by operator.");
}

pub fn is_emergency_stopped() -> bool {
    EMERGENCY_STOP_TRIGGERED.load(Ordering::SeqCst)
}

/// Strict safety check performed before any capture or simulator action.
/// Rejects action if:
/// 1. Emergency stop flag is set
/// 2. Target window does not exist or has closed
/// 3. Target window is not the current foreground window
/// 4. Target window title is not in the approved list
pub fn validate_safety_guards(target_hwnd: isize, approved_titles: &[String]) -> Result<(), String> {
    if is_emergency_stopped() {
        return Err("Action blocked: Emergency Stop is actively engaged.".to_string());
    }

    let hwnd = HWND(target_hwnd as _);

    // 1. Check window validity
    unsafe {
        if !IsWindow(hwnd).as_bool() {
            return Err("Safety violation: Selected target window no longer exists or was closed.".to_string());
        }
    }

    // 2. Check window title
    let mut title_buf = [0u16; 512];
    let len = unsafe { GetWindowTextW(hwnd, &mut title_buf) };
    let current_title = String::from_utf16_lossy(&title_buf[..len as usize]);

    let title_matches = approved_titles.iter().any(|approved| {
        current_title.to_lowercase().contains(&approved.to_lowercase())
    });

    if !title_matches {
        return Err(format!(
            "Safety violation: Window title '{}' does not match any approved simulator target.",
            current_title
        ));
    }

    // 3. Check foreground target
    let fg_hwnd = unsafe { GetForegroundWindow() };
    if fg_hwnd != hwnd {
        let mut fg_buf = [0u16; 512];
        let fg_len = unsafe { GetWindowTextW(fg_hwnd, &mut fg_buf) };
        let fg_title = String::from_utf16_lossy(&fg_buf[..fg_len as usize]);
        return Err(format!(
            "Safety violation: Target window is not foreground. Active foreground window is '{}'.",
            fg_title
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_emergency_stop_lifecycle() {
        assert!(!is_emergency_stopped());
        trigger_emergency_stop();
        assert!(is_emergency_stopped());
        reset_emergency_stop();
        assert!(!is_emergency_stopped());
    }

    #[test]
    fn test_invalid_window_rejection() {
        let approved = vec!["Simulator".to_string()];
        let res = validate_safety_guards(0, &approved);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("no longer exists") || is_emergency_stopped());
    }
}
