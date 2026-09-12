import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FolderKanban, 
  Plus, 
  Cpu, 
  Clock, 
  Play, 
  ShieldAlert, 
  Sparkles, 
  Trash2, 
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';

import { API_BASE_URL } from '../config';

export default function DashboardPage({ authUser, onOpenAuth, onSelectProject }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    const token = localStorage.getItem('syncarch_token');
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load projects');
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Fetch projects error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      fetchProjects();
    }
  }, [authUser]);

  const handleLaunchProject = (project) => {
    if (onSelectProject) {
      onSelectProject(project.id);
    }
    navigate('/lab');
  };

  const handleCreateNew = () => {
    navigate('/lab');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 pt-28 pb-20 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <FolderKanban className="w-4 h-4" />
              <span>User Workspace</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">My Saved Circuits</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your saved logic schematics and microcontroller designs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {authUser && (
              <button
                onClick={fetchProjects}
                disabled={loading}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
                title="Refresh projects"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}

            <button
              onClick={handleCreateNew}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 border border-cyan-400/30 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Circuit</span>
            </button>
          </div>
        </div>

        {/* Auth Required Banner if not logged in */}
        {!authUser ? (
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-center space-y-4 max-w-lg mx-auto shadow-2xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Authentication Required</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Please sign in with your Google account to access your saved circuits database.
            </p>
            <button
              onClick={onOpenAuth}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20"
            >
              Sign In with Google
            </button>
          </div>
        ) : (
          /* Projects Grid */
          <div>
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-400 font-mono">Loading saved circuits from database...</p>
              </div>
            ) : error ? (
              <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
                ⚠️ Error fetching projects: {error}
              </div>
            ) : projects.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                  <Zap className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">No Saved Circuits Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You haven't saved any logic schematics yet. Open the simulator lab to start building and save your first circuit!
                </p>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-cyan-500/20"
                >
                  Open Simulator Lab
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ y: -4 }}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 shadow-xl flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <Cpu className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          ID: #{project.id}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-base text-slate-100 group-hover:text-cyan-300 transition">
                          {project.title || 'Untitled Circuit'}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(project.updated_at + (project.updated_at.endsWith('Z') ? '' : 'Z')).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-slate-800/80 mt-5 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">SQLite Cloud</span>
                      <button
                        onClick={() => handleLaunchProject(project)}
                        className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Open in Lab</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
