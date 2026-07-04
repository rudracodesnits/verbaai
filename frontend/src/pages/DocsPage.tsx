import React, { useState } from 'react';
import { Terminal, Shield, Zap, Info, ChevronRight, Copy, Check, BookOpen, Clock, Cpu } from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const sections = [
    { id: 'intro', title: 'Introduction' },
    { id: 'auth', title: 'Authentication' },
    { id: 'rate-limiting', title: 'Rate Limiting' },
    { id: 'caching', title: 'Response Caching' },
    { id: 'summarize', title: 'POST /api/summarize' },
    { id: 'sentiment', title: 'POST /api/sentiment' },
    { id: 'toxicity', title: 'POST /api/toxicity' },
    { id: 'keywords', title: 'POST /api/keywords' },
    { id: 'errors', title: 'Error Handling' },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row container mx-auto px-4 py-12 max-w-7xl gap-12">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 shrink-0 h-fit lg:sticky lg:top-28">
        <div className="flex items-center gap-2 mb-4 px-3">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <h3 className="text-slate-200 uppercase text-xs font-bold tracking-wider">API Documentation</h3>
        </div>
        <nav className="flex flex-col gap-1">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all group"
            >
              {s.title}
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-400" />
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl space-y-16 pb-20">
        
        {/* Intro */}
        <section id="intro" className="scroll-mt-28">
          <h1 className="text-4xl font-extrabold text-slate-100 mb-6 tracking-tight flex items-center gap-3">
            <Cpu className="w-9 h-9 text-blue-500" /> VerbaAI Developer API
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-6">
            Welcome to the VerbaAI developer portal. VerbaAI offers ultra-fast, production-ready Natural Language Processing (NLP) endpoints powered by advanced large language models. Extract keywords, run sentiment analysis, moderate content, or summarize texts with a single API request.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col gap-2">
              <Zap className="w-6 h-6 text-yellow-500 mb-1" />
              <h4 className="font-semibold text-slate-200">Fast & Cached</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Integrated Redis caching guarantees sub-10ms response times for identical queries.</p>
            </div>
            <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col gap-2">
              <Shield className="w-6 h-6 text-green-500 mb-1" />
              <h4 className="font-semibold text-slate-200">Rate Limited</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Protects backend services using Redis token rate limit buckets assigned per user.</p>
            </div>
            <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col gap-2">
              <Terminal className="w-6 h-6 text-blue-500 mb-1" />
              <h4 className="font-semibold text-slate-200">Developer First</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Simple JSON inputs and outputs with intuitive, human-friendly response keys.</p>
            </div>
          </div>
        </section>

        {/* Authentication */}
        <section id="auth" className="scroll-mt-28 border-t border-slate-800/80 pt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-bold text-slate-100">Authentication</h2>
          </div>
          <p className="text-slate-400 mb-6 leading-relaxed">
            All requests to NLP API endpoints must include your secret API key in the <code className="text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono text-sm">x-api-key</code> HTTP request header. API keys can be managed inside the Dashboard page.
          </p>
          
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">cURL Example Headers</span>
              <button 
                onClick={() => handleCopy('curl -X POST http://localhost:3000/api/summarize \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json"', 'auth-curl')} 
                className="text-slate-500 hover:text-slate-300"
              >
                {copied === 'auth-curl' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm text-slate-300 font-mono leading-relaxed bg-slate-950">
{`curl -X POST http://localhost:3000/api/summarize \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>
        </section>

        {/* Rate Limiting */}
        <section id="rate-limiting" className="scroll-mt-28 border-t border-slate-800/80 pt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-bold text-slate-100">Rate Limiting</h2>
          </div>
          <p className="text-slate-400 mb-6 leading-relaxed">
            API endpoints are rate limited by default to prevent budget abuse. The current default is **100 requests per user per day**, resetting at midnight UTC.
          </p>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Every API response returns standard rate-limit headers to help you monitor consumption:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Header</th>
                  <th className="pb-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                <tr>
                  <td className="py-3 font-mono text-blue-400 text-xs">X-RateLimit-Limit</td>
                  <td className="py-3 text-slate-300 text-sm">The maximum number of requests allowed daily. (e.g. 100)</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-blue-400 text-xs">X-RateLimit-Remaining</td>
                  <td className="py-3 text-slate-300 text-sm">The remaining number of requests allowed for today.</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-blue-400 text-xs">X-RateLimit-Reset</td>
                  <td className="py-3 text-slate-300 text-sm">The date when the limit will reset. (Format: YYYY-MM-DD)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Response Caching */}
        <section id="caching" className="scroll-mt-28 border-t border-slate-800/80 pt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-400">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-bold text-slate-100">Response Caching</h2>
          </div>
          <p className="text-slate-400 mb-6 leading-relaxed">
            VerbaAI hashes input texts using SHA-256 to cache exact query responses in Redis for up to **1 hour (3600 seconds)**. Cached requests consume **0 tokens** on the backend and do not call the underlying LLM provider, saving costs and returning responses in milliseconds.
          </p>
          <div className="glass-panel p-4 rounded-xl border border-slate-800/80 flex items-start gap-3 bg-blue-500/5">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              When a response is retrieved from cache, the response body includes the flag <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded font-mono text-xs">"cached": true</code>.
            </p>
          </div>
        </section>

        {/* NLP Endpoints Documentation */}
        <div className="space-y-16 border-t border-slate-800/80 pt-12">
          <h2 className="text-3xl font-bold text-slate-100">NLP API Endpoints</h2>

          {/* Endpoint: Summarize */}
          <section id="summarize" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold font-mono tracking-wider">POST</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono">/api/summarize</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Generates a clean, short summary of a long block of text while preserving primary concepts.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Request Body Schema</h4>
                <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs font-mono">
                    <span className="text-blue-400 font-semibold">text</span>
                    <span className="text-slate-500 italic">string</span>
                    <span className="text-slate-500 font-semibold">Required</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The source text to analyze. Character length must be between 10 and 10,000.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <h4 className="font-bold uppercase tracking-widest">Response Object</h4>
                  <button onClick={() => handleCopy(`{\n  "success": true,\n  "data": {\n    "summary": "AI is machine-demonstrated intelligence, studied as intelligent agents that perceive environments and act to achieve goals."\n  },\n  "cached": false\n}`, 'copy-sum')} className="hover:text-slate-300">
                    {copied === 'copy-sum' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto border border-slate-850">
{`{
  "success": true,
  "data": {
    "summary": "AI is machine-demonstrated intelligence, studied as intelligent agents that perceive environments and act to achieve goals."
  },
  "cached": false
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Endpoint: Sentiment */}
          <section id="sentiment" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold font-mono tracking-wider">POST</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono">/api/sentiment</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Analyzes input text emotion and returns classification (positive, negative, or neutral) with a floating-point score between -1.0 (very negative) and +1.0 (very positive).
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Request Body Schema</h4>
                <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs font-mono">
                    <span className="text-blue-400 font-semibold">text</span>
                    <span className="text-slate-500 italic">string</span>
                    <span className="text-slate-500 font-semibold">Required</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Source text. Character length must be between 10 and 10,000.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <h4 className="font-bold uppercase tracking-widest">Response Object</h4>
                  <button onClick={() => handleCopy(`{\n  "success": true,\n  "data": {\n    "sentiment": "positive",\n    "score": 0.85\n  },\n  "cached": false\n}`, 'copy-sent')} className="hover:text-slate-300">
                    {copied === 'copy-sent' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto border border-slate-850">
{`{
  "success": true,
  "data": {
    "sentiment": "positive",
    "score": 0.85
  },
  "cached": false
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Endpoint: Toxicity */}
          <section id="toxicity" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold font-mono tracking-wider">POST</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono">/api/toxicity</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Moderates texts by identifying if they contain toxic, abusive, aggressive, or hateful wording. Returns a boolean status and a confidence score between 0.0 (no confidence) and 1.0 (highly confident).
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Request Body Schema</h4>
                <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs font-mono">
                    <span className="text-blue-400 font-semibold">text</span>
                    <span className="text-slate-500 italic">string</span>
                    <span className="text-slate-500 font-semibold">Required</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Source review, message, or user comment. Max 10,000 characters.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <h4 className="font-bold uppercase tracking-widest">Response Object</h4>
                  <button onClick={() => handleCopy(`{\n  "success": true,\n  "data": {\n    "toxic": false,\n    "confidence": 0.98\n  },\n  "cached": false\n}`, 'copy-tox')} className="hover:text-slate-300">
                    {copied === 'copy-tox' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto border border-slate-850">
{`{
  "success": true,
  "data": {
    "toxic": false,
    "confidence": 0.98
  },
  "cached": false
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Endpoint: Keywords */}
          <section id="keywords" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold font-mono tracking-wider">POST</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono">/api/keywords</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Extracts high-relevance keyword phrases or tagging suggestions from the source text block. Returns an array containing up to 10 identified strings, ordered by relevance.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Request Body Schema</h4>
                <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs font-mono">
                    <span className="text-blue-400 font-semibold">text</span>
                    <span className="text-slate-500 italic">string</span>
                    <span className="text-slate-500 font-semibold">Required</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Source text content. Max 10,000 characters.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <h4 className="font-bold uppercase tracking-widest">Response Object</h4>
                  <button onClick={() => handleCopy(`{\n  "success": true,\n  "data": {\n    "keywords": ["machine learning", "artificial intelligence", "data", "systems"]\n  },\n  "cached": false\n}`, 'copy-keyw')} className="hover:text-slate-300">
                    {copied === 'copy-keyw' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto border border-slate-850">
{`{
  "success": true,
  "data": {
    "keywords": ["machine learning", "artificial intelligence", "data", "systems"]
  },
  "cached": false
}`}
                </pre>
              </div>
            </div>
          </section>

        </div>

        {/* Errors */}
        <section id="errors" className="scroll-mt-28 border-t border-slate-800/80 pt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-bold text-slate-100">Error Handling</h2>
          </div>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Failed requests will return structured JSON error payloads indicating the reason for the issue. Every error includes a <code className="text-red-400 bg-slate-900 px-1 py-0.5 rounded font-mono text-xs">success: false</code> parameter and a descriptive <code className="text-red-400 bg-slate-900 px-1 py-0.5 rounded font-mono text-xs">message</code>.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {[
              { code: 400, title: 'Bad Request', msg: 'The request body did not meet the Zod validation schemas. For example, text length was below 10 or above 10,000 characters, or fields were missing.' },
              { code: 401, title: 'Unauthorized', msg: 'The x-api-key header was missing, or the provided key is invalid or has been revoked by the user.' },
              { code: 429, title: 'Too Many Requests', msg: 'The daily user rate limit quota of 100 requests was exceeded.' },
              { code: 500, title: 'Internal Server Error', msg: 'An unexpected issue occurred while calling the mock provider or the OpenAI Chat API.' },
            ].map((e) => (
              <div key={e.code} className="flex items-start gap-4 p-5 rounded-xl bg-slate-900/30 border border-slate-800/50">
                <span className="font-mono text-red-400 font-bold text-base mt-0.5 shrink-0 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/10">{e.code}</span>
                <div>
                  <h4 className="font-semibold text-slate-200 text-base">{e.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{e.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
