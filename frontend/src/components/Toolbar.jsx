import React from 'react';
import { Cpu, Binary, Layers, ToggleLeft, Lightbulb, Trash2, Plus, Sparkles } from 'lucide-react';

export default function Toolbar({ onAddComponent, onClearWires }) {
  const componentTemplates = [
    {
      type: 'ESP32',
      name: 'ESP32 Micro',
      icon: Cpu,
      color: 'from-cyan-500 to-blue-600',
      description: 'Dual-core MCU with GPIO',
      pins: [
        { id: '3V3', name: '3V3', type: 'power', direction: 'output' },
        { id: 'GND', name: 'GND', type: 'power', direction: 'output' },
        { id: 'GPIO4', name: 'IO4 (TX)', type: 'digital', direction: 'output' },
        { id: 'GPIO5', name: 'IO5 (RX)', type: 'digital', direction: 'input' },
        { id: 'GPIO18', name: 'IO18 (CLK)', type: 'digital', direction: 'output' },
        { id: 'GPIO19', name: 'IO19 (MISO)', type: 'digital', direction: 'input' }
      ],
      state: { powered: true, wifi: 'ONLINE', pinStates: { GPIO4: 1, GPIO5: 0 } }
    },
    {
      type: 'NAND',
      name: 'NAND Gate',
      icon: Binary,
      color: 'from-amber-500 to-orange-600',
      description: 'Universal Logic NAND',
      pins: [
        { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
        { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
        { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
      ],
      state: { inputA: 0, inputB: 0, output: 1 }
    },
    {
      type: 'DFF',
      name: 'D Flip-Flop',
      icon: Layers,
      color: 'from-purple-500 to-indigo-600',
      description: 'Sequential Latch',
      pins: [
        { id: 'd', name: 'D', type: 'digital', direction: 'input' },
        { id: 'clk', name: 'CLK', type: 'digital', direction: 'input' },
        { id: 'q', name: 'Q', type: 'digital', direction: 'output' },
        { id: 'qBar', name: '~Q', type: 'digital', direction: 'output' }
      ],
      state: { d: 0, clk: 0, q: 0, qBar: 1 }
    },
    {
      type: 'SWITCH',
      name: 'Logic Switch',
      icon: ToggleLeft,
      color: 'from-emerald-500 to-teal-600',
      description: 'HIGH/LOW Pulse Source',
      pins: [
        { id: 'out', name: 'OUT', type: 'digital', direction: 'output' }
      ],
      state: { active: true }
    },
    {
      type: 'LED',
      name: 'Status LED',
      icon: Lightbulb,
      color: 'from-rose-500 to-pink-600',
      description: 'Logic High Visualizer',
      pins: [
        { id: 'in', name: 'IN', type: 'digital', direction: 'input' }
      ],
      state: { active: false }
    }
  ];

  const handleAdd = (template) => {
    // Generate random coordinates around canvas center
    const randomOffset = () => Math.floor(Math.random() * 60) - 30;
    const newComp = {
      id: `${template.type.toLowerCase()}-${Date.now().toString(36)}`,
      type: template.type,
      x: 300 + randomOffset(),
      y: 250 + randomOffset(),
      label: `${template.name} #${Math.floor(10 + Math.random() * 89)}`,
      pins: template.pins,
      state: { ...template.state }
    };
    onAddComponent(newComp);
  };

  const handleAddDefault = () => {
    // Default to NAND Gate if general Add Component button is clicked
    handleAdd(componentTemplates[1]);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-3 p-2 rounded-2xl glass-panel border border-slate-800 shadow-2xl">
      <button
        onClick={handleAddDefault}
        className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-500/40 text-cyan-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm"
        title="Add a new engineering block to canvas"
      >
        <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span>Add Component</span>
        <Plus className="w-3.5 h-3.5 ml-0.5 text-cyan-400" />
      </button>

      <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
        {componentTemplates.map((tmpl) => {
          const Icon = tmpl.icon;
          return (
            <button
              key={tmpl.type}
              onClick={() => handleAdd(tmpl)}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow cursor-pointer"
              title={tmpl.description}
            >
              <div className={`p-1.5 rounded-lg bg-gradient-to-tr ${tmpl.color} text-white shadow-sm`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">{tmpl.name}</span>
              <Plus className="w-3.5 h-3.5 text-slate-500" />
            </button>
          );
        })}
      </div>

      <div className="pl-2 border-l border-slate-800 flex items-center">
        <button
          onClick={onClearWires}
          className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-medium transition-colors"
          title="Clear all wire connections"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Wires</span>
        </button>
      </div>
    </div>
  );
}
