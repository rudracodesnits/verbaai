import React, { useState, useEffect } from 'react';
import { Key, Send, AlertCircle, Loader2, Copy, Check, Terminal, GitCompare } from 'lucide-react';
import { verbaApi, fineTuningApi } from '../services/api';
import { JSONViewer } from '../components/JSONViewer';

type Endpoint = 'summarize' | 'sentiment' | 'toxicity' | 'keywords' | 'chat';

interface RequestHistory {
  id: string;
  endpoint: Endpoint;
  status: number;
  time: string;
}

export const PlaygroundPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [modelList, setModelList] = useState<string[]>(['gpt-4o-mini', 'gpt-3.5-turbo']);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [selectedModelB, setSelectedModelB] = useState('gpt-4o-mini');

  useEffect(() => {
    const fetchCustomModels = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fineTuningApi.getJobs();
          if (res.success && res.data) {
            const succeededModels = res.data
              .filter((j: any) => j.status === 'SUCCEEDED' && j.fineTunedModel)
              .map((j: any) => j.fineTunedModel);
            setModelList(['gpt-4o-mini', 'gpt-3.5-turbo', ...succeededModels]);
          }
        }
      } catch (err) {
        console.error('Failed to load custom models:', err);
      }
    };
    fetchCustomModels();
  }, []);
  const [text, setText] = useState('VerbaAI is an incredible tool that allows developers to quickly integrate natural language processing capabilities into their applications. However, sometimes dealing with complex APIs can be frustrating if the documentation is poor.');
  const [endpoint, setEndpoint] = useState<Endpoint>('sentiment');
  
  // Compare Mode Toggle
  const [compareMode, setCompareMode] = useState(false);

  // Config A parameters
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [latencyA, setLatencyA] = useState<number | null>(null);

  // Config B parameters
  const [temperatureB, setTemperatureB] = useState(0.7);
  const [maxTokensB, setMaxTokensB] = useState(1024);
  const [loadingB, setLoadingB] = useState(false);
  const [responseB, setResponseB] = useState<any>(null);
  const [errorB, setErrorB] = useState<string | null>(null);
  const [latencyB, setLatencyB] = useState<number | null>(null);

  const [history, setHistory] = useState<RequestHistory[]>([]);

  // Snippets states
  const [snippetTab, setSnippetTab] = useState('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const endpoints: { id: Endpoint; label: string }[] = [
    { id: 'summarize', label: 'Summarize' },
    { id: 'sentiment', label: 'Sentiment' },
    { id: 'toxicity', label: 'Toxicity' },
    { id: 'keywords', label: 'Keywords' },
    { id: 'chat', label: 'Chat' },
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
    setLatencyA(null);

    if (compareMode) {
      setLoadingB(true);
      setErrorB(null);
      setResponseB(null);
      setLatencyB(null);
    }

    const runRequestA = async () => {
      const startTime = Date.now();
      try {
        let res;
        const options = { temperature, maxTokens, model: selectedModel };
        switch (endpoint) {
          case 'summarize':
            res = await verbaApi.summarize(text, apiKey, options);
            break;
          case 'sentiment':
            res = await verbaApi.sentiment(text, apiKey, options);
            break;
          case 'toxicity':
            res = await verbaApi.toxicity(text, apiKey, options);
            break;
          case 'keywords':
            res = await verbaApi.keywords(text, apiKey, options);
            break;
          case 'chat':
            res = await verbaApi.chat(text, [{ role: 'user', content: 'What does this mean?' }], apiKey, options);
            break;
        }
        setResponse(res);
        setLatencyA(Date.now() - startTime);
      } catch (err: any) {
        console.error(err);
        const status = err.response?.status || 500;
        if (status === 401) {
          setError('Unauthorized: Invalid API Key');
        } else if (status === 429) {
          setError('Rate Limit Exceeded: Please try again later');
        } else {
          setError(err.response?.data?.message || err.message || 'An error occurred');
        }
        if (err.response?.data) {
          setResponse(err.response.data);
        }
      } finally {
        setLoading(false);
      }
    };

    const runRequestB = async () => {
      const startTime = Date.now();
      try {
        let res;
        const options = { temperature: temperatureB, maxTokens: maxTokensB, model: selectedModelB };
        switch (endpoint) {
          case 'summarize':
            res = await verbaApi.summarize(text, apiKey, options);
            break;
          case 'sentiment':
            res = await verbaApi.sentiment(text, apiKey, options);
            break;
          case 'toxicity':
            res = await verbaApi.toxicity(text, apiKey, options);
            break;
          case 'keywords':
            res = await verbaApi.keywords(text, apiKey, options);
            break;
          case 'chat':
            res = await verbaApi.chat(text, [{ role: 'user', content: 'What does this mean?' }], apiKey, options);
            break;
        }
        setResponseB(res);
        setLatencyB(Date.now() - startTime);
      } catch (err: any) {
        console.error(err);
        const status = err.response?.status || 500;
        if (status === 401) {
          setErrorB('Unauthorized: Invalid API Key');
        } else if (status === 429) {
          setErrorB('Rate Limit Exceeded: Please try again later');
        } else {
          setErrorB(err.response?.data?.message || err.message || 'An error occurred');
        }
        if (err.response?.data) {
          setResponseB(err.response.data);
        }
      } finally {
        setLoadingB(false);
      }
    };

    const promises = [runRequestA()];
    if (compareMode) {
      promises.push(runRequestB());
    }

    await Promise.all(promises);

    const hasError = error || (compareMode && errorB);
    const newHistory: RequestHistory = {
      id: Date.now().toString(),
      endpoint,
      status: hasError ? 500 : 200,
      time: new Date().toLocaleTimeString(),
    };
    setHistory(prev => [newHistory, ...prev].slice(0, 5));
  };

  const getComparisonMetrics = () => {
    if (!compareMode || !latencyA || !latencyB) return null;
    const faster = latencyA < latencyB ? 'A' : 'B';
    const diffMs = Math.abs(latencyA - latencyB);
    const fasterPercent = Math.round((diffMs / Math.max(latencyA, latencyB)) * 100);

    const tokensA = response?.tokensUsed || 0;
    const tokensB = responseB?.tokensUsed || 0;
    const cleaner = tokensA < tokensB ? 'A' : tokensB < tokensA ? 'B' : null;

    return { faster, fasterPercent, cleaner };
  };

  const metrics = getComparisonMetrics();

  const getCodeSnippet = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const cleanApiKey = apiKey || 'YOUR_API_KEY';
    const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n');

    const jsPayload = endpoint === 'chat'
      ? `{\n    context: "${escapedText}",\n    messages: [{ role: 'user', content: 'What does this mean?' }],\n    model: "${selectedModel}",\n    temperature: ${temperature},\n    maxTokens: ${maxTokens}\n  }`
      : `{\n    text: "${escapedText}",\n    model: "${selectedModel}",\n    temperature: ${temperature},\n    maxTokens: ${maxTokens}\n  }`;

    const jsonPayload = endpoint === 'chat'
      ? `{\n    "context": "${escapedText}",\n    "messages": [{ "role": "user", "content": "What does this mean?" }],\n    "model": "${selectedModel}",\n    "temperature": ${temperature},\n    "maxTokens": ${maxTokens}\n}`
      : `{\n    "text": "${escapedText}",\n    "model": "${selectedModel}",\n    "temperature": ${temperature},\n    "maxTokens": ${maxTokens}\n}`;

    switch (snippetTab) {
      case 'javascript':
        return `fetch('${baseUrl}/api/${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${cleanApiKey}'
  },
  body: JSON.stringify(${jsPayload})
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;

      case 'python':
        const pyPayload = endpoint === 'chat'
          ? `{\n    "context": "${escapedText}",\n    "messages": [{"role": "user", "content": "What does this mean?"}],\n    "temperature": ${temperature},\n    "maxTokens": ${maxTokens}\n}`
          : `{\n    "text": "${escapedText}",\n    "temperature": ${temperature},\n    "maxTokens": ${maxTokens}\n}`;
        return `import requests

url = "${baseUrl}/api/${endpoint}"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${cleanApiKey}"
}
data = ${pyPayload}

