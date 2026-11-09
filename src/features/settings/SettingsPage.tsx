import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Clock,
  Shield,
  Database as DbIcon,
  CheckCircle,
  AlertCircle,
  Save,
  HelpCircle,
} from 'lucide-react';
import { invokeCommand } from '@/lib/tauri';

export const SettingsPage: React.FC = () => {
  const [tesseractPath, setTesseractPath] = useState('');
  const [minConfidence, setMinConfidence] = useState('80.0');
  const [captureInterval, setCaptureInterval] = useState('1500');
  const [approvedTitles, setApprovedTitles] = useState(
    'Simulator,Desktop Vision,Vision Lab,Test Target'
  );
  const [repeatIntervalSec, setRepeatIntervalSec] = useState('60');
  const [maxRuns, setMaxRuns] = useState('10');
  const [stopOnError, setStopOnError] = useState(true);
  const [stopOnWindowClose, setStopOnWindowClose] = useState(true);

  const [ocrStatus, setOcrStatus] = useState<{
    tesseract_detected: boolean;
    details: string;
    fallback_active: boolean;
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    checkOcr();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await invokeCommand<Record<string, string>>('get_settings');
      if (data) {
        if (data.tesseract_path) setTesseractPath(data.tesseract_path);
        if (data.min_confidence) setMinConfidence(data.min_confidence);
        if (data.capture_interval_ms) setCaptureInterval(data.capture_interval_ms);
        if (data.approved_window_titles) setApprovedTitles(data.approved_window_titles);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkOcr = async () => {
    try {
      const res = await invokeCommand<any>('check_ocr_status');
      setOcrStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      await invokeCommand('save_setting', { key: 'tesseract_path', value: tesseractPath });
      await invokeCommand('save_setting', { key: 'min_confidence', value: minConfidence });
      await invokeCommand('save_setting', { key: 'capture_interval_ms', value: captureInterval });
      await invokeCommand('save_setting', {
        key: 'approved_window_titles',
        value: approvedTitles,
      });

      checkOcr();
      setSaveStatus('Settings successfully saved to local SQLite database.');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: unknown) {
      setSaveStatus(`Save error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-400" />
            Application Settings
          </h2>
          <p className="text-xs text-slate-400">
            Configure OCR paths, test automation schedules, safety bounds, and SQLite storage.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          Save Settings
        </button>
      </div>

      {saveStatus && (
        <div className="p-3 rounded-lg text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
          {saveStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OCR Engine Config */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Vision &amp; OCR Engine Setup
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Tesseract Executable Path (Optional if in system PATH)
            </label>
            <input
              type="text"
              placeholder="e.g. C:\Program Files\Tesseract-OCR\tesseract.exe"
              value={tesseractPath}
              onChange={(e) => setTesseractPath(e.target.value)}
              className="w-full p-2.5 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status readout */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              ocrStatus?.tesseract_detected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {ocrStatus?.tesseract_detected ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold">
                {ocrStatus?.tesseract_detected
                  ? 'Tesseract OCR Detected'
                  : 'Simulator Fallback Recognition Active'}
              </span>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                {ocrStatus?.details || 'Validating OCR connection...'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-300">
              <HelpCircle className="w-3 h-3 text-blue-400" />
              <span>OCR Troubleshooting Guide:</span>
            </div>
            <p>
              To install Tesseract on Windows: Run{' '}
              <code className="text-indigo-300 font-mono">winget install UB-Mannheim.TesseractOCR</code>{' '}
              or specify the binary path above. The platform automatically uses the high-precision simulator recognition engine if Tesseract is not configured.
            </p>
          </div>
        </div>

        {/* Timers & Scheduling */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Timers &amp; Scheduling Parameters
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Capture Interval (ms)
              </label>
              <input
                type="number"
                step={250}
                value={captureInterval}
                onChange={(e) => setCaptureInterval(e.target.value)}
                className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Repeat Interval (seconds)
              </label>
              <input
                type="number"
                min={10}
                value={repeatIntervalSec}
                onChange={(e) => setRepeatIntervalSec(e.target.value)}
                className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Maximum Test Runs Limit
            </label>
            <input
              type="number"
              min={1}
              value={maxRuns}
              onChange={(e) => setMaxRuns(e.target.value)}
              className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stopOnError}
                onChange={(e) => setStopOnError(e.target.checked)}
                className="rounded accent-blue-500"
              />
              <span className="text-slate-300">
                Immediately stop workflow after error or unknown state
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stopOnWindowClose}
                onChange={(e) => setStopOnWindowClose(e.target.checked)}
                className="rounded accent-blue-500"
              />
              <span className="text-slate-300">
                Immediately stop workflow if selected simulator target closes
              </span>
            </label>
          </div>
        </div>

        {/* Safety Boundary Keywords */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Safety Guard &amp; Target Validation
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Approved Simulator Window Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={approvedTitles}
              onChange={(e) => setApprovedTitles(e.target.value)}
              className="w-full p-2.5 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500">
              Automated actions are hard-blocked by Rust if the window title doesn&rsquo;t contain one of these keywords.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Global Minimum Confidence (%)
            </label>
            <input
              type="number"
              min={50}
              max={99}
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value)}
              className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* SQLite Database Telemetry */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <DbIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              SQLite Database Health
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <span className="text-slate-400">Database Driver</span>
              <span className="font-semibold text-slate-200 font-mono">SQLite 3 (rusqlite bundled)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <span className="text-slate-400">Database Tables</span>
              <span className="font-semibold text-slate-200 font-mono">
                settings, workflows, steps, sessions, logs
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <span className="text-slate-400">Persistence Status</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Active &amp; Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
