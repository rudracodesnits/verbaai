import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, authApi, verbaApi, teamApi, alertApi } from '../services/api';
import { 
  Key, Plus, Trash2, Copy, Check, Loader2, Activity, Database, Clock, Zap, AlertTriangle, 
  CreditCard, Sparkles, CheckCircle, Layers, Upload, PlayCircle, ExternalLink,
  Users, Settings, Bell, Mail
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [keys, setKeys] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Tabs & Features
  const [activeTab, setActiveTab] = useState<'keys' | 'batch' | 'teams' | 'settings'>('keys');
  const [teams, setTeams] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [batchJobs, setBatchJobs] = useState<any[]>([]);
  const [selectedBatchJob, setSelectedBatchJob] = useState<any | null>(null);
  const [batchTexts, setBatchTexts] = useState('');
  const [batchEndpoint, setBatchEndpoint] = useState('summarize');
  const [batchApiKey, setBatchApiKey] = useState('');
  const [batchTemp, setBatchTemp] = useState(0.3);
  const [batchTokens, setBatchTokens] = useState(1024);
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'summarize',
    'sentiment',
    'toxicity',
    'keywords',
    'chat',
  ]);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);

  // New analytics state variables
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const [errorRate, setErrorRate] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [keysRes, usageRes, meRes, batchRes, teamsRes, alertsRes] = await Promise.all([
          dashboardApi.getKeys(),
          dashboardApi.getUsage(),
          authApi.getMe(),
          dashboardApi.getBatchJobs(1, 15),
          teamApi.getTeams().catch(() => ({ success: false })),
          alertApi.getAlerts().catch(() => ({ success: false }))
        ]);

        if (keysRes.success) setKeys(keysRes.data);
        if (meRes.success) updateUser(meRes.data);
        if (batchRes.success) setBatchJobs(batchRes.data.jobs);
        if (teamsRes && teamsRes.success) setTeams(teamsRes.data?.teams || []);
        if (alertsRes && alertsRes.success) setAlerts(alertsRes.data?.alerts || []);
        if (usageRes.success) {
          const stats = usageRes.data;
          setTotalRequests(stats.totalRequests || 0);
          setTotalTokens(stats.totalTokens || 0);
          setAvgLatency(stats.avgLatency || 0);
          setCacheHitRate(stats.cacheHitRate || 0);
          setErrorRate(stats.errorRate || 0);
          setRecentLogs(stats.recentLogs || []);

          // Format usage for chart
          const formattedUsage = (stats.byEndpoint || []).map((u: any) => ({
            endpoint: u.endpoint,
            requests: u.requests,
          }));
          setUsage(formattedUsage);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate, updateUser]);

  // Polling for active batch jobs
  useEffect(() => {
    const hasActiveJobs = batchJobs.some(j => j.status === 'PENDING' || j.status === 'PROCESSING');
    if (!hasActiveJobs || !isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const res = await dashboardApi.getBatchJobs(1, 15);
        if (res.success) {
          setBatchJobs(res.data.jobs);
        }
      } catch (err) {
        console.error('Error polling batch jobs:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [batchJobs, isAuthenticated]);

  const handleInspectBatchJob = async (jobId: string) => {
    try {
      const res = await dashboardApi.getBatchJobDetails(jobId);
      if (res.success) {
        setSelectedBatchJob(res.data);
      }
    } catch (err) {
      console.error('Failed to inspect batch job details', err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    try {
      const res = await teamApi.createTeam(newTeamName);
      if (res.success) {
        setNewTeamName('');
        const tRes = await teamApi.getTeams();
        if (tRes.success) setTeams(tRes.data.teams);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteMember = async (e: React.FormEvent, teamId: string) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await teamApi.inviteMember(teamId, inviteEmail);
      setInviteEmail('');
      const tRes = await teamApi.getTeams();
      if (tRes.success) setTeams(tRes.data.teams);
      alert('Invite sent!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to invite member');
    }
  };

  const handleMarkAlertsRead = async () => {
    try {
      await alertApi.markAllRead();
      setAlerts(alerts.map(a => ({ ...a, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };


  const handleCreateBatchJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTexts.trim() || !batchApiKey) return;

    const texts = batchTexts.split('\n').map(t => t.trim()).filter(Boolean);
    if (texts.length === 0) return;

    try {
      setSubmittingBatch(true);
      const res = await verbaApi.submitBatchJob(
        batchEndpoint,
        texts,
        { temperature: batchTemp, maxTokens: batchTokens },
        batchApiKey
      );

      if (res.success) {
        setBatchTexts('');
        // Refresh batch list
        const batchRes = await dashboardApi.getBatchJobs(1, 15);
        if (batchRes.success) setBatchJobs(batchRes.data.jobs);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit batch job.');
    } finally {
      setSubmittingBatch(false);
    }
  };

  const sessionId = searchParams.get('session_id');
  useEffect(() => {
    if (sessionId && isAuthenticated) {
      const handleMockCheckout = async () => {
        try {
          setUpgrading(true);
          const res = await dashboardApi.upgradeMockTier(sessionId);
          if (res.success) {
            const meRes = await authApi.getMe();
            if (meRes.success) {
              updateUser(meRes.data);
            }
          }
        } catch (e) {
          console.error('Failed to process upgrade:', e);
        } finally {
          setUpgrading(false);
          searchParams.delete('session_id');
          setSearchParams(searchParams);
        }
      };
      handleMockCheckout();
    }
  }, [sessionId, isAuthenticated, searchParams, setSearchParams, updateUser]);

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const res = await dashboardApi.createCheckoutSession();
      if (res.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Failed to initiate upgrade:', err);
    } finally {
      setUpgrading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    setCreating(true);
    try {
      const res = await dashboardApi.createKey(newKeyName, selectedScopes, expiresInDays);
      if (res.success) {
        setNewKeySecret(res.data.key);
        setNewKeyName('');
        setSelectedScopes(['summarize', 'sentiment', 'toxicity', 'keywords', 'chat']);
        setExpiresInDays(null);
        // Refresh keys
        const keysRes = await dashboardApi.getKeys();
        if (keysRes.success) setKeys(keysRes.data);
      }
    } catch (err) {
      console.error('Failed to create key', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this key?')) return;

    try {
      const res = await dashboardApi.revokeKey(id);
      if (res.success) {
        setKeys(keys.filter(k => k.id !== id));
      }
    } catch (err) {
      console.error('Failed to revoke key', err);
    }
  };

  const copyToClipboard = () => {
    if (newKeySecret) {
      navigator.clipboard.writeText(newKeySecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Welcome, {user?.name}</h1>
          <p className="text-slate-400 mt-2">Manage your API keys and monitor usage</p>
        </div>
        
        {/* Notification Bell */}
        <div className="relative group z-50">
          <button className="p-2.5 bg-slate-900/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-colors relative">
            <Bell className="w-5 h-5 text-slate-300" />
            {alerts.filter(a => !a.isRead).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0f172a]">
                {alerts.filter(a => !a.isRead).length}
              </span>
            )}
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-xl">
              <span className="text-sm font-semibold text-slate-200">Notifications</span>
              {alerts.some(a => !a.isRead) && (
                <button onClick={handleMarkAlertsRead} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Mark all read</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className={`p-4 border-b border-slate-800/50 flex gap-3 ${!alert.isRead ? 'bg-blue-500/5' : ''}`}>
                    <div className="mt-0.5">
                      {alert.type === 'BUDGET_WARNING' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div>
                      <p className={`text-sm ${!alert.isRead ? 'text-slate-200' : 'text-slate-400'}`}>{alert.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Requests</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{totalRequests.toLocaleString()}</span>
            <Activity className="w-5 h-5 text-blue-400 shrink-0" />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Tokens</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{totalTokens.toLocaleString()}</span>
            <Database className="w-5 h-5 text-purple-400 shrink-0" />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Avg Latency</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{avgLatency}ms</span>
            <Clock className="w-5 h-5 text-cyan-400 shrink-0" />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Cache Hit Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{cacheHitRate}%</span>
            <Zap className="w-5 h-5 text-green-400 shrink-0" />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-700/50 flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Error Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-2xl font-bold font-mono ${errorRate > 0 ? 'text-red-400' : 'text-slate-100'}`}>{errorRate}%</span>
            <AlertTriangle className={`w-5 h-5 shrink-0 ${errorRate > 0 ? 'text-red-400' : 'text-slate-500'}`} />
          </div>
        </div>
      </div>

      {/* Left Column: API Keys & Recent Requests & Batch Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 p-1.5 bg-slate-950/40 rounded-xl border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('keys')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'keys' 
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Key className="w-4 h-4" />
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'batch' 
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Layers className="w-4 h-4" />
              Batch Jobs
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'teams' 
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Users className="w-4 h-4" />
              Teams
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'settings' 
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          {activeTab === 'keys' ? (
            <div className="glass-panel p-6 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-400" />
                  API Keys
                </h2>
              </div>

              {newKeySecret && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h3 className="text-green-400 font-medium mb-2">New API Key Created!</h3>
                  <p className="text-sm text-green-200/70 mb-3">
                    Please copy this key now. You won't be able to see it again!
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-900 p-2.5 rounded text-sm text-slate-300 font-mono break-all">
                      {newKeySecret}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateKey} className="space-y-4 mb-8">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Key name (e.g., Production App)"
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={creating || !newKeyName || selectedScopes.length === 0}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
                  >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/30 rounded-xl border border-slate-850">
                {/* Scopes Selection */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Key Permissions (Scopes)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['summarize', 'sentiment', 'toxicity', 'keywords', 'chat'].map((scope) => {
                      const isSelected = selectedScopes.includes(scope);
                      return (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedScopes(selectedScopes.filter((s) => s !== scope));
                            } else {
                              setSelectedScopes([...selectedScopes, scope]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-sm'
                              : 'bg-transparent text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          /{scope}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expiration Selection */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Expiration
                  </span>
                  <select
                    value={expiresInDays === null ? 'never' : expiresInDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExpiresInDays(val === 'never' ? null : Number(val));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    <option value="never">Never Expire</option>
                    <option value="30">Expires in 30 Days</option>
                    <option value="90">Expires in 90 Days</option>
                    <option value="180">Expires in 180 Days</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Prefix</th>
                    <th className="pb-3 font-medium">Scopes</th>
                    <th className="pb-3 font-medium">Expires</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {keys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                        No API keys found. Create one above.
                      </td>
                    </tr>
                  ) : (
                    keys.map((key) => {
                      const isExpired = key.expiresAt && new Date() > new Date(key.expiresAt);
                      return (
                        <tr key={key.id} className="text-sm">
                          <td className="py-4 text-slate-200 font-medium">{key.name}</td>
                          <td className="py-4 font-mono text-xs text-slate-400">{key.prefix}...</td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {key.scopes?.map((scope: string) => (
                                <span
                                  key={scope}
                                  className="text-[9px] font-bold tracking-wide uppercase bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                                >
                                  {scope}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4">
                            {key.expiresAt ? (
                              <span
                                className={`text-xs ${
                                  isExpired ? 'text-red-400 font-medium' : 'text-slate-400'
                                }`}
                              >
                                {new Date(key.expiresAt).toLocaleDateString()}
                                {isExpired && ' (Expired)'}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 font-light">Never</span>
                            )}
                          </td>
                          <td className="py-4 text-xs text-slate-400">
                            {new Date(key.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleRevoke(key.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'batch' ? (
          // Render Batch Jobs tab
          <div className="space-y-6 animate-fade-in">
              {/* Batch Request Playground */}
              <div className="glass-panel p-6 rounded-xl border border-slate-700/50 space-y-4">
                <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-blue-400" />
                  Batch Processing Playground
                </h2>
                <p className="text-xs text-slate-400">
                  Submit up to 100 inputs to process asynchronously. Split each input with a new line.
                </p>

                <form onSubmit={handleCreateBatchJob} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Target Endpoint</label>
                      <select
                        value={batchEndpoint}
                        onChange={(e) => setBatchEndpoint(e.target.value)}
                        className="w-full bg-slate-950/45 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm cursor-pointer"
                      >
                        <option value="summarize">Summarize</option>
                        <option value="sentiment">Sentiment</option>
                        <option value="toxicity">Toxicity</option>
                        <option value="keywords">Keywords</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">API Authorization Key</label>
                      <input
                        type="password"
                        placeholder="Enter tfk_... secret key"
                        value={batchApiKey}
                        onChange={(e) => setBatchApiKey(e.target.value)}
                        className="w-full bg-slate-950/45 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-400 font-semibold uppercase">Temperature</span>
                        <span className="text-xs font-mono text-blue-400 font-bold">{batchTemp}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={batchTemp}
                        onChange={(e) => setBatchTemp(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-400 font-semibold uppercase">Max Tokens</span>
                        <span className="text-xs font-mono text-blue-400 font-bold">{batchTokens}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4096"
                        step="1"
                        value={batchTokens}
                        onChange={(e) => setBatchTokens(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Inputs (1 text per line)</label>
                    <textarea
                      rows={4}
                      placeholder="Input item 1&#10;Input item 2&#10;Input item 3..."
                      value={batchTexts}
                      onChange={(e) => setBatchTexts(e.target.value)}
                      className="w-full bg-slate-955 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBatch || !batchTexts.trim() || !batchApiKey}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all w-fit shadow-md shadow-blue-955/30"
                  >
                    {submittingBatch ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enqueuing Batch...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Submit Batch Job
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Batch Jobs History List */}
              <div className="glass-panel p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-6">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Execution Logs
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                        <th className="pb-3">Job ID</th>
                        <th className="pb-3">Endpoint</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Progress</th>
                        <th className="pb-3">Created</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                      {batchJobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                            No batch jobs enqueued yet.
                          </td>
                        </tr>
                      ) : (
                        batchJobs.map((job) => {
                          const percentage = Math.round((job.processedItems / job.totalItems) * 100);
                          return (
                            <tr key={job.id}>
                              <td className="py-4 font-mono text-xs text-slate-450">{job.id.slice(0, 8)}...</td>
                              <td className="py-4">
                                <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-xs text-slate-300">
                                  {job.endpoint}
                                </span>
                              </td>
                              <td className="py-4">
                                {job.status === 'COMPLETED' ? (
                                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15 font-semibold w-fit">
                                    Completed
                                  </span>
                                ) : job.status === 'PROCESSING' ? (
                                  <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/15 font-semibold w-fit">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Processing
                                  </span>
                                ) : job.status === 'FAILED' ? (
                                  <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/15 font-semibold w-fit">
                                    Failed
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 font-semibold w-fit">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-slate-850 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full ${job.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-500'}`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-mono text-slate-450">
                                    {job.processedItems}/{job.totalItems} ({percentage}%)
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 text-xs text-slate-450 font-mono">
                                {new Date(job.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => handleInspectBatchJob(job.id)}
                                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                                >
                                  Inspect
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'teams' ? (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-panel p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-blue-400" />
                  Teams & Collaboration
                </h2>
                <form onSubmit={handleCreateTeam} className="flex gap-3 mb-8">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="New Team Name"
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                  <button type="submit" disabled={!newTeamName} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Team
                  </button>
                </form>

                <div className="space-y-6">
                  {teams.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">You are not a member of any teams.</p>
                  ) : (
                    teams.map((team: any) => (
                      <div key={team.id} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center cursor-pointer" onClick={() => setActiveTeamId(activeTeamId === team.id ? null : team.id)}>
                          <div>
                            <h3 className="font-semibold text-slate-200">{team.name}</h3>
                            <p className="text-xs text-slate-500">{team.members.length} members</p>
                          </div>
                          <span className="text-xs text-blue-400 font-semibold px-2 py-1 bg-blue-500/10 rounded-md">
                            {team.ownerId === user?.id ? 'Owner' : 'Member'}
                          </span>
                        </div>
                        {activeTeamId === team.id && (
                          <div className="p-4">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Members</h4>
                            <div className="space-y-2 mb-4">
                              {team.members.map((m: any) => (
                                <div key={m.id} className="flex items-center justify-between text-sm bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold">{m.user.name.charAt(0)}</div>
                                    <span className="text-slate-300">{m.user.name} <span className="text-slate-500 text-xs ml-1">({m.user.email})</span></span>
                                  </div>
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{m.role}</span>
                                </div>
                              ))}
                            </div>
                            {team.ownerId === user?.id && (
                              <form onSubmit={(e) => handleInviteMember(e, team.id)} className="flex gap-2">
                                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Invite member by email" className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                                <button type="submit" disabled={!inviteEmail} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">Invite</button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-panel p-6 rounded-xl border border-slate-700/50 space-y-6">
                <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Account Settings
                </h2>
                
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-4">
                  <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2">Budget & Alerts</h3>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Monthly Budget (Tokens)</span>
                    <span className="font-mono text-slate-200 font-semibold">{user?.monthlyBudget || 100000}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Alert Threshold</span>
                    <span className="font-mono text-slate-200 font-semibold">{user?.alertThreshold || 80}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 italic">Budget limits can be adjusted by contacting support or upgrading to an Enterprise plan.</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent API Requests Section */}
          <div className="glass-panel p-6 rounded-xl border border-slate-700/50">
            <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-blue-400" />
              Recent API Requests (Last 20)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-sm text-slate-400">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Endpoint</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Latency</th>
                    <th className="pb-3 font-medium">Cache</th>
                    <th className="pb-3 font-medium text-right">Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                        No requests made yet.
                      </td>
                    </tr>
                  ) : (
                    recentLogs.map((log, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-3 text-slate-400 font-mono text-xs">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 font-mono text-blue-400 text-xs">
                          /api/{log.endpoint}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            log.statusCode >= 200 && log.statusCode < 300 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {log.statusCode}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300 font-mono text-xs">
                          {log.latency}ms
                        </td>
                        <td className="py-3">
                          {log.cached ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                              Hit
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                              Miss
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-300">
                          {log.tokensUsed}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Usage Stats */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-slate-700/50">
            <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-cyan-400" />
              Usage Summary
            </h2>

            {usage.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No usage data available yet.
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Total Requests by Endpoint
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={usage} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="endpoint" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          cursor={{ fill: '#334155', opacity: 0.4 }}
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                        />
                        <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">Total Tokens Used</span>
                    <span className="text-slate-200 font-mono font-medium">
                      {totalTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total API Calls</span>
                    <span className="text-slate-200 font-mono font-medium">
                      {totalRequests.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Billing & Plans Section */}
          <div className="glass-panel p-6 rounded-xl border border-slate-700/50 space-y-6">
            <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              Subscription & Billing
            </h2>

            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 text-sm">Active Plan</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                user?.tier === 'PRO' 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.3)] border-amber-450/20' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {user?.tier || 'FREE'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Daily API Quota</span>
                <span className="font-mono text-slate-200">
                  {user?.tier === 'PRO' ? '5,000 requests' : '100 requests'}
                </span>
              </div>
              <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full ${user?.tier === 'PRO' ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, (totalRequests / (user?.tier === 'PRO' ? 5000 : 100)) * 100)}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-500 text-right font-mono">
                {totalRequests} requests consumed today
              </div>
            </div>

            {user?.tier !== 'PRO' ? (
              <div className="p-4 bg-gradient-to-br from-slate-900 to-blue-955/30 rounded-xl border border-blue-900/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-300">Upgrade to PRO</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-100">$29</span>
                  <span className="text-xs text-slate-400 font-sans">/ month</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    5,000 daily API request limit
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    Custom temperature & token configurations
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    Advanced Logs & request details view
                  </li>
                </ul>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                >
                  {upgrading ? 'Connecting Checkout...' : 'Upgrade Now'}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-br from-slate-900 to-amber-955/20 rounded-xl border border-amber-900/25 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                <h3 className="text-sm font-bold text-slate-200">You are a PRO Member</h3>
                <p className="text-xs text-slate-400">
                  Enjoying high quotas, full model options, and deep request search. Thank you for your support!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Batch Job Inspector Modal */}
      {selectedBatchJob && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedBatchJob(null)}
          />
          <div className="relative w-full max-w-3xl bg-[#0f172a]/95 border-l border-slate-800 h-full shadow-2xl flex flex-col z-10 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  Batch Job Details
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300">
                    {selectedBatchJob.endpoint}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">{selectedBatchJob.id}</p>
              </div>
              <button
                onClick={() => setSelectedBatchJob(null)}
                className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Status</span>
                  <span className={`text-sm font-bold uppercase ${
                    selectedBatchJob.status === 'COMPLETED' ? 'text-emerald-400' :
                    selectedBatchJob.status === 'PROCESSING' ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    {selectedBatchJob.status}
                  </span>
                </div>
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Progress</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {selectedBatchJob.processedItems} / {selectedBatchJob.totalItems} items
                  </span>
                </div>
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Created At</span>
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    {new Date(selectedBatchJob.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-slate-300">Processed Items</label>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-950/40 text-xs font-semibold text-slate-500 uppercase">
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 font-sans font-semibold">Input Snippet</th>
                        <th className="py-3 px-4 font-sans font-semibold">Output / Error</th>
                        <th className="py-3 px-4 text-right font-sans font-semibold">Tokens / Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                      {selectedBatchJob.items?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-500">
                            No items logged yet. If job is enqueued, please wait.
                          </td>
                        </tr>
                      ) : (
                        selectedBatchJob.items?.map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-800/10">
                            <td className="py-3 px-4">
                              {item.status === 'COMPLETED' ? (
                                <span className="text-emerald-450 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">OK</span>
                              ) : item.status === 'FAILED' ? (
                                <span className="text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/15">Error</span>
                              ) : (
                                <span className="text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Pending</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono max-w-[150px] truncate" title={item.inputText}>
                              {item.inputText}
                            </td>
                            <td className="py-3 px-4 font-mono max-w-[200px] truncate" title={item.outputText || item.error || ''}>
                              {item.status === 'COMPLETED' ? (
                                <span className="text-slate-300">{item.outputText}</span>
                              ) : (
                                <span className="text-red-400">{item.error || 'N/A'}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                              <div>{item.tokensUsed} tokens</div>
                              <div>{item.latency} ms</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
