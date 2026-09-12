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
  Layers,
  Search,
  ArrowRight,
  LayoutGrid,
  FilePlus,
  Terminal,
  Activity
} from 'lucide-react';

import { API_BASE_URL } from '../config';

export default function Dashboard({ authUser, onOpenAuth, onSelectProject }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(null);

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

  const handleLaunchProject = (projectId) => {
    if (onSelectProject) {
      onSelectProject(projectId);
    }
    navigate(`/lab/${projectId}`);
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this circuit project?')) return;

    const token = localStorage.getItem('syncarch_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete project');
      }
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert(`Error deleting project: ${err.message}`);
    }
  };

  const handleCreateFromTemplate = async (templateType) => {
    const token = localStorage.getItem('syncarch_token');
    if (!token) {
      onOpenAuth();
      return;
    }

    setCreatingTemplate(templateType);
    let title = 'Untitled Circuit';
    let circuit_data = { components: [], wires: [] };

    if (templateType === 'blank') {
      title = 'Blank Logic Schematic';
      circuit_data = { components: [], wires: [] };
    } else if (templateType === 'arduino') {
      title = 'Arduino Uno R3 Starter';
      circuit_data = {
        components: [
          {
            id: `arduino-${Date.now()}`,
            type: 'ARDUINO',
            x: 192,
            y: 168,
            label: 'Arduino Uno R3',
            state: { powered: true, pinStates: { D2: 1 } },
            pins: [
              { id: '5V', name: '5V', type: 'power', direction: 'output' },
              { id: 'GND', name: 'GND', type: 'power', direction: 'output' },
              { id: 'D2', name: 'D2 (TX)', type: 'digital', direction: 'output' },
              { id: 'A0', name: 'A0', type: 'analog', direction: 'input' }
            ]
          },
          {
            id: `switch-${Date.now()}`,
            type: 'SWITCH',
            x: 528,
            y: 192,
            label: 'Digital Input Switch',
            state: { active: true },
            pins: [{ id: 'out', name: 'OUT', type: 'digital', direction: 'output' }]
          },
          {
            id: `led-${Date.now()}`,
            type: 'LED',
            x: 768,
            y: 216,
            label: 'Status Indicator LED',
            state: { active: true },
            pins: [{ id: 'in', name: 'IN', type: 'digital', direction: 'input' }]
          }
        ],
        wires: []
      };
    } else if (templateType === 'nand_dff') {
      title = 'Digital Logic Lab (NAND + D-FF)';
      const nandId = `nand-${Date.now()}`;
      const dffId = `dff-${Date.now()}`;
      const switchId = `switch-${Date.now()}`;
      const ledId = `led-${Date.now()}`;

      circuit_data = {
        components: [
          {
            id: switchId,
            type: 'SWITCH',
            x: 120,
            y: 216,
            label: 'Pulse Input Switch',
            state: { active: true },
            pins: [{ id: 'out', name: 'OUT', type: 'digital', direction: 'output' }]
          },
          {
            id: nandId,
            type: 'NAND',
            x: 384,
            y: 192,
            label: '74HC00 NAND Gate',
            state: { inputA: 1, inputB: 1, output: 0 },
            pins: [
              { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
              { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
              { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
            ]
          },
          {
            id: dffId,
            type: 'DFF',
            x: 672,
            y: 192,
            label: '7474 D Flip-Flop',
            state: { d: 0, clk: 1, q: 0, qBar: 1 },
            pins: [
              { id: 'd', name: 'D', type: 'digital', direction: 'input' },
              { id: 'clk', name: 'CLK', type: 'digital', direction: 'input' },
              { id: 'q', name: 'Q', type: 'digital', direction: 'output' },
              { id: 'qBar', name: '~Q', type: 'digital', direction: 'output' }
            ]
          },
          {
            id: ledId,
            type: 'LED',
            x: 936,
            y: 216,
            label: 'Q Output Indicator',
            state: { active: false },
            pins: [{ id: 'in', name: 'IN', type: 'digital', direction: 'input' }]
          }
        ],
        wires: [
          {
            id: `w-${Date.now()}-1`,
            fromCompId: switchId,
            fromPin: 'out',
            toCompId: nandId,
            toPin: 'inA',
            active: true
          },
          {
            id: `w-${Date.now()}-2`,
            fromCompId: nandId,
            fromPin: 'outY',
            toCompId: dffId,
            toPin: 'd',
            active: false
          },
          {
            id: `w-${Date.now()}-3`,
            fromCompId: dffId,
            fromPin: 'q',
            toCompId: ledId,
            toPin: 'in',
            active: false
          }
        ]
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, circuit_data })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create template project');

      handleLaunchProject(data.projectId);
    } catch (err) {
      alert(`Template creation error: ${err.message}`);
    } finally {
      setCreatingTemplate(null);
    }
  };

  const [selectedTag, setSelectedTag] = useState('All');
  const availableTags = ['All', '#Sequential-Logic', '#Shift-Registers', '#Arduino', '#Logic-Gates', '#Microcontroller'];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = (p.title || 'Untitled Circuit').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag === 'All' || (p.tags && p.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-10 relative z-10 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-8 mt-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                Workspace Dashboard
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
              Welcome back, {authUser?.given_name || authUser?.displayName || authUser?.name || (authUser?.email ? authUser.email.split('@')[0] : 'Engineer')}
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Create new digital schematics from starter templates or open your saved cloud circuits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCreateFromTemplate('blank')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 border border-cyan-400/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Circuit</span>
            </button>

            <button
              onClick={fetchProjects}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Refresh projects"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Section 1: Quick Starter Templates */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <FilePlus className="w-4.5 h-4.5 text-cyan-400" />
            <span>Quick Start Templates</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Template 1: Blank Canvas */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => handleCreateFromTemplate('blank')}
              className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition duration-200 cursor-pointer shadow-xl relative overflow-hidden group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-slate-100 group-hover:text-cyan-300 transition">
                Blank Workbench
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Empty 2D infinite engineering grid ready for custom digital logic gates, ICs, and microcontrollers.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                <span>Create Blank Schematic</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </motion.div>

            {/* Template 2: Arduino Starter */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => handleCreateFromTemplate('arduino')}
              className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition duration-200 cursor-pointer shadow-xl relative overflow-hidden group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-slate-100 group-hover:text-indigo-300 transition">
                Arduino Uno Starter
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Pre-wired ATmega328P microcontroller with digital switches, status LEDs, and embedded C++ sketch panel.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                <span>Spawn Microcontroller Lab</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </motion.div>

            {/* Template 3: Digital Logic Lab */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => handleCreateFromTemplate('nand_dff')}
              className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition duration-200 cursor-pointer shadow-xl relative overflow-hidden group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-slate-100 group-hover:text-purple-300 transition">
                Digital Logic Lab
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Complete sequential logic setup featuring 74HC00 NAND gate, 7474 D Flip-Flop, logic pulse switches, and active LED monitors.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                <span>Spawn Logic Lab</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Section 2: User Saved Projects & Tag Filtering */}
        <div className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <FolderKanban className="w-4.5 h-4.5 text-indigo-400" />
              <span>Your Saved Projects</span>
              {projects.length > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {projects.length}
                </span>
              )}
            </h2>

            {authUser && (
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search circuits by title or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 placeholder-slate-500 outline-none transition"
                />
              </div>
            )}
          </div>

          {/* Sleek Tag Filter Bar */}
          {authUser && projects.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-mono text-slate-500 mr-1">Filter by Tag:</span>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition cursor-pointer border ${
                    selectedTag === tag
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-md shadow-cyan-950/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Unauthenticated Protection Lock Card */}
          {!authUser ? (
            <div className="p-10 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-center space-y-4 max-w-md mx-auto shadow-2xl backdrop-blur-xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Authentication Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign in with your Google account to save logic schematics and access your cloud workspace.
              </p>
              <button
                onClick={onOpenAuth}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold shadow-xl shadow-cyan-500/20 border border-cyan-400/30 transition hover:scale-105"
              >
                Sign In with Google
              </button>
            </div>
          ) : loading ? (
            <div className="py-20 text-center space-y-3 bg-slate-900/30 rounded-2xl border border-slate-800">
              <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400 font-mono">Fetching saved circuits from SQLite cloud...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
              ⚠️ {error}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">
                {searchQuery || selectedTag !== 'All' ? 'No matching circuits found' : 'No Saved Projects'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || selectedTag !== 'All' ? 'Try clearing search or tag filters.' : 'Click one of the templates above to spawn your first circuit!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleLaunchProject(project.id)}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 cursor-pointer shadow-xl flex flex-col justify-between group backdrop-blur-md"
                >
                  <div className="space-y-3">
                    {/* Visual Dynamic Base64 Thumbnail or Fallback Icon */}
                    <div className="w-full h-36 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative group-hover:border-cyan-500/30 transition">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 text-slate-600">
                          <Cpu className="w-10 h-10 text-cyan-500/40 mb-1" />
                          <span className="text-[10px] font-mono text-slate-500">SyncArch Schematic</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-md text-slate-300 border border-slate-700 shadow">
                          #{project.id}
                        </span>
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="p-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                          title="Delete circuit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition line-clamp-1">
                        {project.title || 'Untitled Circuit'}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(project.updated_at + (project.updated_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Tag Badges */}
                    {project.tags && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {project.tags.split(',').map((t, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-cyan-400 border border-slate-700/80">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">SQLite Protected</span>
                    <div className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Open Lab</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
