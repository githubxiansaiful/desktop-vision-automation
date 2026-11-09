export interface WindowInfo {
  id: number;
  title: string;
  class_name: string;
  is_foreground: boolean;
  width: number;
  height: number;
  is_minimized: boolean;
  is_approved_simulator: boolean;
}

export interface CaptureResult {
  width: number;
  height: number;
  image_base64: string;
  timestamp: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OcrResult {
  text: string;
  confidence: number;
  words: OcrWord[];
  capture_timestamp: string;
  width: number;
  height: number;
  matched_phrases: string[];
}

export type SimulatorScene =
  | 'HOME'
  | 'MENU'
  | 'PREVIEW'
  | 'LOADING'
  | 'TEST_SCENE'
  | 'RESULT';

export interface WorkflowStep {
  id?: number;
  workflow_id?: number;
  step_order: number;
  name: string;
  expected_state: string;
  required_phrases: string[];
  minimum_confidence: number;
  timeout_ms: number;
  retry_limit: number;
  simulator_action?: string;
  notes?: string;
}

export interface Workflow {
  id?: number;
  name: string;
  description: string;
  enabled: boolean;
  steps: WorkflowStep[];
  created_at?: string;
  updated_at?: string;
}

export type AutomationStatus =
  | 'Idle'
  | 'Monitoring'
  | 'Running Test'
  | 'Paused'
  | 'Stopped'
  | 'Emergency Stop';

export interface ActivityLog {
  id?: number;
  session_id?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'ACTION';
  event_type: string;
  message: string;
  details_json?: string;
  created_at: string;
}

export interface AppSettings {
  ocr_engine: string;
  tesseract_path: string;
  min_confidence: number;
  capture_interval_ms: number;
  auto_save_screenshots: boolean;
  dry_run_mode: boolean;
  approved_window_titles: string[];
}

export interface AppStatusResponse {
  status: string;
  selected_window: string | null;
  detected_state: string;
  is_emergency_stopped: boolean;
  last_ocr_text: string | null;
  active_workflow_name: string;
}
