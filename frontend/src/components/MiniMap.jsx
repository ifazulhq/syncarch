import React, { useRef, useState, useEffect } from 'react';
import { Compass } from 'lucide-react';

export default function MiniMap({
  components = [],
  wires = [],
  pan = { x: 0, y: 0 },
  scale = 1.0,
  onPanChange
}) {
  const mapRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // MiniMap Dimensions
  const mapWidth = 180;
  const mapHeight = 115;

  // Calculate World Bounds covering all components and default workspace area
  const compXs = components.map((c) => c.x);
  const compYs = components.map((c) => c.y);

  const minX = Math.min(-300, compXs.length > 0 ? Math.min(...compXs) - 100 : -300);
  const maxX = Math.max(1800, compXs.length > 0 ? Math.max(...compXs) + 300 : 1800);
  const minY = Math.min(-300, compYs.length > 0 ? Math.min(...compYs) - 100 : -300);
  const maxY = Math.max(1200, compYs.length > 0 ? Math.max(...compYs) + 300 : 1200);

  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;

  const scaleX = mapWidth / worldWidth;
  const scaleY = mapHeight / worldHeight;

  // Viewport dimensions in World space
  const viewportW = (window.innerWidth || 1200) / scale;
  const viewportH = (window.innerHeight || 800) / scale;
  const viewWorldX = -pan.x / scale;
  const viewWorldY = -pan.y / scale;

  // Viewport Box in MiniMap space
  const boxX = Math.max(0, Math.min(mapWidth, (viewWorldX - minX) * scaleX));
  const boxY = Math.max(0, Math.min(mapHeight, (viewWorldY - minY) * scaleY));
  const boxW = Math.max(10, Math.min(mapWidth - boxX, viewportW * scaleX));
  const boxH = Math.max(10, Math.min(mapHeight - boxY, viewportH * scaleY));

  // Center camera at MiniMap click/drag coordinate
  const jumpToPoint = (e) => {
    if (!mapRef.current || !onPanChange) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(mapWidth, e.clientX - rect.left));
    const clickY = Math.max(0, Math.min(mapHeight, e.clientY - rect.top));

    // Target world center
    const targetWorldX = minX + clickX / scaleX;
    const targetWorldY = minY + clickY / scaleY;

    const newPanX = -(targetWorldX - viewportW / 2) * scale;
    const newPanY = -(targetWorldY - viewportH / 2) * scale;

    onPanChange({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    jumpToPoint(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      jumpToPoint(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, pan, scale]);

  return (
    <div className="fixed top-16 right-6 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-2 font-mono text-[10px] select-none">
      {/* MiniMap Header Label */}
      <div className="flex items-center justify-between px-1 pb-1.5 text-slate-400 border-b border-slate-800/80 mb-1.5">
        <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
          <Compass className="w-3.5 h-3.5" />
          <span>Mini-Map</span>
        </div>
        <span className="text-[9px] text-slate-500">{components.length} Blocks</span>
      </div>

      {/* MiniMap Interactive SVG Canvas */}
      <div
        ref={mapRef}
        onMouseDown={handleMouseDown}
        style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }}
        className="relative bg-slate-950 rounded-xl overflow-hidden cursor-crosshair border border-slate-800/80"
        title="Click or drag to jump camera"
      >
        <svg className="w-full h-full pointer-events-none">
          {/* Wire Connections */}
          {wires.map((w) => {
            const fromC = components.find((c) => c.id === w.fromCompId);
            const toC = components.find((c) => c.id === w.toCompId);
            if (!fromC || !toC) return null;

            const fx = (fromC.x + 100 - minX) * scaleX;
            const fy = (fromC.y + 40 - minY) * scaleY;
            const tx = (toC.x + 10 - minX) * scaleX;
            const ty = (toC.y + 40 - minY) * scaleY;

            return (
              <line
                key={w.id}
                x1={fx}
                y1={fy}
                x2={tx}
                y2={ty}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
            );
          })}

          {/* Component Rectangles */}
          {components.map((comp) => {
            const cx = (comp.x - minX) * scaleX;
            const cy = (comp.y - minY) * scaleY;
            const cw = Math.max(8, 140 * scaleX);
            const ch = Math.max(6, 90 * scaleY);

            return (
              <rect
                key={comp.id}
                x={cx}
                y={cy}
                width={cw}
                height={ch}
                rx="2"
                fill={comp.type === 'SUB_CIRCUIT' ? '#f59e0b' : '#06b6d4'}
                fillOpacity="0.75"
                stroke="#38bdf8"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>

        {/* Semi-transparent Viewport Bounding Box */}
        <div
          style={{
            left: `${boxX}px`,
            top: `${boxY}px`,
            width: `${boxW}px`,
            height: `${boxH}px`
          }}
          className="absolute border-2 border-cyan-400 bg-cyan-500/20 rounded pointer-events-none shadow-md shadow-cyan-500/20 transition-all duration-75"
        />
      </div>
    </div>
  );
}
