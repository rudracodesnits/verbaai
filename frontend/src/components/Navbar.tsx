import React from 'react';
import { Terminal, Code2 } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'playground';
  onViewChange: (view: 'landing' | 'playground') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onViewChange('landing')}
        >
          <Terminal className="w-6 h-6 text-blue-500" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            verbaai API
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => onViewChange('landing')}
            className={`text-sm font-medium transition-colors hover:text-white ${
              currentView === 'landing' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onViewChange('playground')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              currentView === 'playground' 
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Playground
          </button>
        </div>
      </div>
    </nav>
  );
};
