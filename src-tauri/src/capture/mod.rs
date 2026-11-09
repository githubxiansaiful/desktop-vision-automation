use base64::Engine;
use image::{ImageBuffer, Rgba};
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use windows::Win32::Foundation::{BOOL, HWND, LPARAM, RECT};
use windows::Win32::Graphics::Gdi::{
    BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetDIBits,
    ReleaseDC, SelectObject, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, SRCCOPY,
};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetClassNameW, GetForegroundWindow, GetWindowRect, GetWindowTextLengthW,
    GetWindowTextW, IsIconic, IsWindow, IsWindowVisible,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowInfo {
    pub id: isize,
    pub title: String,
    pub class_name: String,
    pub is_foreground: bool,
    pub width: i32,
    pub height: i32,
    pub is_minimized: bool,
    pub is_approved_simulator: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureResult {
    pub width: u32,
    pub height: u32,
    pub image_base64: String,
    pub timestamp: String,
}

pub fn enumerate_windows() -> Vec<WindowInfo> {
    let mut windows: Vec<WindowInfo> = Vec::new();
    let ptr = &mut windows as *mut Vec<WindowInfo>;

    unsafe {
        let _ = EnumWindows(Some(enum_windows_callback), LPARAM(ptr as isize));
    }

    windows
}

unsafe extern "system" fn enum_windows_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
    unsafe {
        if !IsWindow(hwnd).as_bool() || !IsWindowVisible(hwnd).as_bool() {
            return BOOL(1);
        }

        let length = GetWindowTextLengthW(hwnd);
        if length == 0 {
            return BOOL(1);
        }

        let mut title_buf = vec![0u16; (length + 1) as usize];
        GetWindowTextW(hwnd, &mut title_buf);
        let title = String::from_utf16_lossy(&title_buf[..length as usize]);

        // Skip empty or common background shell windows
        if title.trim().is_empty() || title == "Program Manager" || title == "Settings" {
            return BOOL(1);
        }

        let mut class_buf = [0u16; 256];
        let class_len = GetClassNameW(hwnd, &mut class_buf);
        let class_name = String::from_utf16_lossy(&class_buf[..class_len as usize]);

        let mut rect = RECT::default();
        let _ = GetWindowRect(hwnd, &mut rect);
        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;

        if width <= 0 || height <= 0 {
            return BOOL(1);
        }

        let fg_hwnd = GetForegroundWindow();
        let is_foreground = fg_hwnd == hwnd;
        let is_minimized = IsIconic(hwnd).as_bool();

        let title_lower = title.to_lowercase();
        let is_approved_simulator = title_lower.contains("simulator")
            || title_lower.contains("desktop vision")
            || title_lower.contains("vision lab")
            || title_lower.contains("test scene")
            || title_lower.contains("test target");

        let info = WindowInfo {
            id: hwnd.0 as isize,
            title,
            class_name,
            is_foreground,
            width,
            height,
            is_minimized,
            is_approved_simulator,
        };

        let windows_vec = &mut *(lparam.0 as *mut Vec<WindowInfo>);
        windows_vec.push(info);

        BOOL(1)
    }
}

pub fn capture_window(target_hwnd: isize) -> Result<CaptureResult, String> {
    let hwnd = HWND(target_hwnd as _);

    unsafe {
        if !IsWindow(hwnd).as_bool() {
            return Err("Target window does not exist or has been closed.".to_string());
        }

        let mut rect = RECT::default();
        if GetWindowRect(hwnd, &mut rect).is_err() {
            return Err("Failed to get window rect.".to_string());
        }

        let width = (rect.right - rect.left).max(1) as i32;
        let height = (rect.bottom - rect.top).max(1) as i32;

        let hdc_screen = GetDC(HWND(std::ptr::null_mut()));
        if hdc_screen.is_invalid() {
            return Err("Failed to obtain screen DC.".to_string());
        }

        let hdc_mem = CreateCompatibleDC(hdc_screen);
        let hbm = CreateCompatibleBitmap(hdc_screen, width, height);
        let old_obj = SelectObject(hdc_mem, hbm);

        // BitBlt directly from screen at window coordinates
        let _ = BitBlt(hdc_mem, 0, 0, width, height, hdc_screen, rect.left, rect.top, SRCCOPY);

        let mut bmi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: width,
                biHeight: -height, // top-down
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                ..Default::default()
            },
            ..Default::default()
        };

        let mut raw_pixels = vec![0u8; (width * height * 4) as usize];
        let lines_copied = GetDIBits(
            hdc_mem,
            hbm,
            0,
            height as u32,
            Some(raw_pixels.as_mut_ptr() as *mut _),
            &mut bmi,
            DIB_RGB_COLORS,
        );

        // Cleanup GDI objects immediately
        SelectObject(hdc_mem, old_obj);
        let _ = DeleteObject(hbm);
        let _ = DeleteDC(hdc_mem);
        ReleaseDC(HWND(std::ptr::null_mut()), hdc_screen);

        if lines_copied == 0 {
            return Err("Failed to read bitmap pixels from DC.".to_string());
        }

        // Convert BGRA to RGBA
        for chunk in raw_pixels.chunks_exact_mut(4) {
            let b = chunk[0];
            let r = chunk[2];
            chunk[0] = r;
            chunk[2] = b;
            chunk[3] = 255; // Force full alpha
        }

        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_raw(width as u32, height as u32, raw_pixels)
                .ok_or_else(|| "Failed to construct ImageBuffer from raw pixels.".to_string())?;

        let mut png_bytes = Vec::new();
        let mut cursor = Cursor::new(&mut png_bytes);
        img.write_to(&mut cursor, image::ImageFormat::Png)
            .map_err(|e| format!("PNG encoding error: {}", e))?;

        let b64 = base64::engine::general_purpose::STANDARD.encode(&png_bytes);
        let data_url = format!("data:image/png;base64,{}", b64);

        Ok(CaptureResult {
            width: width as u32,
            height: height as u32,
            image_base64: data_url,
            timestamp: chrono::Utc::now().to_rfc3339(),
        })
    }
}
