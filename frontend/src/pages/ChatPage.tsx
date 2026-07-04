import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Key, Trash2, Plus, MessageSquare } from 'lucide-react';
import { verbaApi } from '../services/api';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  context: string;
}

export const ChatPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('verba_api_key') || 'free-test-key');
  const [context, setContext] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('verba_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
          setContext(parsed[0].context || '');
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error(e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save sessions to localStorage
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem('verba_chat_sessions', JSON.stringify(updated));
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `New Chat ${sessions.length + 1}`,
      messages: [
        { role: 'assistant', content: 'Hello! I am your VerbaAI assistant. Provide any context below if you want to analyze text, or just type a prompt to start chatting!' }
      ],
      context: '',
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSession.id);
    setContext('');
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('verba_api_key', val);
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContext(val);
    if (activeSession) {
      const updated = sessions.map(s => s.id === activeSessionId ? { ...s, context: val } : s);
      saveSessions(updated);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
        setContext(updated[0].context || '');
      } else {
        createNewSession();
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey.trim() || !activeSession) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentMessages = activeSession.messages;
    const updatedMessages = [...currentMessages, userMessage];

    // Optimistically update UI
    const tempUpdated = sessions.map(s => {
      if (s.id === activeSessionId) {
        // Auto update title based on first user query
        const firstUserQuery = s.title.startsWith('New Chat') ? input.slice(0, 24) + (input.length > 24 ? '...' : '') : s.title;
        return { ...s, title: firstUserQuery, messages: updatedMessages };
      }
      return s;
    });
    setSessions(tempUpdated);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = updatedMessages.filter(m => m.role !== 'system');
      const finalContext = context.trim() || "VerbaAI General Assistant Chat Session";
      const response = await verbaApi.chat(finalContext, apiMessages, apiKey);
      
      const assistantMessage: Message = { role: 'assistant', content: response.data.reply };
      const finalUpdated = tempUpdated.map(s => 
        s.id === activeSessionId ? { ...s, messages: [...updatedMessages, assistantMessage] } : s
      );
      saveSessions(finalUpdated);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = { role: 'assistant', content: `Error: ${error.response?.data?.message || error.message}` };
      const finalUpdated = tempUpdated.map(s => 
        s.id === activeSessionId ? { ...s, messages: [...updatedMessages, errorMessage] } : s
      );
      saveSessions(finalUpdated);
    } finally {
      setLoading(false);
    }
  };

  const loadPresetPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex-1 flex max-h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Sidebar: Chat History & API Key */}
      <div className="w-80 bg-slate-900/50 border-r border-slate-800 flex flex-col shrink-0">
        
        {/* API Key Box */}
        <div className="p-4 border-b border-slate-850 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Key className="w-3.5 h-3.5 text-blue-400" />
            API Key
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Enter your API Key"
            className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => {
                setActiveSessionId(s.id);
                setContext(s.context || '');
              }}
              className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                activeSessionId === s.id
                  ? 'bg-slate-800/80 text-white'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <MessageSquare className="w-4 h-4 shrink-0 text-blue-500/70" />
                <span className="text-xs truncate font-medium">{s.title}</span>
              </div>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0f172a]/20">
        
        {/* Header / Context Panel */}
        <div className="p-4 bg-slate-900/30 border-b border-slate-800/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-md font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              AI Chat Assistant
            </h1>
            {context && (
              <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Context Active
              </span>
            )}
          </div>
          
          <div className="relative">
            <textarea
              value={context}
              onChange={handleContextChange}
              placeholder="Paste or type text selection context here... (Optional, but useful to chat about specific documentation or code snippets)"
              className="w-full h-16 bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/40 resize-none custom-scrollbar"
            />
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {activeSession?.messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[70%] flex flex-col gap-1">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-600/10'
                      : msg.role === 'system'
                      ? 'bg-slate-900/80 border border-slate-800 text-slate-400 text-xs italic'
                      : 'bg-slate-900/60 border border-slate-800/60 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900/60 border border-slate-800/60 text-slate-300 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Container */}
        {activeSession?.messages.length === 1 && (
          <div className="px-6 py-2 flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => loadPresetPrompt("Can you summarize the context above?")}
              className="text-xs px-3 py-1.5 bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-full transition-all"
            >
              📝 Summarize Text
            </button>
            <button
              onClick={() => loadPresetPrompt("What is the sentiment and tone of this text?")}
              className="text-xs px-3 py-1.5 bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-full transition-all"
            >
              🎭 Analyze Tone
            </button>
            <button
              onClick={() => loadPresetPrompt("Are there any spelling or grammatical errors?")}
              className="text-xs px-3 py-1.5 bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-full transition-all"
            >
              🔍 Proofread Content
            </button>
          </div>
        )}

        {/* Footer Input Form */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center gap-2 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={!apiKey.trim() ? "Provide your API Key in the sidebar to start" : "Type a message..."}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
              disabled={loading || !apiKey.trim()}
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !apiKey.trim()}
              className="absolute right-2.5 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-lg transition-all"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
