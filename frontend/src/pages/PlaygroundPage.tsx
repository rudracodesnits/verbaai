import React, { useState } from 'react';
import { Key, Send, AlertCircle, Loader2 } from 'lucide-react';
import { verbaApi } from '../services/api';
import { JSONViewer } from '../components/JSONViewer';

type Endpoint = 'summarize' | 'sentiment' | 'toxicity' | 'keywords';

interface RequestHistory {
  id: string;
  endpoint: Endpoint;
  status: number;
  time: string;
}

export const PlaygroundPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [text, setText] = useState('VerbaAI is an incredible tool that allows developers to quickly integrate natural language processing capabilities into their applications. However, sometimes dealing with complex APIs can be frustrating if the documentation is poor.');
  const [endpoint, setEndpoint] = useState<Endpoint>('sentiment');
  
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RequestHistory[]>([]);

  const endpoints: { id: Endpoint; label: string }[] = [
    { id: 'summarize', label: 'Summarize' },
    { id: 'sentiment', label: 'Sentiment' },
    { id: 'toxicity', label: 'Toxicity' },
    { id: 'keywords', label: 'Keywords' },
  ];

  const handleSendRequest = async () => {
    if (!apiKey) {
      setError('API Key is required');
      return;
    }
    if (!text) {
      setError('Input text is required');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    let status = 200;

    try {
      let res;
      switch (endpoint) {
        case 'summarize':
          res = await verbaApi.summarize(text, apiKey);
          break;
        case 'sentiment':
          res = await verbaApi.sentiment(text, apiKey);
          break;
        case 'toxicity':
          res = await verbaApi.toxicity(text, apiKey);
          break;
        case 'keywords':
          res = await verbaApi.keywords(text, apiKey);
          break;
      }
      setResponse(res);
    } catch (err: any) {
      console.error(err);
      status = err.response?.status || 500;
      
      if (status === 401) {
        setError('Unauthorized: Invalid API Key');
      } else if (status === 429) {
        setError('Rate Limit Exceeded: Please try again later');
      } else {
        setError(err.response?.data?.message || err.message || 'An error occurred');
      }
      
      // Still set response to show raw error data if available
      if (err.response?.data) {
        setResponse(err.response.data);
      }
    } finally {
      setLoading(false);
      
      // Add to history
      const newHistory: RequestHistory = {
        id: Date.now().toString(),
        endpoint,
        status,
        time: new Date().toLocaleTimeString(),
      };
      setHistory(prev => [newHistory, ...prev].slice(0, 5));
    }
  };

  return (
    <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl flex flex-col lg:flex-row gap-8">
      
      {/* Left Column: Configuration & Input */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* API Key Input */}
        <div className="glass-panel p-6 rounded-xl">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Key className="w-4 h-4" />
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your x-api-key"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Endpoint Selection */}
        <div className="glass-panel p-6 rounded-xl">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Select Endpoint
          </label>
          <div className="flex flex-wrap gap-2">
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setEndpoint(ep.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  endpoint === ep.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                /api/v1/{ep.id}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className="glass-panel p-6 rounded-xl flex-1 flex flex-col">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Input Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to analyze..."
            className="w-full flex-1 min-h-[200px] bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all custom-scrollbar resize-none"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Response & History */}
      <div className="lg:w-[450px] flex flex-col gap-6">
        
        {/* Response Area */}
        <div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden border border-slate-700">
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-medium text-slate-200">Response</h3>
            {error && !response && (
               <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-md border border-red-500/20">
                 Error
               </span>
            )}
          </div>
          
          <div className="p-4 flex-1 flex flex-col">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200 leading-relaxed">{error}</p>
              </div>
            )}
            
            {response ? (
              <JSONViewer data={response} />
            ) : !error && !loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Send a request to see the response here
              </div>
            ) : null}
            
            {loading && !response && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm animate-pulse">Waiting for response...</span>
              </div>
            )}
          </div>
        </div>

        {/* Request History */}
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-700">
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700">
            <h3 className="font-medium text-slate-200 text-sm">Recent Requests</h3>
          </div>
          <div className="p-0">
            {history.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No requests made yet
              </div>
            ) : (
              <ul className="divide-y divide-slate-700/50">
                {history.map((item) => (
                  <li key={item.id} className="p-3 px-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.status === 200 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-mono text-slate-300">/{item.endpoint}</span>
                    </div>
                    <span className="text-xs text-slate-500">{item.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
};
