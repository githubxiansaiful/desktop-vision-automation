import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Activity,
  Monitor,
  Workflow as WorkflowIcon,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { invokeCommand } from '@/lib/tauri';
import { AutomationStatus, ActivityLog, WindowInfo } from '@/types';
import { formatTimestamp } from '@/lib/utils';

interface DashboardPageProps {
  status: AutomationStatus;
  selectedWindow: WindowInfo | null;
  detectedState: string;
  onNavigateTab: (tab: 'dashboard' | 'screen-reader' | 'text-recognition' | 'workflow-editor' | 'simulator' | 'activity-log' | 'settings') => void;
  onRefreshStatus: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  status,
  selectedWindow,
  detectedState,
  onNavigateTab,
  onRefreshStatus,
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const activeWorkflowName = 'Standard Simulator Verification';
  const dryRun = false;
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadRecentLogs = async () => {
    try {
      const data = await invokeCommand<ActivityLog[]>('get_activity_logs', { limit: 6 });
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  };

  useEffect(() => {
    loadRecentLogs();
    const interval = setInterval(loadRecentLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const msg = await invokeCommand<string>('start_simulator_test');
      setActionMessage(msg);
      onRefreshStatus();
    } catch (err: unknown) {
      setActionMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
      loadRecentLogs();
    }
  };

  const handlePause = async () => {
    try {
      await invokeCommand('pause_simulator_test');
      onRefreshStatus();
      loadRecentLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async () => {
    try {
      await invokeCommand('resume_simulator_test');
      onRefreshStatus();
      loadRecentLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStop = async () => {
    try {
      await invokeCommand('stop_all_tasks');
      onRefreshStatus();
      loadRecentLogs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            Control Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time status overview, simulator target verification, and automation controls.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {status === 'Running Test' ? (
            <button
              onClick={handlePause}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          ) : status === 'Paused' ? (
            <button
              onClick={handleResume}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              Resume
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isLoading || status === 'Emergency Stop'}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
            >
              <Play className="w-3.5 h-3.5" />
              Start Test Run
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={status === 'Idle' || status === 'Stopped'}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-3 rounded-lg text-xs border flex items-center justify-between ${
          actionMessage.startsWith('Error')
            ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
        }`}>
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Card */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Automation Status</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <span className={`text-xl font-bold ${
              status === 'Running Test'
                ? 'text-emerald-400'
                : status === 'Emergency Stop'
                ? 'text-rose-400'
                : status === 'Paused'
                ? 'text-amber-400'
                : 'text-slate-200'
            }`}>
              {status}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              {status === 'Running Test' ? 'Actively validating simulator state' : 'Standby mode'}
            </p>
          </div>
        </div>

        {/* Selected Window Card */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Target Simulator</span>
            <Monitor className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-sm font-semibold text-slate-100 truncate" title={selectedWindow?.title || 'None'}>
              {selectedWindow?.title || 'No window selected'}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
              {selectedWindow ? (
                <>
                  <span>HWND: {selectedWindow.id}</span>
                  <span>•</span>
                  <span>{selectedWindow.width}x{selectedWindow.height}</span>
                </>
              ) : (
                <button
                  onClick={() => onNavigateTab('screen-reader')}
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  Select target <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current State Card */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Current Detected State</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-lg font-mono font-bold text-indigo-300">
              {detectedState}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              FSM evidence confirmed
            </p>
          </div>
        </div>

        {/* Workflow Card */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Workflow</span>
            <WorkflowIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-sm font-semibold text-slate-100 truncate">
              {activeWorkflowName}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              6 verified steps • Finite State Machine
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Verification & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Machine Overview */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <WorkflowIcon className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Simulator Finite State Machine Pipeline
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Guarded Non-interactive Validation
              </span>
            </div>

            {/* Stepper Visualization */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 my-6">
              {[
                { state: 'SIMULATOR_HOME', label: '1. Home', phrase: '"Start Test"' },
                { state: 'SIMULATOR_MENU', label: '2. Menu', phrase: '"Find Test Scenario"' },
                { state: 'SCENARIO_PREVIEW', label: '3. Preview', phrase: '"Begin Test"' },
                { state: 'TEST_LOADING', label: '4. Loading', phrase: '"Preparing..."' },
                { state: 'TEST_SCENE', label: '5. Scene', phrase: '"Safe Area"' },
                { state: 'RESULT', label: '6. Result', phrase: '"Completed"' },
              ].map((step, idx) => {
                const isCurrent = detectedState === step.state;
                return (
                  <div
                    key={step.state}
                    className={`p-3 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/30'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Step {idx + 1}
                    </span>
                    <span className="text-xs font-semibold leading-tight mb-1">
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {step.phrase}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300">Safety Guard Invariant:</span>{' '}
                Simulator actions are strictly executed only when the target window matches an approved local test window, is in the foreground, and OCR confidence exceeds threshold.
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Dry Run Mode: {dryRun ? 'Active (No clicks)' : 'Disabled (Live simulation)'}</span>
            <button
              onClick={() => onNavigateTab('simulator')}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              Open Test Simulator <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Recent Activity
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('activity-log')}
                className="text-[11px] text-blue-400 hover:underline"
              >
                View all
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No activity recorded yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800/60 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          log.level === 'ERROR'
                            ? 'bg-rose-500/20 text-rose-300'
                            : log.level === 'WARN'
                            ? 'bg-amber-500/20 text-amber-300'
                            : log.level === 'ACTION'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatTimestamp(log.created_at)}
                      </span>
                    </div>
                    <span className="text-slate-300 leading-snug line-clamp-2">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
            <span className="text-[11px] text-slate-500">
              Database persistence enabled (SQLite)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
