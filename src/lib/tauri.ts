import { WindowInfo, CaptureResult, OcrResult, Workflow, AutomationStatus } from '@/types';

// Detect if running inside a Tauri WebView environment
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// Safe invoke wrapper
export async function invokeCommand<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  if (isTauriEnvironment()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<T>(cmd, args);
  }

  // Graceful browser fallback for development preview
  return mockInvoke<T>(cmd, args);
}

// In-memory mock state for dev/testing when running outside Tauri shell
let mockStatus: AutomationStatus = 'Idle';
let mockSelectedWindow: WindowInfo | null = {
  id: 1001,
  title: 'Vision Lab Test Target [Simulator]',
  class_name: 'SimulatorWindowClass',
  is_foreground: true,
  width: 1280,
  height: 720,
  is_minimized: false,
  is_approved_simulator: true,
};
let mockDetectedState = 'SIMULATOR_HOME';
let mockIsEmergencyStopped = false;

const mockWindows: WindowInfo[] = [
  {
    id: 1001,
    title: 'Vision Lab Test Target [Simulator]',
    class_name: 'SimulatorWindowClass',
    is_foreground: true,
    width: 1280,
    height: 720,
    is_minimized: false,
    is_approved_simulator: true,
  },
  {
    id: 1002,
    title: 'Desktop Vision Lab - Controller',
    class_name: 'Chrome_WidgetWin_1',
    is_foreground: false,
    width: 1400,
    height: 900,
    is_minimized: false,
    is_approved_simulator: false,
  },
  {
    id: 1003,
    title: 'Visual Studio Code',
    class_name: 'Chrome_WidgetWin_1',
    is_foreground: false,
    width: 1920,
    height: 1080,
    is_minimized: false,
    is_approved_simulator: false,
  },
];