response = requests.post(url, headers=headers, json=data)
print(response.json())`;

      case 'go':
        const goPayloadType = endpoint === 'chat' 
          ? `map[string]interface{}{\n\t\t"context": "${escapedText}",\n\t\t"messages": []map[string]string{{"role": "user", "content": "What does this mean?"}},\n\t\t"temperature": ${temperature},\n\t\t"maxTokens": ${maxTokens},\n\t}` 
          : `map[string]interface{}{\n\t\t"text": "${escapedText}",\n\t\t"temperature": ${temperature},\n\t\t"maxTokens": ${maxTokens},\n\t}`;
        return `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "${baseUrl}/api/${endpoint}"
	payload := ${goPayloadType}
	jsonPayload, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", "${cleanApiKey}")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`;

      case 'curl':
      default:
        return `curl -X POST ${baseUrl}/api/${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${cleanApiKey}" \\
  -d '${jsonPayload}'`;
    }
  };

  const copySnippetToClipboard = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="flex-1 container mx-auto px-4 py-6 max-w-7xl flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-120px)] lg:overflow-hidden">
      
      {/* Left Column: Configuration & Input */}
      <div className="flex-1 flex flex-col gap-4 lg:h-full lg:overflow-y-auto pr-1 custom-scrollbar">
        
        {/* API Key Input & Compare Mode Switch */}
        <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
              <Key className="w-4 h-4 text-blue-400" />
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your x-api-key"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 shrink-0">
            <GitCompare className={`w-4 h-4 ${compareMode ? 'text-blue-400' : 'text-slate-500'}`} />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">Compare Mode</span>
              <span className="text-[10px] text-slate-500">Run A/B parameter settings</span>
            </div>
            <button
              type="button"
              onClick={() => setCompareMode(!compareMode)}
              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                compareMode ? 'bg-blue-600' : 'bg-slate-750'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  compareMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Endpoint Selection */}
        <div className="glass-panel p-4 rounded-xl">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Endpoint
          </label>
          <div className="flex flex-wrap gap-1.5">
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setEndpoint(ep.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  endpoint === ep.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                /api/{ep.id}
              </button>
            ))}
          </div>
        </div>

        {/* API Settings: Temperature & Max Tokens (Standard or Dual) */}
        {!compareMode ? (
          <div className="glass-panel p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-300">
                API Settings
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-slate-900 border border-slate-750 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {modelList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Temperature</span>
                  <span className="text-xs font-mono text-blue-400 font-bold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Max Tokens</span>
                  <span className="text-xs font-mono text-blue-400 font-bold">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4096"
                  step="1"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Config A Panel */}
            <div className="glass-panel p-4 rounded-xl border border-blue-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold tracking-wider uppercase">
                  Configuration A
                </span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-slate-900 border border-slate-750 rounded px-2 py-0.5 text-[10px] text-slate-200 focus:outline-none"
                >
                  {modelList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">Temperature</span>
                    <span className="text-xs font-mono text-blue-400 font-bold">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">Max Tokens</span>
                    <span className="text-xs font-mono text-blue-400 font-bold">{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4096"
                    step="1"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Config B Panel */}
            <div className="glass-panel p-4 rounded-xl border border-purple-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded text-[10px] font-bold tracking-wider uppercase">
                  Configuration B
                </span>
                <select
                  value={selectedModelB}
                  onChange={(e) => setSelectedModelB(e.target.value)}
                  className="bg-slate-900 border border-slate-750 rounded px-2 py-0.5 text-[10px] text-slate-200 focus:outline-none"
                >
                  {modelList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">Temperature</span>
                    <span className="text-xs font-mono text-purple-400 font-bold">{temperatureB}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperatureB}
                    onChange={(e) => setTemperatureB(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">Max Tokens</span>
                    <span className="text-xs font-mono text-purple-400 font-bold">{maxTokensB}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4096"
                    step="1"
                    value={maxTokensB}
                    onChange={(e) => setMaxTokensB(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Text Input */}
        <div className="glass-panel p-4 rounded-xl flex flex-col min-h-[180px]">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Input Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to analyze..."
            className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all custom-scrollbar resize-none text-sm"
          />
          <div className="mt-2.5 flex justify-end">
            <button
              onClick={handleSendRequest}
              disabled={loading || (compareMode && loadingB)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-all"
            >
              {loading || (compareMode && loadingB) ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {loading || (compareMode && loadingB) ? 'Sending...' : compareMode ? 'Run Comparison' : 'Send Request'}
            </button>
          </div>
        </div>

        {/* Code Snippets Generator */}
        <div className="glass-panel p-4 rounded-xl border border-slate-700/50 flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              Integration Code
            </h3>
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              {['curl', 'javascript', 'python', 'go'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSnippetTab(tab)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                    snippetTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'javascript' ? 'JS' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <pre className="bg-slate-950 p-3 rounded-lg text-xs text-slate-300 font-mono overflow-x-auto max-h-48 custom-scrollbar leading-relaxed">
              {getCodeSnippet()}
            </pre>
            <button
              onClick={copySnippetToClipboard}
              className="absolute top-2.5 right-2.5 p-1.5 bg-slate-850 hover:bg-slate-700 hover:text-white rounded border border-slate-700 text-slate-300 transition-colors"
              title="Copy snippet to clipboard"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Response Panels & History */}
      <div className={`${compareMode ? 'lg:w-[700px]' : 'lg:w-[400px]'} flex flex-col gap-4 lg:h-full lg:overflow-y-auto pl-1 custom-scrollbar transition-all duration-300 min-w-0 shrink-0`}>
        
        {/* Response Area */}
        <div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden border border-slate-700 min-h-[220px]">
          {!compareMode ? (
            // Standard Output Panel
            <>
              <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center shrink-0">
                <h3 className="font-semibold text-sm text-slate-200">Response</h3>
                {latencyA && (
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                    {latencyA} ms
                  </span>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                {error && (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-200 leading-relaxed">{error}</p>
                  </div>
                )}
                
                {response ? (
                  <JSONViewer data={response} />
                ) : !error && !loading ? (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs text-center py-8">
                    Send a request to see the response here
                  </div>
                ) : null}
                
                {loading && !response && !error && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-xs animate-pulse">Waiting for response...</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Compare Side-by-Side Panel
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-850 border-b border-slate-800 flex justify-between items-center shrink-0">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5 text-blue-400" />
                  Configuration Comparisons
                </h3>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-y-auto custom-scrollbar h-full">
                
                {/* Column A Output */}
                <div className="p-4 flex flex-col h-full min-h-[200px]">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <span className="text-[10px] font-bold text-blue-400 uppercase">Output A</span>
                    <div className="flex items-center gap-2">
                      {latencyA && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          metrics?.faster === 'A' 
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15' 
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}>
                          {latencyA} ms {metrics?.faster === 'A' && `(⚡ -${metrics.fasterPercent}%)`}
                        </span>
                      )}
                      {response?.tokensUsed !== undefined && (
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                          {response.tokensUsed} tokens
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-200 leading-relaxed">{error}</p>
                      </div>
                    )}
                    
                    {response ? (
                      <JSONViewer data={response} />
                    ) : !error && !loading ? (
                      <div className="flex-1 flex items-center justify-center text-slate-500 text-xs text-center py-8">
                        Awaiting execution...
                      </div>
                    ) : null}

                    {loading && !response && !error && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-[10px] animate-pulse">Running config A...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column B Output */}
                <div className="p-4 flex flex-col h-full min-h-[200px]">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <span className="text-[10px] font-bold text-purple-400 uppercase">Output B</span>
                    <div className="flex items-center gap-2">
                      {latencyB && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          metrics?.faster === 'B' 
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15' 
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}>
                          {latencyB} ms {metrics?.faster === 'B' && `(⚡ -${metrics.fasterPercent}%)`}
                        </span>
                      )}
                      {responseB?.tokensUsed !== undefined && (
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                          {responseB.tokensUsed} tokens
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    {errorB && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-200 leading-relaxed">{errorB}</p>
                      </div>
                    )}
                    
                    {responseB ? (
                      <JSONViewer data={responseB} />
                    ) : !errorB && !loadingB ? (
                      <div className="flex-1 flex items-center justify-center text-slate-500 text-xs text-center py-8">
                        Awaiting execution...
                      </div>
                    ) : null}

                    {loadingB && !responseB && !errorB && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                        <span className="text-[10px] animate-pulse">Running config B...</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Request History */}
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-700 shrink-0">
          <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700">
            <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono">Recent Requests</h3>
          </div>
          <div className="p-0">
            {history.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No requests made yet
              </div>
            ) : (
              <ul className="divide-y divide-slate-700/50">
                {history.map((item) => (
                  <li key={item.id} className="p-2.5 px-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.status === 200 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs font-mono text-slate-300">/{item.endpoint}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{item.time}</span>
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
