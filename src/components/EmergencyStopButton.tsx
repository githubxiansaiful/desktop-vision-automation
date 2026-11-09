import React from 'react';
import { AlertOctagon } from 'lucide-react';

interface EmergencyStopButtonProps {
  onStop: () => void;
  isTriggered?: boolean;
}

export const EmergencyStopButton: React.FC<EmergencyStopButtonProps> = ({
  onStop,
  isTriggered = false,
}) => {
  return (
    <button
      id="emergency-stop-btn"
      onClick={onStop}
      className={`px-4 py-2 font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all duration-150 active:scale-95 border ${
        isTriggered
          ? 'bg-red-800 text-white border-red-950 animate-pulse ring-4 ring-red-500/50'
          : 'bg-red-600 hover:bg-red-500 text-white border-red-700 hover:shadow-red-600/30'
      }`}
      title="EMERGENCY STOP (Esc): Immediately aborts all active automation, timers, and simulator actions."
    >
      <AlertOctagon className="w-5 h-5 animate-spin-slow" />
      <span>EMERGENCY STOP</span>
    </button>
  );
};
