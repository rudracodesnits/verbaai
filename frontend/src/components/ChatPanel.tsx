import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Key } from 'lucide-react';
import { verbaApi } from '../services/api';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contextText: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, contextText }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('verba_api_key') || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (contextText) {
        setMessages([
          { role: 'system', content: `Context: ${contextText}` },
          { role: 'assistant', content: 'I see you selected some text! How can I help you analyze, summarize, or explain it?' }
        ]);
      } else {
        setMessages([
          { role: 'assistant', content: 'Hello! I am your VerbaAI assistant. Feel free to ask me anything about natural language processing, API integration, or general questions.' }
        ]);
      }
    }
  }, [isOpen, contextText]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('verba_api_key', val);
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Filter out system message from API call if desired, or send it all
      const apiMessages = newMessages.filter(m => m.role !== 'system');
      const finalContext = contextText || "VerbaAI General Assistant Chat Session";
      const response = await verbaApi.chat(finalContext, apiMessages, apiKey);
      
      setMessages([...newMessages, { role: 'assistant', content: response.data.reply }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${error.response?.data?.message || error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-screen w-96 bg-white/5 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Ask AI</h2>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-400">
          <Key size={14} />
          <span>API Key Required</span>
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="Enter your VerbaAI API Key"
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : msg.role === 'system'
                  ? 'bg-slate-800 text-slate-300 text-xs italic border border-white/10'
                  : 'bg-white/10 text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.role === 'system' ? 'Selected Text Context:' : ''} {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
            <div className="bg-white/10 text-slate-200 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={contextText ? "Ask about the selected text..." : "Ask me anything..."}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            disabled={loading || !apiKey.trim()}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !apiKey.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
