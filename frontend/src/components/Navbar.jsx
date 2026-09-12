import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Cpu, 
  Play, 
  FolderKanban, 
  Home, 
  LogOut, 
  UserCheck, 
  Sparkles, 
  Activity,
  ChevronDown,
  Settings,
  Globe
} from 'lucide-react';

export default function Navbar({ authUser, onOpenAuth, onLogout, isConnected, onOpenSettings }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Connection Status */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30 group-hover:scale-105 transition">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-100 tracking-tight flex items-center gap-1">
                Sync<span className="text-cyan-400">Arch</span>
              </span>
            </div>
          </Link>

          {/* Connection Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {isConnected ? 'LIVE ENGINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Navigation Route Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              isActive('/') 
                ? 'bg-slate-800 text-cyan-400 border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          <Link
            to="/dashboard"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              isActive('/dashboard') 
                ? 'bg-slate-800 text-cyan-400 border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>My Circuits</span>
          </Link>

          <Link
            to="/community"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              isActive('/community') 
                ? 'bg-slate-800 text-cyan-400 border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Marketplace</span>
          </Link>

          <Link
            to="/lab"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              isActive('/lab') 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10' 
                : 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulator Lab</span>
          </Link>
        </nav>

        {/* User Auth & Actions */}
        <div className="flex items-center gap-3">
          {authUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition text-xs font-medium text-slate-200"
              >
                {authUser.picture || authUser.avatar ? (
                  <img
                    src={authUser.picture || authUser.avatar}
                    alt={authUser.name || authUser.email}
                    className="w-5 h-5 rounded-full object-cover border border-cyan-400/40"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] border border-cyan-400/40">
                    {authUser.email ? authUser.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="hidden md:inline max-w-[120px] truncate">
                  {authUser.given_name || authUser.displayName || authUser.name || (authUser.email ? authUser.email.split('@')[0] : 'User')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-[11px] text-slate-400 font-mono">Signed in as</p>
                    <p className="font-bold text-slate-100 truncate">
                      {authUser.given_name || authUser.displayName || authUser.name || (authUser.email ? authUser.email.split('@')[0] : 'User')}
                    </p>
                    <p className="text-xs text-cyan-400 font-mono truncate">{authUser.email}</p>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition text-left mb-0.5"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                    <span>My Dashboard</span>
                  </Link>

                  <Link
                    to="/lab"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition text-left mb-1"
                  >
                    <Play className="w-3.5 h-3.5 text-indigo-400 fill-current" />
                    <span>Simulator Lab</span>
                  </Link>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onOpenSettings) onOpenSettings();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition text-left mb-1 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>Settings & Customization</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition text-left border-t border-slate-800 pt-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
