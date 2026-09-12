import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Cpu, 
  Users, 
  Bot, 
  FolderKanban, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Terminal,
  Play,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage({ authUser, onOpenAuth }) {
  const navigate = useNavigate();
  // Live Engine Clock & Simulation State for Landing Page Interactive Preview
  const [clockState, setClockState] = useState(0);
  const [demoSwitchA, setDemoSwitchA] = useState(true);
  const [demoSwitchB, setDemoSwitchB] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setClockState((prev) => (prev === 0 ? 1 : 0));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const notGateOutput = clockState === 0 ? 1 : 0;
  const nandGateOutput = !(demoSwitchA && demoSwitchB);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden font-sans relative">
      {/* Dynamic Background Glow & Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Animated SVG PCB Signal Tracing (Hero Section Background) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-35">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="heroWireGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* PCB Grid Pattern */}
          <pattern id="pcbDotGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#pcbDotGrid)" />

          {/* Faded Background Structural PCB Traces */}
          <g stroke="#1e293b" strokeWidth="2" fill="none">
            <path d="M 0 120 H 400 L 480 200 V 450 H 900 L 980 530 H 1600" />
            <path d="M 200 0 V 300 L 280 380 H 700 L 780 460 V 900" />
            <path d="M 1200 0 V 250 L 1120 330 H 600 L 520 410 V 850" />
            <path d="M 0 600 H 350 L 430 520 H 850 L 930 600 H 1800" />
          </g>

          {/* Glowing Animated Signal Traces */}
          <g fill="none">
            <path
              d="M 0 120 H 400 L 480 200 V 450 H 900 L 980 530 H 1600"
              stroke="#38bdf8"
              strokeWidth="2.5"
              filter="url(#heroWireGlow)"
              className="pcb-trace-line"
            />
            <path
              d="M 200 0 V 300 L 280 380 H 700 L 780 460 V 900"
              stroke="#818cf8"
              strokeWidth="2.5"
              filter="url(#heroWireGlow)"
              className="pcb-trace-line"
              style={{ animationDelay: '-2s' }}
            />
            <path
              d="M 1200 0 V 250 L 1120 330 H 600 L 520 410 V 850"
              stroke="#06b6d4"
              strokeWidth="2.5"
              filter="url(#heroWireGlow)"
              className="pcb-trace-line"
              style={{ animationDelay: '-4s' }}
            />
          </g>

          {/* PCB Micro-via Junction Nodes */}
          <g fill="#020617" stroke="#38bdf8" strokeWidth="2">
            <circle cx="400" cy="120" r="5" />
            <circle cx="480" cy="200" r="5" />
            <circle cx="900" cy="450" r="5" />
            <circle cx="980" cy="530" r="5" />
            <circle cx="280" cy="380" r="5" fill="#818cf8" stroke="#ffffff" />
            <circle cx="700" cy="380" r="5" fill="#818cf8" stroke="#ffffff" />
            <circle cx="1120" cy="330" r="5" fill="#06b6d4" stroke="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
        
        {/* Floating Version Badge */}
        <div className="flex justify-center mb-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold shadow-lg shadow-cyan-950/40 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>v1.0 Real-Time ECE Engine</span>
            <span className="text-slate-500">|</span>
            <span className="text-indigo-300 font-mono text-[11px]">Gemini 3.6 Copilot</span>
          </motion.div>
        </div>

        {/* Hero Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400"
          >
            Collaborative <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">Electronics Lab</span> in Your Browser
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto"
          >
            Design, simulate, and debug digital logic circuits and microcontrollers in real-time with your team. Zero installation required.
          </motion.p>

          {/* Action CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => {
                if (authUser) {
                  navigate('/lab');
                } else {
                  onOpenAuth();
                }
              }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-base shadow-xl shadow-cyan-500/25 border border-cyan-400/30 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current text-white" />
              <span>{authUser ? 'Launch Simulator Lab' : 'Sign In to Launch Lab'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (authUser) {
                  navigate('/dashboard');
                } else {
                  onOpenAuth();
                }
              }}
              className="px-7 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium text-base shadow-lg backdrop-blur-md flex items-center gap-2.5 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <FolderKanban className="w-5 h-5 text-indigo-400" />
              <span>{authUser ? 'My Saved Circuits' : 'Sign In to Save'}</span>
            </button>
          </motion.div>
        </div>

        {/* Live Interactive Read-Only Mini Simulator Preview (Below the Fold) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 max-w-5xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 mb-6 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="text-xs font-mono text-slate-400 ml-2">syncarch://interactive-live-simulation-canvas</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/30">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Client Logic Tick Active</span>
              </div>
            </div>
          </div>

          {/* Pre-loaded Interactive Live Circuit Demo Canvas */}
          <div className="space-y-6">
            <div className="text-xs font-mono text-cyan-400 flex items-center justify-between">
              <span>ACTIVE TOPOLOGY PREVIEW: Clock Pulse &amp; Sequential Logic Gate</span>
              <span>Click switches to toggle live states</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Circuit 1: 1Hz Clock Generator driving NOT Inverter and Flashing LED */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold text-slate-200">1. Clock Oscillator &amp; Inverter</span>
                  <span className="text-cyan-400 font-bold">{clockState ? 'CLK: HIGH (1)' : 'CLK: LOW (0)'}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
                  {/* Clock Source Block */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-xs font-mono transition ${
                      clockState ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]' : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      CLK
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">1Hz Osc</span>
                  </div>

                  {/* Wire Flow Line */}
                  <div className="flex-1 h-0.5 mx-3 bg-slate-800 relative overflow-hidden">
                    <div className={`absolute inset-0 transition-all ${clockState ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-700'}`} />
                  </div>

                  {/* NOT Inverter Block */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex flex-col items-center justify-center text-indigo-300 font-bold text-[11px] font-mono shadow-md">
                      <span>7404</span>
                      <span className="text-[9px] text-slate-400">NOT</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">Inverter</span>
                  </div>

                  {/* Wire Flow Line */}
                  <div className="flex-1 h-0.5 mx-3 bg-slate-800 relative overflow-hidden">
                    <div className={`absolute inset-0 transition-all ${notGateOutput ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-700'}`} />
                  </div>

                  {/* Output Flashing LED */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 ${
                      notGateOutput 
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.6)]' 
                        : 'bg-slate-900 border-slate-700 text-slate-600'
                    }`}>
                      <Zap className={`w-6 h-6 ${notGateOutput ? 'animate-pulse text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">{notGateOutput ? 'LED ON' : 'LED OFF'}</span>
                  </div>
                </div>
              </div>

              {/* Circuit 2: Dual Input NAND Gate Logic Sandbox */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold text-slate-200">2. Interactive NAND Gate (74HC00)</span>
                  <span className={nandGateOutput ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {nandGateOutput ? 'Output: HIGH (1)' : 'Output: LOW (0)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 items-center">
                  {/* Interactive Input Switches */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setDemoSwitchA(!demoSwitchA)}
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-between transition cursor-pointer ${
                        demoSwitchA ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <span>SW A</span>
                      <span>{demoSwitchA ? '1' : '0'}</span>
                    </button>
                    <button
                      onClick={() => setDemoSwitchB(!demoSwitchB)}
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-between transition cursor-pointer ${
                        demoSwitchB ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <span>SW B</span>
                      <span>{demoSwitchB ? '1' : '0'}</span>
                    </button>
                  </div>

                  {/* NAND Gate Block */}
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-950/90 border border-indigo-500/50 flex flex-col items-center justify-center text-indigo-300 font-bold text-xs font-mono shadow-lg">
                      <Cpu className="w-5 h-5 text-indigo-400 mb-0.5" />
                      <span>7400</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">Y = !(A &amp; B)</span>
                  </div>

                  {/* Output Indicator LED */}
                  <div className="flex flex-col items-center justify-center">
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 ${
                      nandGateOutput 
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.6)]' 
                        : 'bg-rose-500/10 border-rose-500/40 text-rose-500'
                    }`}>
                      <Zap className={`w-6 h-6 ${nandGateOutput ? 'animate-pulse text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">{nandGateOutput ? 'LED ON (1)' : 'LED OFF (0)'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition duration-300 backdrop-blur-sm space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Real-Time Multiplayer</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Work on schematics simultaneously with teammates. See live collaborator cursors and enjoy component block-locking to eliminate edit collisions.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition duration-300 backdrop-blur-sm space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Circuit AI Copilot</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ask Gemini 3.6 Flash to debug logic paths, calculate resistor values, or write micro-code for ESP32 and Arduino microcontrollers directly on the canvas.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition duration-300 backdrop-blur-sm space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Cloud Circuit Persistence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Save your complex digital circuits and custom embedded code safely to SQLite database with Google Single Sign-On and JWT encryption.
            </p>
          </motion.div>
        </div>

        {/* Footer Banner */}
        <div className="mt-28 pt-8 border-t border-slate-800/60 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SyncArch Real-Time Electronics Engine. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>33 FPS Throttled Socket.io</span>
            <span>•</span>
            <span>SQLite DB</span>
            <span>•</span>
            <span>Google OAuth 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
