import React, { useState, useEffect } from 'react';
import {
  FileClock,
  Filter,
  Search,
  Trash2,
  Download,
  RefreshCw,
} from 'lucide-react';
import { invokeCommand } from '@/lib/tauri';
import { ActivityLog } from '@/types';
import { formatTimestamp } from '@/lib/utils';

export const ActivityLogPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await invokeCommand<ActivityLog[]>('get_activity_logs', { limit: 200 });
      setLogs(data || []);
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to fetch logs from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all activity logs?')) return;
    try {
      await invokeCommand('clear_activity_logs');
      setLogs([]);
      setStatusMessage('All activity logs cleared.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.session_id && log.session_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FileClock className="w-5 h-5 text-indigo-400" />
            Activity Log &amp; Audit Trail
          </h2>
          <p className="text-xs text-slate-400">
            Persistent SQLite event history covering state changes, OCR outputs, and test actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-medium border border-rose-500/30 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Logs
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200">
          {statusMessage}
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 font-medium">Filter by Level:</span>
          {['ALL', 'INFO', 'ACTION', 'WARN', 'ERROR'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                selectedLevel === lvl
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search events, tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                    No activity logs found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-800/30 transition-colors font-mono"
                  >
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-[11px]">
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans ${
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
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-medium">
                      {log.event_type}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-sans max-w-md truncate">
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.details_json && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-[11px] text-blue-400 hover:underline font-sans"
                        >
                          View Payload
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-100">
                Log Details: {selectedLog.event_type}
              </h4>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-slate-400">Timestamp: {selectedLog.created_at}</div>
              <div className="text-slate-200 font-medium">{selectedLog.message}</div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">
                Payload JSON
              </label>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-60">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedLog.details_json || '{}'), null, 2);
                  } catch {
                    return selectedLog.details_json;
                  }
                })()}
              </pre>
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
