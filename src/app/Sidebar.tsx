import React from 'react';
import {
  LayoutDashboard,
  Scan,
  FileSearch,
  Workflow,
  Gamepad2,
  FileClock,
  Settings,
  Flame,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'screen-reader'
  | 'text-recognition'
  | 'workflow-editor'
  | 'simulator'
  | 'activity-log'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'screen-reader', label: 'Screen Reader', icon: Scan },
  { id: 'text-recognition', label: 'Text Recognition', icon: FileSearch },
  { id: 'workflow-editor', label: 'Workflow Editor', icon: Workflow },
  { id: 'simulator', label: 'Test Simulator', icon: Gamepad2 },
  { id: 'activity-log', label: 'Activity Log', icon: FileClock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col justify-between py-4 select-none shrink-0">
      <div>
        <div className="px-5 mb-6">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Platform Navigation
          </span>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-4">
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Safety Boundary</span>
          </div>
          <p className="leading-relaxed text-slate-400 text-[10.5px]">
            Input automation is restricted to authorized local simulator targets.
          </p>
        </div>
      </div>
    </aside>
  );
};
