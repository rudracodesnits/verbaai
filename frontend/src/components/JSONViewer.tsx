import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface JSONViewerProps {
  data: any;
}

export const JSONViewer: React.FC<JSONViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400">Response</span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
          title="Copy response"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-blue-300 overflow-auto custom-scrollbar max-h-[400px]">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
};
