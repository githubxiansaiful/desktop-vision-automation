import React, { useState, useEffect } from 'react';
import { TopBar } from './TopBar';
import { Sidebar, NavTab } from './Sidebar';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ScreenReaderPage } from '@/features/screen-reader/ScreenReaderPage';
import { TextRecognitionPage } from '@/features/text-recognition/TextRecognitionPage';
import { WorkflowEditorPage } from '@/features/workflow-editor/WorkflowEditorPage';
import { SimulatorPage } from '@/features/simulator/SimulatorPage';
import { ActivityLogPage } from '@/features/activity-log/ActivityLogPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { invokeCommand } from '@/lib/tauri';
import { AutomationStatus, WindowInfo, AppStatusResponse } from '@/types';

export const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [status, setStatus] = useState<AutomationStatus>('Idle');
  const [selectedWindow, setSelectedWindow] = useState<WindowInfo | null>(null);
  const [detectedState, setDetectedState] = useState<string>('IDLE');

  const refreshStatus = async () => {
    try {
      const res = await invokeCommand<AppStatusResponse>('get_app_status');
      if (res) {
        setStatus(res.status as AutomationStatus);
        setDetectedState(res.detected_state || 'IDLE');
      }
    } catch (err) {
      console.error('Failed to query status:', err);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  // Global Emergency Stop Keyboard Shortcut (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F12') {
        handleEmergencyStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEmergencyStop = async () => {
    try {
      await invokeCommand('emergency_stop');
      setStatus('Emergency Stop');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetEmergencyStop = async () => {
    try {
      await invokeCommand('reset_emergency_stop');
      setStatus('Idle');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <TopBar
        status={status}
        selectedWindow={selectedWindow?.title || null}
        detectedState={detectedState}
        onEmergencyStop={handleEmergencyStop}
        onResetEmergencyStop={handleResetEmergencyStop}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          {activeTab === 'dashboard' && (
            <DashboardPage
              status={status}
              selectedWindow={selectedWindow}
              detectedState={detectedState}
              onNavigateTab={setActiveTab}
              onRefreshStatus={refreshStatus}
            />
          )}

          {activeTab === 'screen-reader' && (
            <ScreenReaderPage
              selectedWindow={selectedWindow}
              onSelectWindow={setSelectedWindow}
              onStateDetected={setDetectedState}
            />
          )}

          {activeTab === 'text-recognition' && <TextRecognitionPage />}

          {activeTab === 'workflow-editor' && <WorkflowEditorPage />}

          {activeTab === 'simulator' && <SimulatorPage />}

          {activeTab === 'activity-log' && <ActivityLogPage />}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};
