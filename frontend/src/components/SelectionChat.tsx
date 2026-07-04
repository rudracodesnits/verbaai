import React, { useState } from 'react';
import { MessageSquareCode, Sparkles } from 'lucide-react';
import { ChatPanel } from './ChatPanel';

export const SelectionChat: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [contextText, setContextText] = useState('');

  const handleToggleChat = () => {
    if (!isChatOpen) {
      // Capture any active text selection when opening the chat
      const selection = window.getSelection();
      const selected = selection?.toString().trim() || '';
      setContextText(selected);
    }
    setIsChatOpen(!isChatOpen);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isChatOpen && (
        <button
          onClick={handleToggleChat}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 border border-indigo-400/20 hover:shadow-indigo-500/50 hover:scale-110 active:scale-95 transition-all duration-300 group"
          title="Chat with VerbaAI"
        >
          <div className="relative">
            <MessageSquareCode size={24} className="group-hover:rotate-6 transition-transform duration-300" />
            <Sparkles size={12} className="absolute -top-1.5 -right-1.5 text-yellow-300 animate-pulse" />
          </div>
        </button>
      )}

      <ChatPanel
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        contextText={contextText}
      />
    </>
  );
};
