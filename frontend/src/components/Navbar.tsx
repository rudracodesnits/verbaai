import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, Code2, LogOut, LayoutDashboard, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Terminal className="w-6 h-6 text-blue-500" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            verbaai API
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-white ${
              currentPath === '/' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Overview
          </Link>
          <Link
            to="/docs"
            className={`text-sm font-medium transition-colors hover:text-white ${
              currentPath === '/docs' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Docs
          </Link>
          <Link
            to="/chat"
            className={`text-sm font-medium transition-colors hover:text-white ${
              currentPath === '/chat' ? 'text-white' : 'text-slate-400'
            }`}
          >
            AI Chat
          </Link>
          <Link
            to="/playground"
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              currentPath === '/playground' 
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Playground
          </Link>

          <div className="h-6 w-px bg-slate-700 mx-2"></div>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-white ${
                  currentPath === '/dashboard' ? 'text-white' : 'text-slate-400'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/logs"
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-white ${
                  currentPath === '/logs' ? 'text-white' : 'text-slate-400'
                }`}
              >
                <Database className="w-4 h-4" />
                Logs
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-sm font-medium transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
