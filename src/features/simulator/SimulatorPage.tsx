import React, { useState } from 'react';
import {
  Gamepad2,
  RotateCcw,
  ShieldCheck,
  Target,
  Award,
  RefreshCw,
} from 'lucide-react';
import { SimulatorScene } from '@/types';

export const SimulatorPage: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<SimulatorScene>('HOME');
  const [actionCount, setActionCount] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<string>('Simulator Initialized');

  const handleNext = (next: SimulatorScene, actionName: string) => {
    setCurrentScene(next);
    setActionCount((c) => c + 1);
    setLastAction(actionName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
            Dedicated Local Test Simulator
          </h2>
          <p className="text-xs text-slate-400">
            Self-contained multi-scene environment for OCR state recognition and guarded action verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentScene('HOME');
              setSelectedTarget(null);
              setLastAction('Reset to Home Screen');
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Simulator
          </button>
        </div>
      </div>

      {/* Simulator Frame Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Canvas Area */}
        <div className="lg:col-span-3 rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-2xl overflow-hidden flex flex-col relative aspect-video select-none">
          {/* Mock Window Titlebar */}
          <div className="h-8 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="font-semibold text-slate-200 ml-2">
                Vision Lab Test Target [Simulator]
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-emerald-400">● FOREGROUND TARGET</span>
              <span>1280x720</span>
            </div>
          </div>

          {/* Interactive Screen Layout Based on Current Scene */}
          <div className="flex-1 p-8 flex flex-col justify-between items-center relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950">
            {/* Scene 1: Home */}
            {currentScene === 'HOME' && (
              <div className="w-full h-full flex flex-col justify-between items-center text-center">
                <div className="space-y-2 mt-8">
                  <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
                    Stage 1 of 6
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    SIMULATOR HOME
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    Non-interactive reference layout for testing initial OCR text detection.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400 text-lg">
                    DV
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-200">
                      Standard Test Session
                    </div>
                    <div className="text-xs text-slate-400">
                      Baseline layout for state identification
                    </div>
                  </div>
                </div>

                <button
                  id="simulator-start-btn"
                  onClick={() => handleNext('MENU', 'CLICK_START_TEST')}
                  className="mb-8 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all duration-150 active:scale-95 border border-blue-400/40"
                >
                  Start Test
                </button>
              </div>
            )}

            {/* Scene 2: Menu */}
            {currentScene === 'MENU' && (
              <div className="w-full h-full flex flex-col justify-between items-center text-center">
                <div className="space-y-2 mt-6">
                  <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
                    Stage 2 of 6
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    SIMULATOR MENU
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select scenario parameters to continue verification sequence.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-blue-500/50 text-left">
                    <div className="text-xs font-bold text-blue-400 uppercase">
                      Scenario A
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      Multiplayer Menu
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Full state validation mode
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800 text-left opacity-60">
                    <div className="text-xs font-bold text-slate-500 uppercase">
                      Scenario B
                    </div>
                    <div className="text-sm font-semibold text-slate-400 mt-1">
                      Quick Benchmark
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      OCR confidence benchmark
                    </div>
                  </div>
                </div>

                <button
                  id="simulator-find-btn"
                  onClick={() => handleNext('PREVIEW', 'CLICK_FIND_SCENARIO')}
                  className="mb-6 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all duration-150 active:scale-95 border border-indigo-400/40"
                >
                  Find Test Scenario
                </button>
              </div>
            )}

            {/* Scene 3: Preview */}
            {currentScene === 'PREVIEW' && (
              <div className="w-full h-full flex flex-col justify-between items-center text-center">
                <div className="space-y-2 mt-6">
                  <span className="text-xs font-bold tracking-widest text-purple-400 uppercase">
                    Stage 3 of 6
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    SCENARIO PREVIEW
                  </h3>
                  <p className="text-xs text-slate-400">
                    Army Preview environment ready for execution.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 w-full max-w-md text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Target Region:</span>
                    <span className="font-semibold text-slate-200">Local Sandbox</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Expected Tokens:</span>
                    <span className="font-semibold text-purple-400">Begin Test, Attack</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Safety Verification:</span>
                    <span className="font-semibold text-emerald-400">PASS (Approved)</span>
                  </div>
                </div>

                <button
                  id="simulator-begin-btn"
                  onClick={() => handleNext('LOADING', 'CLICK_BEGIN_TEST')}
                  className="mb-6 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-150 active:scale-95 border border-emerald-400/40"
                >
                  Begin Test
                </button>
              </div>
            )}

            {/* Scene 4: Loading */}
            {currentScene === 'LOADING' && (
              <div className="w-full h-full flex flex-col justify-center items-center text-center space-y-6">
                <RefreshCw className="w-12 h-12 text-blue-400 animate-spin" />
                <div className="space-y-2">
                  <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
                    Stage 4 of 6 • Automated Transition
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Preparing test scenario...
                  </h3>
                  <p className="text-xs text-slate-400">
                    Non-interactive state. The state machine observes this screen without dispatching input.
                  </p>
                </div>

                <button
                  onClick={() => handleNext('TEST_SCENE', 'SIMULATOR_LOADING_COMPLETE')}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
                >
                  Advance Loading &rarr;
                </button>
              </div>
            )}

            {/* Scene 5: Test Scene with Safe Interaction Area */}
            {currentScene === 'TEST_SCENE' && (
              <div className="w-full h-full flex flex-col justify-between items-center">
                <div className="text-center space-y-1 mt-2">
                  <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                    Stage 5 of 6 • Active Interaction
                  </span>
                  <h3 className="text-xl font-black text-white">
                    TEST SCENE WITH SAFE AREA
                  </h3>
                </div>

                {/* Marked Safe Interaction Area */}
                <div className="w-full max-w-xl h-48 rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-950/20 p-4 flex flex-col justify-between relative">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Safe Interaction Area
                    </span>
                    <span className="text-[10px] font-mono">Bound: X[200-800] Y[150-400]</span>
                  </div>

                  <div className="flex items-center justify-center gap-6 my-auto">
                    {[1, 2, 3].map((id) => (
                      <button
                        key={id}
                        onClick={() => {
                          setSelectedTarget(id);
                          setLastAction(`CLICK_SCENE_TARGET: Object #${id}`);
                        }}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                          selectedTarget === id
                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-4 ring-emerald-500/30'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <Target className="w-6 h-6 text-emerald-400" />
                        <span className="text-xs font-bold">Target {id}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-center text-[10px] text-emerald-400/80">
                    Input simulation is permitted only inside this verified boundary.
                  </div>
                </div>

                <button
                  id="simulator-complete-btn"
                  onClick={() => handleNext('RESULT', 'SIMULATOR_SCENE_COMPLETE')}
                  className="mb-4 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  Complete Scenario Run &rarr;
                </button>
              </div>
            )}

            {/* Scene 6: Results */}
            {currentScene === 'RESULT' && (
              <div className="w-full h-full flex flex-col justify-between items-center text-center">
                <div className="space-y-2 mt-6">
                  <Award className="w-12 h-12 text-amber-400 mx-auto" />
                  <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                    Stage 6 of 6 • Verification Succeeded
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Test Completed
                  </h3>
                  <p className="text-xs text-slate-400">
                    Full finite state sequence traversed and logged with complete trace integrity.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full max-w-md text-center">
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500">Actions</span>
                    <p className="text-base font-bold text-slate-200">{actionCount}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500">Confidence</span>
                    <p className="text-base font-bold text-emerald-400">96.8%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500">Violations</span>
                    <p className="text-base font-bold text-slate-200">0</p>
                  </div>
                </div>

                <button
                  id="simulator-return-btn"
                  onClick={() => handleNext('HOME', 'CLICK_RETURN_HOME')}
                  className="mb-6 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all duration-150 active:scale-95 border border-blue-400/40"
                >
                  Return Home
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Simulator Metrics Sidebar */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 pb-3 border-b border-slate-800">
              Simulator Telemetry
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Active Scene State:</span>
                <p className="font-mono font-bold text-indigo-400 text-sm mt-0.5">
                  {currentScene}
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px]">Total Action Dispatches:</span>
                <p className="font-bold text-slate-200 text-sm mt-0.5">
                  {actionCount}
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px]">Last Simulator Event:</span>
                <p className="font-mono text-slate-300 text-xs mt-0.5 bg-slate-950/50 p-2 rounded border border-slate-800">
                  {lastAction}
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px]">Safe Interaction Area:</span>
                <p className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Active on Stage 5
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">Acceptance Check 4:</p>
            <p>User can step through every scene manually or allow automated test dispatches.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
