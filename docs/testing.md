# Testing & Verification Guide

## 1. Automated Unit & Integration Tests

### Rust Backend
To verify Rust modules, state machine transitions, SQLite migrations, and safety guard validations:

```powershell
Set-Location "src-tauri"
cargo test --test fsm_tests
```

### Frontend TypeScript & Bundler
To verify type integrity, syntax, and Vite production bundle generation:

```powershell
pnpm build
```

## 2. Acceptance Checklist Verification

- [x] **App opens without errors**: Frontend compiles into clean static assets (`dist/`), Tauri backend links with bundled SQLite and Win32 GDI.
- [x] **Window list loads**: `list_windows` enumerates visible non-minimized desktop windows with HWND and dimensions.
- [x] **User can select the local simulator**: Approved keywords (`Simulator`, `Desktop Vision`) flag safe targets.
- [x] **Screenshot capture works**: Win32 GDI BitBlt extracts pixel arrays and encodes into PNG base64 data URLs.
- [x] **OCR reads known text**: Tesseract CLI or integrated lab recognizer parses bounding boxes and word confidence values.
- [x] **OCR confidence is visible**: Token chips and confidence percentages display in the Screen Reader and Matcher panels.
- [x] **Exact phrase matching works**: Supports `contains`, `exact`, `case_insensitive`, and `all_required`.
- [x] **Unknown state stops workflow**: If confidence < threshold or phrases differ, state candidate is `UNKNOWN`, halting transitions.
- [x] **Timeout stops workflow**: Configurable per-step timeouts (default 10s-15s) trigger safety stops on stalling.
- [x] **Closed simulator stops workflow**: HWND validity check (`IsWindow`) aborts actions if the target window closes.
- [x] **Wrong foreground window blocks actions**: Safety guard verifies `GetForegroundWindow() == target_hwnd`.
- [x] **Dry-run mode performs no clicks**: Flag logs intended actions without sending Windows input messages.
- [x] **Emergency Stop cancels all tasks**: Prominent red button and `Escape` key immediately trip atomic lock flag.
- [x] **Activity logs show each state transition**: SQLite `activity_logs` records timestamps, levels, and payloads.
- [x] **SQLite data survives app restart**: `automation_lab.db` holds persistent settings and workflow definitions.
