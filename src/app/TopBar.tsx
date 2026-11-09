import React from 'react';
import { ShieldCheck, Monitor, Activity, ZapOff } from 'lucide-react';
import { EmergencyStopButton } from '@/components/EmergencyStopButton';
import { AutomationStatus } from '@/types';

interface TopBarProps {
  status: AutomationStatus;
  selectedWindow: string | null;
  detectedState: string;
  onEmergencyStop: () => void;
  onResetEmergencyStop: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  status,
  selectedWindow,
  detectedState,
  onEmergencyStop,
  onResetEmergencyStop,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'Running Test':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse';
      case 'Monitoring':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'Paused':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Emergency Stop':
      case 'Stopped':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            DV
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-tight text-slate-100">
              Desktop Vision Lab
            </h1>
            <span className="text-[11px] text-slate-400">
              Automation &amp; State Validation Platform
            </span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-800 mx-2" />

        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusBadge()}`}
          >
            <span className={`w-2 h-2 rounded-full ${status === 'Running Test' ? 'bg-emerald-400 animate-ping' : 'bg-current'}`} />
            <span>{status}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/60">
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Target:</span>
            <span className="font-medium text-slate-200 truncate max-w-[180px]">
              {selectedWindow || 'No window selected'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/60">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-500">State:</span>
            <span className="font-semibold text-indigo-300 font-mono">
              {detectedState}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {status === 'Emergency Stop' && (
          <button
            onClick={onResetEmergencyStop}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <ZapOff className="w-3.5 h-3.5 text-amber-400" />
            Reset Stop Lock
          </button>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-400 mr-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden lg:inline text-slate-400">Sandbox Boundary Active</span>
        </div>

        <EmergencyStopButton
          onStop={onEmergencyStop}
          isTriggered={status === 'Emergency Stop'}
        />
      </div>
    </header>
  );
};
