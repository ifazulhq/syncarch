import React, { useState, useEffect, useRef } from 'react';
import { COMPONENT_CATEGORIES, COMPONENT_REGISTRY } from '../services/ComponentRegistry';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Cpu,
  Layers,
  Activity,
  Clock,
  Zap,
  Thermometer,
  Monitor,
  Sparkles,
  X
} from 'lucide-react';

export default function Sidebar({ onAddComponent, onClearWires }) {
  const [activeCategory, setActiveCategory] = useState('Microcontrollers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef(null);

  // Click-Outside Hook: Collapse drawer when user clicks anywhere outside the sidebar
  useEffect(() => {
    function handleClickOutside(event) {
      if (!isCollapsed && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsCollapsed(true);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isCollapsed]);

  // Escape Key Listener: Pressing Escape key closes/collapses the sidebar drawer
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isCollapsed) {
        setIsCollapsed(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCollapsed]);

  const categoryIcons = {
    'Microcontrollers': Cpu,
    'Logic': Layers,
    'Analog & Semiconductors': Activity,
    'Timing & Power': Clock,
    'Passives': Zap,
    'Sensors': Thermometer,
    'Displays': Monitor
  };

  const registryItems = Object.values(COMPONENT_REGISTRY);

  const filteredComponents = registryItems.filter((item) => {
    const matchesCategory = searchQuery ? true : item.category === activeCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <aside
      ref={sidebarRef}
      className={`fixed left-0 top-14 bottom-0 z-40 glass-panel border-r border-slate-800 transition-all duration-300 flex flex-col h-[calc(100vh-56px)] ${
        isCollapsed ? 'w-14' : 'w-84'
      }`}
    >
      {/* Collapse Toggle Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200 font-mono">
              Engineering Library
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar (Esc)'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Search Box & Explicit Close Toggle */}
          <div className="p-3 border-b border-slate-800/80 flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search 20+ components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition cursor-pointer flex items-center justify-center shrink-0"
              title="Close Drawer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic Scrollable Category Tabs */}
          {!searchQuery && (
            <div className="grid grid-cols-3 gap-1 p-2 border-b border-slate-800/80 bg-slate-950/40 text-xs">
              {COMPONENT_CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat] || Cpu;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`py-1.5 px-1 rounded-lg font-medium transition-all flex flex-col items-center justify-center space-y-0.5 cursor-pointer text-center ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[9px] tracking-tight leading-none line-clamp-1">{cat}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Component Item Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredComponents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No components found matching "{searchQuery}"
              </div>
            ) : (
              filteredComponents.map((comp) => {
                const Icon = comp.icon;
                return (
                  <div
                    key={comp.type}
                    onClick={() => onAddComponent(comp.type)}
                    className="group p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm hover:shadow-cyan-500/5 flex flex-col space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-lg bg-gradient-to-tr ${comp.color} text-white shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                            {comp.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            {comp.pins.length} Pins
                          </span>
                        </div>
                      </div>

                      <div
                        className="p-1.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition cursor-pointer"
                        title={`Add ${comp.name} to workspace`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {comp.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <button
              onClick={onClearWires}
              className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-medium transition cursor-pointer"
              title="Remove all wire connections"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Canvas Wires</span>
            </button>
          </div>
        </>
      )}

      {/* Collapsed Icon Bar */}
      {isCollapsed && (
        <div className="flex-1 py-4 flex flex-col items-center space-y-4">
          {COMPONENT_CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat] || Cpu;
            return (
              <button
                key={cat}
                onClick={() => {
                  setIsCollapsed(false);
                  setActiveCategory(cat);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition cursor-pointer"
                title={cat}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
