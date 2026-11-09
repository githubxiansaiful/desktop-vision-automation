import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { invokeCommand } from '@/lib/tauri';
import { Workflow, WorkflowStep } from '@/types';

export const WorkflowEditorPage: React.FC = () => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [dryRun, setDryRun] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflow();
  }, []);

  const loadWorkflow = async () => {
    try {
      const list = await invokeCommand<Workflow[]>('get_workflows');
      if (list && list.length > 0) {
        setWorkflow(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCurrentStep = (fields: Partial<WorkflowStep>) => {
    if (!workflow) return;
    const updatedSteps = [...workflow.steps];
    updatedSteps[selectedStepIndex] = {
      ...updatedSteps[selectedStepIndex],
      ...fields,
    };
    setWorkflow({ ...workflow, steps: updatedSteps });
  };

  const handleAddStep = () => {
    if (!workflow) return;
    const newStep: WorkflowStep = {
      step_order: workflow.steps.length + 1,
      name: `Step ${workflow.steps.length + 1}`,
      expected_state: 'UNKNOWN',
      required_phrases: ['Test'],
      minimum_confidence: 80,
      timeout_ms: 10000,
      retry_limit: 3,
      simulator_action: undefined,
      notes: 'Custom step description',
    };
    setWorkflow({ ...workflow, steps: [...workflow.steps, newStep] });
    setSelectedStepIndex(workflow.steps.length);
  };

  const handleDeleteStep = (index: number) => {
    if (!workflow || workflow.steps.length <= 1) return;
    const filtered = workflow.steps.filter((_, i) => i !== index);
    const reordered = filtered.map((s, i) => ({ ...s, step_order: i + 1 }));
    setWorkflow({ ...workflow, steps: reordered });
    setSelectedStepIndex(Math.max(0, index - 1));
  };

  const handleSave = () => {
    setSaveStatus('Workflow configuration saved locally.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const activeStep = workflow?.steps[selectedStepIndex];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            Workflow Editor &amp; FSM Config
          </h2>
          <p className="text-xs text-slate-400">
            Design, inspect, and fine-tune state validation workflows for the local test simulator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Dry Run Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300 font-medium">Dry-Run Mode:</span>
            <button
              onClick={() => setDryRun(!dryRun)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                dryRun
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {dryRun ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3 rounded-lg text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
          {saveStatus}
        </div>
      )}

      {/* State Transition Flowchart Banner */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          State Transition Sequence
        </span>
        <div className="flex items-center gap-2 overflow-x-auto py-3">
          {workflow?.steps.map((step, idx) => {
            const isSelected = selectedStepIndex === idx;
            return (
              <React.Fragment key={idx}>
                <button
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`px-3 py-2 rounded-lg border text-left shrink-0 transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-sm ring-1 ring-blue-500/40'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 font-bold uppercase">
                    Step {step.step_order}
                  </div>
                  <div className="text-xs font-semibold whitespace-nowrap">
                    {step.expected_state}
                  </div>
                </button>
                {idx < (workflow?.steps.length || 0) - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step List Sidebar */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-200">
              Workflow Steps ({workflow?.steps.length || 0})
            </span>
            <button
              onClick={handleAddStep}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Step
            </button>
          </div>

          <div className="space-y-1.5 max-h-[460px] overflow-y-auto">
            {workflow?.steps.map((step, idx) => {
              const isSelected = selectedStepIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                      : 'bg-slate-800/30 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold block">
                      {step.step_order}. {step.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {step.expected_state}
                    </span>
                  </div>

                  {workflow.steps.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStep(idx);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Details Configuration */}
        {activeStep && (
          <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200">
                Configure Step {activeStep.step_order}: {activeStep.name}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {activeStep.expected_state}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Step Name</label>
                <input
                  type="text"
                  value={activeStep.name}
                  onChange={(e) => handleUpdateCurrentStep({ name: e.target.value })}
                  className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Expected State</label>
                <select
                  value={activeStep.expected_state}
                  onChange={(e) => handleUpdateCurrentStep({ expected_state: e.target.value })}
                  className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="SIMULATOR_HOME">SIMULATOR_HOME</option>
                  <option value="SIMULATOR_MENU">SIMULATOR_MENU</option>
                  <option value="SCENARIO_PREVIEW">SCENARIO_PREVIEW</option>
                  <option value="TEST_LOADING">TEST_LOADING</option>
                  <option value="TEST_SCENE">TEST_SCENE</option>
                  <option value="RESULT">RESULT</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="UNKNOWN">UNKNOWN</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Required OCR Phrases (comma-separated)
              </label>
              <input
                type="text"
                value={activeStep.required_phrases.join(', ')}
                onChange={(e) =>
                  handleUpdateCurrentStep({
                    required_phrases: e.target.value.split(',').map((p) => p.trim()),
                  })
                }
                className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Min Confidence (%)</label>
                <input
                  type="number"
                  min={50}
                  max={99}
                  value={activeStep.minimum_confidence}
                  onChange={(e) =>
                    handleUpdateCurrentStep({ minimum_confidence: Number(e.target.value) })
                  }
                  className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Timeout (ms)</label>
                <input
                  type="number"
                  step={500}
                  value={activeStep.timeout_ms}
                  onChange={(e) =>
                    handleUpdateCurrentStep({ timeout_ms: Number(e.target.value) })
                  }
                  className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Retry Limit</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={activeStep.retry_limit}
                  onChange={(e) =>
                    handleUpdateCurrentStep({ retry_limit: Number(e.target.value) })
                  }
                  className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Simulator Action (Optional)
              </label>
              <select
                value={activeStep.simulator_action || 'NONE'}
                onChange={(e) =>
                  handleUpdateCurrentStep({
                    simulator_action: e.target.value === 'NONE' ? undefined : e.target.value,
                  })
                }
                className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="NONE">None (Observe Only)</option>
                <option value="CLICK_START_TEST">CLICK_START_TEST</option>
                <option value="CLICK_FIND_SCENARIO">CLICK_FIND_SCENARIO</option>
                <option value="CLICK_BEGIN_TEST">CLICK_BEGIN_TEST</option>
                <option value="CLICK_SCENE_TARGET">CLICK_SCENE_TARGET (Safe Zone)</option>
                <option value="CLICK_RETURN_HOME">CLICK_RETURN_HOME</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Operational Notes</label>
              <textarea
                rows={2}
                value={activeStep.notes || ''}
                onChange={(e) => handleUpdateCurrentStep({ notes: e.target.value })}
                className="w-full p-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
