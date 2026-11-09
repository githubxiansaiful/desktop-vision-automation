import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Sliders,
  Type,
  ShieldCheck,
} from 'lucide-react';

export const TextRecognitionPage: React.FC = () => {
  const [inputText, setInputText] = useState(
    'Start Test Simulator Home Menu Preparing test scenario Safe Interaction Area Results'
  );
  const [matchPhrase, setMatchPhrase] = useState('Start Test');
  const [matchMode, setMatchMode] = useState<
    'exact' | 'case_insensitive' | 'contains' | 'all_required'
  >('contains');
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [currentConfidence, setCurrentConfidence] = useState(94.5);

  // Evaluation logic
  const evaluateMatch = (): { matched: boolean; reason: string } => {
    if (currentConfidence < confidenceThreshold) {
      return {
        matched: false,
        reason: `Confidence (${currentConfidence.toFixed(1)}%) is below the required safety threshold (${confidenceThreshold}%). Result rejected.`,
      };
    }

    const text = inputText.trim();
    const phrase = matchPhrase.trim();

    if (!phrase) {
      return { matched: false, reason: 'Search phrase is empty.' };
    }

    switch (matchMode) {
      case 'exact':
        return text === phrase
          ? { matched: true, reason: 'Exact match confirmed.' }
          : { matched: false, reason: 'Exact match failed.' };

      case 'case_insensitive':
        return text.toLowerCase() === phrase.toLowerCase()
          ? { matched: true, reason: 'Case-insensitive match confirmed.' }
          : { matched: false, reason: 'Case-insensitive text differs.' };

      case 'contains':
        return text.toLowerCase().includes(phrase.toLowerCase())
          ? { matched: true, reason: `Text contains target phrase "${phrase}".` }
          : { matched: false, reason: `Phrase "${phrase}" not found in OCR string.` };

      case 'all_required': {
        const required = phrase.split(',').map((p) => p.trim().toLowerCase());
        const missing = required.filter((r) => !text.toLowerCase().includes(r));
        if (missing.length === 0) {
          return { matched: true, reason: 'All required phrases are present.' };
        } else {
          return {
            matched: false,
            reason: `Missing required phrases: ${missing.join(', ')}`,
          };
        }
      }
    }
  };

  const matchEval = evaluateMatch();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            Text Recognition &amp; Phrase Matcher
          </h2>
          <p className="text-xs text-slate-400">
            Configure matching rules, confidence thresholds, and test evidence validation algorithms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration & Input */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Type className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              OCR Input &amp; Match Rule Config
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Simulated or Captured OCR Text
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-2.5 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Target Match Phrase (comma-separated for &ldquo;All Required&rdquo;)
            </label>
            <input
              type="text"
              value={matchPhrase}
              onChange={(e) => setMatchPhrase(e.target.value)}
              placeholder="e.g. Start Test or Start Test, Simulator"
              className="w-full p-2.5 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Matching Mode</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'contains', label: 'Contains Phrase' },
                { id: 'case_insensitive', label: 'Case Insensitive' },
                { id: 'exact', label: 'Exact Match' },
                { id: 'all_required', label: 'All Required Present' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setMatchMode(mode.id as any)}
                  className={`p-2 rounded-lg border text-left font-medium transition-colors ${
                    matchMode === mode.id
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Threshold Sliders */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Minimum Confidence Threshold</span>
                <span className="font-mono font-bold text-blue-400">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={99}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Observed Token Confidence</span>
                <span className="font-mono font-bold text-indigo-400">{currentConfidence}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={100}
                value={currentConfidence}
                onChange={(e) => setCurrentConfidence(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Validation Evaluation Card */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Validation Result &amp; Safety Decision
              </h3>
            </div>

            {/* Decision Status Box */}
            <div
              className={`p-4 rounded-xl border mt-4 flex items-start gap-3 transition-all ${
                matchEval.matched
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {matchEval.matched ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-bold">
                  {matchEval.matched ? 'State Evidence Validated' : 'Validation Failed / Rejected'}
                </h4>
                <p className="text-xs mt-1 leading-relaxed">{matchEval.reason}</p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="mt-5 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Selected Matching Rule</span>
                <span className="font-semibold text-slate-200 uppercase font-mono text-[11px]">
                  {matchMode.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Confidence Requirement</span>
                <span className="font-mono text-slate-200">
                  {currentConfidence >= confidenceThreshold ? 'Satisfied (>= ' : 'Violated (< '}
                  {confidenceThreshold}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Simulator Action Permitted</span>
                <span
                  className={`font-semibold ${
                    matchEval.matched ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {matchEval.matched ? 'YES (Guarded)' : 'NO (Blocked)'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Specification Requirement: Low-confidence OCR results never trigger buttons.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
