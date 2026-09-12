import React from 'react';
import { X, Layers, Cpu, Zap, Activity } from 'lucide-react';
import EngineeringBlock from './EngineeringBlock';
import WireLayer from './WireLayer';

export default function SubcircuitModal({ isOpen, onClose, component, settings }) {
  if (!isOpen || !component) return null;

  const sub = component.subcircuit || component.state?.subcircuit || { components: [], wires: [] };
  const internalComponents = sub.components || [];
  const internalWires = sub.wires || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6">
      <div className="relative w-full max-w-5xl h-[80vh] rounded-2xl glass-panel border border-cyan-500/40 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2 font-mono">
                <span>{component.label || component.name || 'Sub-circuit Inspection'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  MACRO BLOCK
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono flex items-center space-x-3 mt-0.5">
                <span>{internalComponents.length} Components</span>
                <span>•</span>
                <span>{internalWires.length} Internal Wires</span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center space-x-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>LIVE SIMULATION ACTIVE</span>
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
            title="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-circuit Canvas Viewport */}
        <div className="relative flex-1 bg-slate-950 overflow-auto p-8 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

          {/* Internal Wire Layer */}
          <div className="relative min-w-[1200px] min-h-[800px] h-full w-full">
            <WireLayer
              components={internalComponents}
              wires={internalWires}
              activeWireSource={null}
              mousePos={{ x: 0, y: 0 }}
              onDeleteWire={() => {}}
              scale={1.0}
              settings={settings}
            />

            {/* Internal Component Blocks */}
            {internalComponents.map((comp) => (
              <EngineeringBlock
                key={comp.id}
                component={comp}
                lock={null}
                myUser={null}
                scale={1.0}
                activeWireSource={null}
                onLock={() => {}}
                onUnlock={() => {}}
                onMove={() => {}}
                onToggleState={() => {}}
                onDelete={() => {}}
                onPinClick={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Drill-down Inspector • Modifying macro internals will propagate signals to main schematic.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold transition"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
}
