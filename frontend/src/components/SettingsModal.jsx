import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Palette, 
  Cpu, 
  User, 
  X, 
  Check, 
  Key, 
  Sliders, 
  LogOut, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Zap, 
  Grid, 
  Layout, 
  Activity 
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  authUser,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [showApiKey, setShowApiKey] = useState(false);

  // Local state copy for instant editing
  const [formData, setFormData] = useState({
    theme: 'dark',
    gridPattern: 'dots',
    clockSpeed: 100,
    animationGlow: true,
    customApiKey: '',
    displayName: '',
    bio: '',
    customAvatar: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        theme: settings.theme || 'dark',
        gridPattern: settings.gridPattern || 'dots',
        clockSpeed: settings.clockSpeed ?? 100,
        animationGlow: settings.animationGlow ?? true,
        customApiKey: settings.customApiKey || '',
        displayName: settings.displayName || authUser?.name || '',
        bio: settings.bio || '',
        customAvatar: settings.customAvatar || authUser?.picture || authUser?.avatar || ''
      });
    }
  }, [settings, authUser, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    if (onUpdateSettings) {
      onUpdateSettings(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Settings & Customization</h3>
              <p className="text-xs text-slate-400">Configure canvas themes, performance controls & account preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Close Settings"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body: Navigation Tabs + Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 p-3 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Appearance & Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'performance'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Simulation & Speed</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Account & API Key</span>
            </button>
          </div>

          {/* Main Tab Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
            
            {/* TAB 1: APPEARANCE & CANVAS STYLING */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                    Canvas Theme Palette
                  </h4>
                  <p className="text-xs text-slate-400">Select visual color scheme for canvas background, glow effects, and wires.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Dark (Default) */}
                  <div
                    onClick={() => handleChange('theme', 'dark')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                      formData.theme === 'dark'
                        ? 'bg-slate-900 border-cyan-500/80 ring-1 ring-cyan-500/50 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">Dark Blueprint</span>
                      {formData.theme === 'dark' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="h-6 rounded-lg bg-[#0e1422] border border-slate-700 flex items-center justify-around px-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></div>
                      <div className="w-4 h-0.5 bg-cyan-400"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                  </div>

                  {/* Option 2: Cyberpunk */}
                  <div
                    onClick={() => handleChange('theme', 'cyberpunk')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                      formData.theme === 'cyberpunk'
                        ? 'bg-slate-900 border-pink-500/80 ring-1 ring-pink-500/50 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-300">Cyberpunk Neon</span>
                      {formData.theme === 'cyberpunk' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                    </div>
                    <div className="h-6 rounded-lg bg-[#0d0718] border border-pink-900 flex items-center justify-around px-2">
                      <div className="w-2 h-2 rounded-full bg-pink-500 shadow-sm shadow-pink-500"></div>
                      <div className="w-4 h-0.5 bg-pink-500"></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    </div>
                  </div>

                  {/* Option 3: High-Contrast PCB */}
                  <div
                    onClick={() => handleChange('theme', 'pcb')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                      formData.theme === 'pcb'
                        ? 'bg-slate-900 border-amber-500/80 ring-1 ring-amber-500/50 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">High-Contrast PCB</span>
                      {formData.theme === 'pcb' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="h-6 rounded-lg bg-[#042f2e] border border-emerald-800 flex items-center justify-around px-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></div>
                      <div className="w-4 h-0.5 bg-amber-400"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                    Canvas Grid Pattern
                  </h4>
                  <p className="text-xs text-slate-400">Choose grid background layout pattern for component alignment.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Grid 1: Dot Matrix */}
                  <div
                    onClick={() => handleChange('gridPattern', 'dots')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      formData.gridPattern === 'dots'
                        ? 'bg-slate-900 border-cyan-500/80 ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Grid className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-medium text-slate-200">Dot Grid</span>
                    </div>
                    {formData.gridPattern === 'dots' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>

                  {/* Grid 2: Architectural Square Grid */}
                  <div
                    onClick={() => handleChange('gridPattern', 'squares')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      formData.gridPattern === 'squares'
                        ? 'bg-slate-900 border-cyan-500/80 ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Layout className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-medium text-slate-200">Square Grid</span>
                    </div>
                    {formData.gridPattern === 'squares' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>

                  {/* Grid 3: Breadboard Matrix */}
                  <div
                    onClick={() => handleChange('gridPattern', 'breadboard')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      formData.gridPattern === 'breadboard'
                        ? 'bg-slate-900 border-cyan-500/80 ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Activity className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-medium text-slate-200">Breadboard Matrix</span>
                    </div>
                    {formData.gridPattern === 'breadboard' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SIMULATION & PERFORMANCE CONTROLS */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                    Simulation Clock Speed & Tick Interval
                  </h4>
                  <p className="text-xs text-slate-400">Adjust real-time logic execution tick frequency for components.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Tick Refresh Interval</span>
                    <span className="font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                      {formData.clockSpeed} ms {formData.clockSpeed <= 20 ? '(1kHz Real-Time)' : ''}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={formData.clockSpeed}
                    onChange={(e) => handleChange('clockSpeed', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>10ms (1kHz High-Performance)</span>
                    <span>100ms (Default)</span>
                    <span>500ms (Power Save)</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                    Rendering Performance Controls
                  </h4>
                  <p className="text-xs text-slate-400">Optimize graphics rendering for low-end or embedded devices.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-200">Logic Wire Animation Glow</span>
                    <p className="text-[11px] text-slate-400">Render glowing SVG flow dashes on active signal paths</p>
                  </div>

                  <button
                    onClick={() => handleChange('animationGlow', !formData.animationGlow)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer ${
                      formData.animationGlow ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNT MANAGEMENT & BYOK API KEY */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                    User Profile Details
                  </h4>
                  <p className="text-xs text-slate-400">Update your custom display name, bio, and avatar URL.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleChange('displayName', e.target.value)}
                      placeholder="e.g. Alex Turing"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Custom Avatar Image URL</label>
                    <input
                      type="text"
                      value={formData.customAvatar}
                      onChange={(e) => handleChange('customAvatar', e.target.value)}
                      placeholder="https://example.com/my-avatar.png"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Bio / Role</label>
                    <textarea
                      rows="2"
                      value={formData.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      placeholder="Senior ECE Engineer specializing in FPGA logic synthesis..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none transition resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>Bring Your Own Key (BYOK API Key)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mb-3">Provide your external Google Gemini or OpenAI API Key for Circuit AI Copilot execution.</p>

                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={formData.customApiKey}
                      onChange={(e) => handleChange('customApiKey', e.target.value)}
                      placeholder="AIzaSy... (Your private API Key)"
                      className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 font-mono outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Session Termination / Logout */}
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      if (onLogout) onLogout();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Terminate Session & Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Settings saved instantly
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
