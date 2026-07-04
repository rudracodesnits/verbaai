import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight, 
  Clock, Cpu, Layers, AlertCircle, CheckCircle2, XCircle, 
  Copy, Check, ExternalLink, Calendar, RefreshCw 
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Log {
  id: string;
  endpoint: string;
  tokensUsed: number;
  cached: boolean;
  latency: number;
  error: boolean;
  statusCode: number;
  inputText: string | null;
  outputText: string | null;
  createdAt: string;
  apiKey: {
    name: string;
    prefix: string;
  } | null;
}

export const LogsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State variables
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filters
  const [endpoint, setEndpoint] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Selected Log (for detail drawer)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Auth Guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page,
        limit,
        endpoint: endpoint || undefined,
        search: debouncedSearch || undefined,
      };

      if (statusFilter) {
        filters.statusCode = parseInt(statusFilter);
      }

      const res = await dashboardApi.getLogs(filters);
      if (res.success) {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.totalPages);
        setTotalLogs(res.data.pagination.total);
      } else {
        setError(res.message || 'Failed to load logs');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, endpoint, statusFilter, debouncedSearch]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
    }
  }, [fetchLogs, isAuthenticated]);

  const copyToClipboard = (text: string, isInput: boolean) => {
    navigator.clipboard.writeText(text);
    if (isInput) {
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    } else {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  // Export logs to CSV
  const exportToCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ['Timestamp', 'Endpoint', 'API Key', 'Status', 'Latency (ms)', 'Tokens', 'Input', 'Output'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.endpoint,
      log.apiKey ? log.apiKey.name : 'N/A',
      log.statusCode,
      log.latency,
      log.tokensUsed,
      log.inputText || '',
      log.outputText || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `verbaai_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEndpointBadgeColor = (endpoint: string) => {
    switch (endpoint) {
      case 'summarize': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'sentiment': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'toxicity': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'keywords': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'chat': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatTextPayload = (text: string | null) => {
    if (!text) return 'Empty payload';
    try {
      const parsedObj = JSON.parse(text);
      return JSON.stringify(parsedObj, null, 2);
    } catch {
      return text;
    }
  };



  return (
    <div className="flex-1 container mx-auto px-4 py-8 relative text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
            API Request Logs
          </h1>
          <p className="text-slate-400 mt-1">
            Monitor and audit all API requests made with your API keys.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-705 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-900/35 transition-all text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Filters board */}
      <div className="glass-panel p-5 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 border border-slate-800/85 bg-slate-900/40">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search request inputs or outputs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/40 rounded-xl border border-slate-850 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-655"
          />
        </div>

        {/* Endpoint filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550 pointer-events-none" />
          <select
            value={endpoint}
            onChange={(e) => { setEndpoint(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 rounded-xl border border-slate-850 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-300 outline-none appearance-none cursor-pointer transition-all"
          >
            <option value="">All Endpoints</option>
            <option value="summarize">Summarize</option>
            <option value="sentiment">Sentiment</option>
            <option value="toxicity">Toxicity</option>
            <option value="keywords">Keywords</option>
            <option value="chat">Chat</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 rounded-xl border border-slate-850 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-300 outline-none appearance-none cursor-pointer transition-all"
          >
            <option value="">All Statuses</option>
            <option value="200">200 OK (Success)</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="500">500 Server Error</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 mb-6 bg-slate-900/20">
        <div className="overflow-x-auto animate-fade-in">
          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm">Loading logs...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
              <h3 className="text-lg font-semibold text-slate-200">Failed to load logs</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-md">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Layers className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-lg font-semibold text-slate-350">No logs found</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                Make sure you have created an API key and generated requests via the playground or API endpoints.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Endpoint</th>
                  <th className="py-4 px-6">API Key</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Latency</th>
                  <th className="py-4 px-6">Tokens</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-800/15 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs text-slate-450 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEndpointBadgeColor(log.endpoint)}`}>
                        {log.endpoint}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap font-mono text-xs">
                      {log.apiKey ? (
                        <div className="flex items-center gap-1.5" title={log.apiKey.name}>
                          <span className="text-slate-300">{log.apiKey.name}</span>
                          <span className="text-slate-500 text-[10px]">({log.apiKey.prefix}...)</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-sans">Deleted key</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      {log.statusCode === 200 ? (
                        <span className="flex items-center gap-1.2 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15 font-semibold w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          200 OK
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.2 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/15 font-semibold w-fit">
                          <XCircle className="w-3 h-3" />
                          {log.statusCode}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{log.latency} ms</span>
                        {log.cached && (
                          <span className="text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/20 px-1 rounded font-semibold uppercase">
                            Cache
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap font-mono text-xs text-slate-350">
                      {log.tokensUsed > 0 ? log.tokensUsed : '-'}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                      >
                        Inspect
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-sm text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-300">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-300">
              {Math.min(page * limit, totalLogs)}
            </span>{' '}
            of <span className="font-semibold text-slate-300">{totalLogs}</span> logs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Detailed Log Viewer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedLog(null)}
          />
          
          {/* Drawer content */}
          <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col z-10">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  Request Inspection
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getEndpointBadgeColor(selectedLog.endpoint)}`}>
                    {selectedLog.endpoint}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">{selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Request Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Status Code</span>
                  <span className={`text-sm font-semibold flex items-center gap-1.5 ${selectedLog.statusCode === 200 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedLog.statusCode === 200 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {selectedLog.statusCode} {selectedLog.statusCode === 200 ? 'OK' : 'Error'}
                  </span>
                </div>
                
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Latency</span>
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {selectedLog.latency} ms
                    {selectedLog.cached && (
                      <span className="text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/20 px-1 rounded uppercase font-bold">
                        Cached
                      </span>
                    )}
                  </span>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Tokens Used</span>
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                    <Cpu className="w-4 h-4 text-slate-400" />
                    {selectedLog.tokensUsed > 0 ? selectedLog.tokensUsed : '0 (Cached)'}
                  </span>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">API Key used</span>
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 font-mono text-xs">
                    <Layers className="w-4 h-4 text-slate-400" />
                    {selectedLog.apiKey ? selectedLog.apiKey.name : 'Deleted key'}
                  </span>
                </div>
              </div>

              {/* Input details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Request Input Payload</label>
                  <button
                    onClick={() => copyToClipboard(selectedLog.inputText || '', true)}
                    className="text-xs text-blue-450 hover:text-blue-400 font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    {copiedInput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedInput ? 'Copied' : 'Copy payload'}
                  </button>
                </div>
                <div className="bg-slate-955 rounded-xl border border-slate-800 p-4 overflow-x-auto max-h-[220px]">
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                    {formatTextPayload(selectedLog.inputText)}
                  </pre>
                </div>
              </div>

              {/* Output details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Response Output / Error Message</label>
                  <button
                    onClick={() => copyToClipboard(selectedLog.outputText || '', false)}
                    className="text-xs text-blue-455 hover:text-blue-400 font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    {copiedOutput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedOutput ? 'Copied' : 'Copy payload'}
                  </button>
                </div>
                <div className={`bg-slate-955 rounded-xl border p-4 overflow-x-auto max-h-[300px] ${selectedLog.statusCode === 200 ? 'border-slate-800' : 'border-red-950 bg-red-950/5'}`}>
                  <pre className={`text-xs font-mono whitespace-pre-wrap ${selectedLog.statusCode === 200 ? 'text-slate-350' : 'text-red-400'}`}>
                    {formatTextPayload(selectedLog.outputText)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
