import React, { useState, useEffect, useRef } from 'react';
import { Activity, ChevronDown, ChevronUp, Play, Pause, RotateCcw, Zap, Sliders, CheckSquare, Square } from 'lucide-react';

export default function OscilloscopeDrawer({ components = [], wires = [], isRunning = true, onToggleRun }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const canvasRef = useRef(null);
  const historyRef = useRef([]); // Stores time-series data points [{ timestamp, signals: { [channelId]: 0/1 } }]

  // Extract plottable logic signals from active components
  const availableChannels = components.flatMap((c) => {
    const list = [];
    const label = c.label || c.type;

    if (c.type === 'CLOCK') {
      list.push({ id: `${c.id}:out`, name: `${label} (CLK OUT)`, getValue: () => c.state?.signal ?? (c.state?.active ? 1 : 0) });
    } else if (c.type === 'SWITCH') {
      list.push({ id: `${c.id}:out`, name: `${label} (OUT)`, getValue: () => (c.state?.active ? 1 : 0) });
    } else if (c.type === 'LED') {
      list.push({ id: `${c.id}:in`, name: `${label} (LED)`, getValue: () => (c.state?.active ? 1 : 0) });
    } else if (['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'NOT', 'MUX21'].includes(c.type)) {
      list.push({ id: `${c.id}:output`, name: `${label} (Y)`, getValue: () => c.state?.output ?? 0 });
    } else if (['DFF', 'JKFF', 'TFF', 'SR_LATCH'].includes(c.type)) {
      list.push({ id: `${c.id}:q`, name: `${label} (Q)`, getValue: () => c.state?.q ?? 0 });
      list.push({ id: `${c.id}:qBar`, name: `${label} (~Q)`, getValue: () => c.state?.qBar ?? 1 });
    } else if (c.type === 'SHIFT_REG_4BIT' || c.type === 'COUNTER_4BIT') {
      list.push({ id: `${c.id}:q0`, name: `${label} (Q0)`, getValue: () => c.state?.q0 ?? 0 });
      list.push({ id: `${c.id}:q1`, name: `${label} (Q1)`, getValue: () => c.state?.q1 ?? 0 });
    }
    return list;
  });

  // Auto-select first 3 channels on load if selection is empty
  useEffect(() => {
    if (selectedChannels.length === 0 && availableChannels.length > 0) {
      setSelectedChannels(availableChannels.slice(0, 3).map(ch => ch.id));
    }
  }, [availableChannels.length]);

  // Record time-series signal sample on each simulation frame
  useEffect(() => {
    if (!isRunning || !isOpen) return;

    const sample = { timestamp: Date.now(), signals: {} };
    availableChannels.forEach((ch) => {
      sample.signals[ch.id] = ch.getValue();
    });

    historyRef.current.push(sample);
    if (historyRef.current.length > 200) {
      historyRef.current.shift();
    }
  }, [components, isRunning, isOpen]);

  // Draw HTML5 Canvas Digital Waveforms
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    // Background fill
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const channelsToPlot = availableChannels.filter(ch => selectedChannels.includes(ch.id));
    if (channelsToPlot.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText('Select component channels below to plot digital timing waveform...', 24, height / 2);
      return;
    }

    const channelHeight = height / channelsToPlot.length;
    const history = historyRef.current;

    channelsToPlot.forEach((ch, idx) => {
      const topY = idx * channelHeight;
      const bottomY = (idx + 1) * channelHeight;
      const highY = topY + 12;
      const lowY = bottomY - 12;

      // Draw Channel Separator & Label
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.beginPath();
      ctx.moveTo(0, bottomY);
      ctx.lineTo(width, bottomY);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText(ch.name, 10, topY + 16);

      if (history.length < 2) return;

      // Draw Waveform Line
      ctx.strokeStyle = idx % 2 === 0 ? '#38bdf8' : '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const stepX = width / 180;
      let prevVal = history[0].signals[ch.id] ?? 0;
      let currX = 0;

      ctx.moveTo(0, prevVal === 1 ? highY : lowY);

      history.forEach((sample, i) => {
        const val = sample.signals[ch.id] ?? 0;
        currX = i * stepX;

        if (val !== prevVal) {
          // Vertical step transition line on state change
          ctx.lineTo(currX, prevVal === 1 ? highY : lowY);
          ctx.lineTo(currX, val === 1 ? highY : lowY);
        } else {
          ctx.lineTo(currX, val === 1 ? highY : lowY);
        }
        prevVal = val;
      });

      ctx.stroke();
    });
  }, [isOpen, selectedChannels, components]);

  const toggleChannel = (chId) => {
    setSelectedChannels((prev) =>
      prev.includes(chId) ? prev.filter((id) => id !== chId) : [...prev, chId]
    );
  };

  const handleClearHistory = () => {
    historyRef.current = [];
  };

  return (
    <div className="fixed bottom-0 left-16 right-0 z-40 flex flex-col transition-all duration-300 pointer-events-auto">
      {/* Drawer Toggle Header Bar */}
      <div className="h-9 px-6 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between shadow-xl">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-200 hover:text-cyan-400 transition cursor-pointer min-w-0 pr-2"
        >
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
          <span className="whitespace-nowrap overflow-hidden text-ellipsis truncate">Digital Oscilloscope &amp; Logic Timing Diagram</span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />}
        </button>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={onToggleRun}
            className={`flex items-center space-x-1 px-2.5 py-0.5 rounded border text-[11px] font-semibold transition cursor-pointer ${
              isRunning ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isRunning ? 'Pause Sim' : 'Run Sim'}</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 text-[11px] transition cursor-pointer"
            title="Clear Timing Buffer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Expanded Waveform Canvas & Channel Selection Panel */}
      {isOpen && (
        <div className="h-64 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row p-4 gap-4">
          {/* Waveform HTML5 Canvas */}
          <div className="flex-1 h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-inner relative">
            <canvas
              ref={canvasRef}
              width={760}
              height={210}
              className="w-full h-full"
            />
          </div>

          {/* Channel Selection Sidebar */}
          <div className="w-full md:w-64 bg-slate-900/80 rounded-xl border border-slate-800 p-3 flex flex-col space-y-2 text-xs font-mono overflow-y-auto">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1.5">
              <span>Logic Channels</span>
              <span>({selectedChannels.length} Active)</span>
            </div>

            {availableChannels.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic p-2 text-center">Add switches, clocks, or gates to canvas to plot signals...</p>
            ) : (
              availableChannels.map((ch) => {
                const isSelected = selectedChannels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-left text-[11px] transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    )}
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
