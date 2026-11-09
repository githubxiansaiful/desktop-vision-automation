import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Camera,
  Scan,
  Layers,
  Search,
  Crosshair,
} from 'lucide-react';
import { invokeCommand } from '@/lib/tauri';
import { WindowInfo, CaptureResult, OcrResult } from '@/types';

interface ScreenReaderPageProps {
  selectedWindow: WindowInfo | null;
  onSelectWindow: (win: WindowInfo) => void;
  onStateDetected: (state: string) => void;
}

export const ScreenReaderPage: React.FC<ScreenReaderPageProps> = ({
  selectedWindow,
  onSelectWindow,
  onStateDetected,
}) => {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [loadingWindows, setLoadingWindows] = useState(false);
  const [capture, setCapture] = useState<CaptureResult | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [runningOcr, setRunningOcr] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [activeWordHover, setActiveWordHover] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchWindows = async () => {
    setLoadingWindows(true);
    try {
      const list = await invokeCommand<WindowInfo[]>('list_windows');
      setWindows(list || []);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to enumerate desktop windows.');
    } finally {
      setLoadingWindows(false);
    }
  };

  useEffect(() => {
    fetchWindows();
  }, []);

  const handleSelectWindow = async (win: WindowInfo) => {
    try {
      await invokeCommand('select_test_window', { id: win.id, title: win.title });
      onSelectWindow(win);
      setStatusMsg(`Selected: "${win.title}" (HWND: ${win.id})`);
      // Automatically capture snapshot upon selection
      triggerCapture(win.id);
    } catch (err: unknown) {
      setStatusMsg(`Selection error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const triggerCapture = async (windowId?: number) => {
    const targetId = windowId || selectedWindow?.id;
    if (!targetId) {
      setStatusMsg('Please select a window first.');
      return;
    }

    setCapturing(true);
    setStatusMsg(null);
    try {
      const result = await invokeCommand<CaptureResult>('capture_test_window', {
        window_id: targetId,
      });
      setCapture(result);
      // Run OCR automatically on capture
      triggerOcr(result.image_base64);
    } catch (err: unknown) {
      setStatusMsg(`Capture failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCapturing(false);
    }
  };

  const triggerOcr = async (imageBase64: string) => {
    setRunningOcr(true);
    try {
      const result = await invokeCommand<OcrResult>('run_ocr', {
        image_base64: imageBase64,
        target_phrases: [
          'Start Test',
          'Find Test Scenario',
          'Begin Test',
          'Preparing test scenario',
          'Safe Interaction Area',
          'Test Completed',
        ],
      });
      setOcrResult(result);

      // Check current state from backend
      const st = await invokeCommand<string>('get_current_state');
      if (st) onStateDetected(st);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setRunningOcr(false);
    }
  };

  const filteredWindows = windows.filter((w) =>
    w.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            Screen Reader &amp; Window Capture
          </h2>
          <p className="text-xs text-slate-400">
            Select an approved local simulator window, capture frames, and extract OCR bounding boxes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWindows}
            disabled={loadingWindows}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingWindows ? 'animate-spin' : ''}`} />
            Refresh Windows
          </button>
          <button
            onClick={() => triggerCapture()}
            disabled={!selectedWindow || capturing}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            {capturing ? 'Capturing...' : 'Capture Snapshot'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg text-xs bg-slate-800/80 border border-slate-700 text-slate-200 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Window Selector */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Available Desktop Windows ({filteredWindows.length})
              </span>
            </div>

            {/* Search filter */}
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter by title..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800/50 border border-slate-700/60 rounded-md text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5 mt-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredWindows.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No matching windows found.
                </div>
              ) : (
                filteredWindows.map((win) => {
                  const isSelected = selectedWindow?.id === win.id;
                  return (
                    <button
                      key={win.id}
                      onClick={() => handleSelectWindow(win)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500/80 text-blue-200 shadow-sm'
                          : 'bg-slate-800/30 hover:bg-slate-800/70 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[190px]">
                          {win.title}
                        </span>
                        {win.is_approved_simulator && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                            Approved Target
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10.5px] text-slate-500 font-mono">
                        <span>HWND: {win.id}</span>
                        <span>•</span>
                        <span>{win.width}x{win.height}</span>
                        {win.is_foreground && (
                          <span className="text-emerald-400 font-semibold">• Foreground</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Safety Rule: Input only targets approved simulator</span>
          </div>
        </div>

        {/* Right Column: Screenshot Preview & OCR Bounding Boxes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Window Capture Preview &amp; Vision Canvas
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {capture && (
                  <span>
                    {capture.width} x {capture.height} px
                  </span>
                )}
                {runningOcr && (
                  <span className="text-blue-400 font-medium animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Processing OCR...
                  </span>
                )}
              </div>
            </div>

            {/* Canvas / Preview Container */}
            <div className="mt-4 relative min-h-[360px] max-h-[500px] bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
              {capture ? (
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <img
                    src={capture.image_base64}
                    alt="Captured Window"
                    className="max-h-[460px] w-auto object-contain rounded shadow"
                  />

                  {/* Bounding box overlays */}
                  {ocrResult &&
                    ocrResult.words.map((w, idx) => (
                      <div
                        key={idx}
                        onMouseEnter={() => setActiveWordHover(w.text)}
                        onMouseLeave={() => setActiveWordHover(null)}
                        style={{
                          left: `${(w.bbox.x / 1280) * 100}%`,
                          top: `${(w.bbox.y / 720) * 100}%`,
                          width: `${(w.bbox.width / 1280) * 100}%`,
                          height: `${(w.bbox.height / 720) * 100}%`,
                        }}
                        className={`absolute border rounded pointer-events-auto cursor-pointer transition-all ${
                          activeWordHover === w.text
                            ? 'border-yellow-400 bg-yellow-400/20 ring-2 ring-yellow-400/50'
                            : 'border-blue-500/70 bg-blue-500/10 hover:border-blue-400'
                        }`}
                        title={`"${w.text}" (${w.confidence.toFixed(1)}% conf)`}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center p-8 space-y-2 text-slate-500">
                  <Crosshair className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">No screenshot captured yet.</p>
                  <p className="text-[11px] text-slate-600">
                    Select a target window from the left panel and click &ldquo;Capture Snapshot&rdquo;.
                  </p>
                </div>
              )}
            </div>

            {/* OCR Extracted Text & Confidence */}
            {ocrResult && (
              <div className="mt-4 p-4 rounded-lg bg-slate-800/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Extracted Text &amp; Confidence ({ocrResult.confidence.toFixed(1)}% avg)
                  </span>
                  <span className="text-slate-400">
                    {ocrResult.words.length} tokens detected
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-mono bg-slate-950/50 p-2.5 rounded border border-slate-800">
                  {ocrResult.text || '<No text detected>'}
                </p>

                {/* Token chips */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {ocrResult.words.map((w, idx) => (
                    <span
                      key={idx}
                      onMouseEnter={() => setActiveWordHover(w.text)}
                      onMouseLeave={() => setActiveWordHover(null)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer transition-colors ${
                        activeWordHover === w.text
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {w.text}{' '}
                      <span className="text-[9.5px] text-slate-500 font-sans">
                        {w.confidence.toFixed(0)}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
