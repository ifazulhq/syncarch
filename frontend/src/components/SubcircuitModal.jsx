import React, { useState, useEffect } from 'react';
import { X, Layers, Cpu, Zap, Activity } from 'lucide-react';
import EngineeringBlock from './EngineeringBlock';
import WireLayer from './WireLayer';

export default function SubcircuitModal({
  isOpen,
  onClose,
  component,
  settings,
  onUpdateSubcircuit
}) {
  if (!isOpen || !component) return null;

  const rawSub = component.subcircuit || component.state?.subcircuit || { components: [], wires: [] };
  const [internalComps, setInternalComps] = useState(rawSub.components || []);
  const [internalWires, setInternalWires] = useState(rawSub.wires || []);
  const [activeWireSource, setActiveWireSource] = useState(null);

  useEffect(() => {
    const s = component.subcircuit || component.state?.subcircuit || { components: [], wires: [] };
    setInternalComps(s.components || []);
    setInternalWires(s.wires || []);
  }, [component]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveWireSource(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMove = (id, x, y) => {
    setInternalComps((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, x, y } : c));
      if (onUpdateSubcircuit) {
        onUpdateSubcircuit(component.id, { components: updated, wires: internalWires });
      }
      return updated;
    });
  };

  const handleToggleState = (id, nextState) => {
    setInternalComps((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== id) return c;
        const merged = typeof nextState === 'function' ? nextState(c.state || {}) : { ...(c.state || {}), ...nextState };
        return { ...c, state: merged };
      });
      if (onUpdateSubcircuit) {
        onUpdateSubcircuit(component.id, { components: updated, wires: internalWires });
      }
      return updated;
    });
  };

  const handlePinClick = (compId, pinId, direction) => {
    if (!activeWireSource) {
      if (direction === 'output') {
        setActiveWireSource({ compId, pinId, direction });
      }
    } else {
      if (activeWireSource.compId !== compId && direction === 'input') {
        const newWire = {
          id: `wire-sub-${Date.now().toString(36)}`,
          fromCompId: activeWireSource.compId,
          fromPin: activeWireSource.pinId,
          toCompId: compId,
          toPin: pinId
        };
        const updatedWires = [...internalWires, newWire];
        setInternalWires(updatedWires);
        setActiveWireSource(null);
        if (onUpdateSubcircuit) {
          onUpdateSubcircuit(component.id, { components: internalComps, wires: updatedWires });
        }
      } else {
        setActiveWireSource(null);
      }
    }
  };

  const handleDelete = (id) => {
    const updatedComps = internalComps.filter((c) => c.id !== id);
    const updatedWires = internalWires.filter((w) => w.fromCompId !== id && w.toCompId !== id);
    setInternalComps(updatedComps);
    setInternalWires(updatedWires);
    if (onUpdateSubcircuit) {
      onUpdateSubcircuit(component.id, { components: updatedComps, wires: updatedWires });
    }
  };

  const handleDeleteWire = (wireId) => {
    const updatedWires = internalWires.filter((w) => w.id !== wireId);
    setInternalWires(updatedWires);
    if (onUpdateSubcircuit) {
      onUpdateSubcircuit(component.id, { components: internalComps, wires: updatedWires });
    }
  };

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
                <span>{internalComps.length} Components</span>
                <span>•</span>
                <span>{internalWires.length} Internal Wires</span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center space-x-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>INTERACTIVE EDITING ACTIVE</span>
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
            title="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-circuit Canvas Viewport */}
        <div className="relative flex-1 bg-slate-950 overflow-auto p-8 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

          {/* Active Wire Draft Helper Banner */}
          {activeWireSource && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs shadow-lg animate-pulse">
              ⚡ Drafting internal wire... Click an INPUT pin (or press ESC to cancel)
            </div>
          )}

          {/* Internal Wire Layer */}
          <div className="relative min-w-[1200px] min-h-[800px] h-full w-full">
            <WireLayer
              components={internalComps}
              wires={internalWires}
              activeWireSource={activeWireSource}
              mousePos={{ x: 0, y: 0 }}
              onDeleteWire={handleDeleteWire}
              scale={1.0}
              settings={settings}
            />

            {/* Internal Component Blocks */}
            {internalComps.map((comp) => (
              <EngineeringBlock
                key={comp.id}
                component={comp}
                lock={null}
                myUser={null}
                scale={1.0}
                activeWireSource={activeWireSource}
                onLock={() => {}}
                onUnlock={() => {}}
                onMove={handleMove}
                onToggleState={handleToggleState}
                onDelete={handleDelete}
                onPinClick={handlePinClick}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Drill-down Inspector • Encapsulated edits synchronize live to main schematic.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold transition cursor-pointer"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
}