async function mockInvoke<T>(cmd: string, args: Record<string, unknown>): Promise<T> {
  await new Promise((r) => setTimeout(r, 80));

  switch (cmd) {
    case 'list_windows':
      return mockWindows as unknown as T;

    case 'select_test_window': {
      const win = mockWindows.find((w) => w.id === args.id) || null;
      mockSelectedWindow = win;
      return `Selected window: ${args.title}` as unknown as T;
    }

    case 'capture_test_window': {
      const capture: CaptureResult = {
        width: 1280,
        height: 720,
        image_base64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="45%" fill="%2338bdf8" font-size="32" font-family="sans-serif" text-anchor="middle">Local Test Simulator</text><text x="50%" y="55%" fill="%2394a3b8" font-size="20" font-family="sans-serif" text-anchor="middle">Scene: SIMULATOR_HOME</text></svg>',
        timestamp: new Date().toISOString(),
      };
      return capture as unknown as T;
    }

    case 'run_ocr': {
      const phrases = (args.target_phrases as string[]) || [];
      const ocrRes: OcrResult = {
        text: 'Start Test Simulator Home Menu',
        confidence: 94.8,
        capture_timestamp: new Date().toISOString(),
        width: 1280,
        height: 720,
        words: [
          { text: 'Start', confidence: 96.0, bbox: { x: 540, y: 520, width: 80, height: 35 } },
          { text: 'Test', confidence: 97.2, bbox: { x: 630, y: 520, width: 75, height: 35 } },
          { text: 'Simulator', confidence: 92.1, bbox: { x: 500, y: 250, width: 140, height: 40 } },
          { text: 'Home', confidence: 94.0, bbox: { x: 650, y: 250, width: 90, height: 40 } },
        ],
        matched_phrases: phrases.filter((p) => 'start test simulator home menu'.includes(p.toLowerCase())),
      };
      return ocrRes as unknown as T;
    }

    case 'get_current_state':
      return mockDetectedState as unknown as T;

    case 'get_app_status':
      return {
        status: mockStatus,
        selected_window: mockSelectedWindow?.title || null,
        detected_state: mockDetectedState,
        is_emergency_stopped: mockIsEmergencyStopped,
        last_ocr_text: 'Start Test Simulator Home',
        active_workflow_name: 'Standard Simulator Verification',
      } as unknown as T;

    case 'emergency_stop':
      mockIsEmergencyStopped = true;
      mockStatus = 'Emergency Stop';
      return 'EMERGENCY STOP ACTIVATED' as unknown as T;

    case 'reset_emergency_stop':
      mockIsEmergencyStopped = false;
      mockStatus = 'Idle';
      return 'Emergency stop reset' as unknown as T;

    case 'stop_all_tasks':
      mockStatus = 'Stopped';
      return 'Tasks stopped' as unknown as T;

    case 'start_simulator_test':
      if (mockIsEmergencyStopped) throw new Error('Emergency stop active');
      mockStatus = 'Running Test';
      return 'Test started' as unknown as T;

    case 'pause_simulator_test':
      mockStatus = 'Paused';
      return 'Test paused' as unknown as T;

    case 'resume_simulator_test':
      if (mockIsEmergencyStopped) throw new Error('Emergency stop active');
      mockStatus = 'Running Test';
      return 'Test resumed' as unknown as T;

    case 'execute_simulator_action':
      return {
        success: true,
        action: args.action as string,
        message: `Simulated action ${args.action}`,
        target_hwnd: (args.target_hwnd as number) || 1001,
        dry_run: (args.dry_run as boolean) || false,
      } as unknown as T;

    case 'get_activity_logs':
      return [
        {
          id: 1,
          session_id: 'sess-init',
          level: 'INFO',
          event_type: 'SYSTEM_READY',
          message: 'Desktop Vision Lab core initialized.',
          details_json: JSON.stringify({ version: '0.1.0', mode: 'Lab Simulator' }),
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
        {
          id: 2,
          session_id: 'sess-init',
          level: 'INFO',
          event_type: 'WINDOW_SELECTED',
          message: 'Selected target simulator window.',
          details_json: JSON.stringify({ hwnd: 1001, title: 'Vision Lab Test Target [Simulator]' }),
          created_at: new Date(Date.now() - 45000).toISOString(),
        },
        {
          id: 3,
          session_id: 'sess-init',
          level: 'ACTION',
          event_type: 'OCR_PROCESSED',
          message: 'OCR recognized "Start Test" with 94.8% confidence.',
          details_json: JSON.stringify({ detected_state: 'SIMULATOR_HOME' }),
          created_at: new Date(Date.now() - 15000).toISOString(),
        },
      ] as unknown as T;

    case 'clear_activity_logs':
      return 'Logs cleared' as unknown as T;

    case 'get_settings':
      return {
        min_confidence: '80.0',
        capture_interval_ms: '1500',
        auto_save_screenshots: 'false',
        dry_run_mode: 'false',
        approved_window_titles: 'Simulator,Desktop Vision,Vision Lab,Test Target',
        tesseract_path: '',
      } as unknown as T;

    case 'save_setting':
      return 'Saved' as unknown as T;

    case 'get_workflows': {
      const defaultWf: Workflow = {
        id: 1,
        name: 'Standard Simulator Verification',
        description: 'Validates local simulator through Home -> Menu -> Preview -> Loading -> Test Scene -> Result',
        enabled: true,
        steps: [
          {
            id: 1,
            workflow_id: 1,
            step_order: 1,
            name: 'Verify Home Screen',
            expected_state: 'SIMULATOR_HOME',
            required_phrases: ['Start Test'],
            minimum_confidence: 80,
            timeout_ms: 10000,
            retry_limit: 3,
            simulator_action: 'CLICK_START_TEST',
            notes: 'Checks Home screen and triggers test start in simulator',
          },
          {
            id: 2,
            workflow_id: 1,
            step_order: 2,
            name: 'Select Scenario',
            expected_state: 'SIMULATOR_MENU',
            required_phrases: ['Find Test Scenario'],
            minimum_confidence: 80,
            timeout_ms: 10000,
            retry_limit: 3,
            simulator_action: 'CLICK_FIND_SCENARIO',
            notes: 'Confirms scenario selection menu',
          },
          {
            id: 3,
            workflow_id: 1,
            step_order: 3,
            name: 'Preview Test Environment',
            expected_state: 'SCENARIO_PREVIEW',
            required_phrases: ['Begin Test'],
            minimum_confidence: 80,
            timeout_ms: 10000,
            retry_limit: 3,
            simulator_action: 'CLICK_BEGIN_TEST',
            notes: 'Previews scene and launches test execution',
          },
          {
            id: 4,
            workflow_id: 1,
            step_order: 4,
            name: 'Wait for Preparation',
            expected_state: 'TEST_LOADING',
            required_phrases: ['Preparing test scenario'],
            minimum_confidence: 75,
            timeout_ms: 15000,
            retry_limit: 5,
            simulator_action: undefined,
            notes: 'Observes loading state without clicking',
          },
          {
            id: 5,
            workflow_id: 1,
            step_order: 5,
            name: 'Interact Safe Scene Area',
            expected_state: 'TEST_SCENE',
            required_phrases: ['Safe Interaction Area'],
            minimum_confidence: 80,
            timeout_ms: 15000,
            retry_limit: 3,
            simulator_action: 'CLICK_SCENE_TARGET',
            notes: 'Simulates interaction only inside marked safe zone',
          },
          {
            id: 6,
            workflow_id: 1,
            step_order: 6,
            name: 'Verify Results',
            expected_state: 'RESULT',
            required_phrases: ['Test Completed', 'Return Home'],
            minimum_confidence: 80,
            timeout_ms: 10000,
            retry_limit: 3,
            simulator_action: 'CLICK_RETURN_HOME',
            notes: 'Records completion metrics and returns to initial state',
          },
        ],
      };
      return [defaultWf] as unknown as T;
    }

    case 'check_ocr_status':
      return {
        tesseract_detected: false,
        details: 'Tesseract OCR executable not in system PATH. Simulator fallback engine active.',
        fallback_active: true,
      } as unknown as T;

    default:
      return null as unknown as T;
  }
}
