import React, { useState, useEffect, useRef, useMemo } from 'react';
import throttle from 'lodash.throttle';
import EngineeringBlock from './EngineeringBlock';
import WireLayer from './WireLayer';
import CursorOverlay from './CursorOverlay';
import OscilloscopeDrawer from './OscilloscopeDrawer';
import MiniMap from './MiniMap';
import ContextMenu from './ContextMenu';
import { evaluateCircuitTopology } from '../utils/logicEvaluator';
import { ZoomIn, ZoomOut, RotateCcw, Move, Layers } from 'lucide-react';

export default function Canvas({
  components,
  wires,
  users,
  locks,
  myUser,
  onLock,
  onUnlock,
  onMoveComponent,
  onRotateComponent,
  onDuplicateComponent,
  onToggleState,
  onDeleteComponent,
  onAddWire,
  onDeleteWire,
  onCursorMove,
  onOpenCodeEditor,
  onUpdatePinNetLabel,
  onCreateSubcircuit,
  onOpenSubcircuit,
  settings
}) {
  const containerRef = useRef(null);
  const themeClass = `theme-${settings?.theme || 'dark'}`;
  const gridClass = `grid-${settings?.gridPattern || 'dots'}`;

  // Infinite Canvas Zoom & Pan State
  const [scale, setScale] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeWireSource, setActiveWireSource] = useState(null); // { compId, pinId, direction }
  const [contextMenu, setContextMenu] = useState(null); // { x, y, componentId }

  const handleComponentContextMenu = (e, componentId) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      componentId
    });
  };

  // Component Selection & Macro Sub-circuit State
  const [selectedCompIds, setSelectedCompIds] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null); // { startX, startY, currentX, currentY }

  // Simulation Tick Loop & Oscilloscope State
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [simData, setSimData] = useState({ components, wires });

  useEffect(() => {
    setSimData({ components, wires });
  }, [components, wires]);

  useEffect(() => {
    if (!isSimRunning) return;

    const tickMs = settings?.clockSpeed || 100;
    const interval = setInterval(() => {
      setSimData((prev) => {
        const sourceComps = prev.components.length > 0 ? prev.components : components;
        const sourceWires = prev.wires.length > 0 ? prev.wires : wires;
        return evaluateCircuitTopology(sourceComps, sourceWires);
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [components, wires, isSimRunning, settings?.clockSpeed]);

  // Throttled cursor emission to backend (30ms throttle)
  const throttledCursorMove = useMemo(
    () =>
      throttle((coords) => {
        onCursorMove(coords);
      }, 30),
    [onCursorMove]
  );

  useEffect(() => {
    return () => {
      throttledCursorMove.cancel();
    };
  }, [throttledCursorMove]);

  // Non-passive Wheel Event Listener for smooth zooming
  useEffect(() => {
    const canvasContainer = containerRef.current;
    if (!canvasContainer) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setScale((prevScale) => {
        const newScale = Math.min(Math.max(prevScale * zoomFactor, 0.25), 3.0);
        return Number(newScale.toFixed(3));
      });
    };

    canvasContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvasContainer.removeEventListener('wheel', handleWheel);
  }, []);

  // Keyboard Spacebar Panning Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isSpacePressed && e.target.tagName !== 'INPUT') {
        setIsSpacePressed(true);
      }
      if (e.key === 'Escape') {
        setActiveWireSource(null);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Helper to translate screen mouse coordinates (e.clientX, e.clientY) into exact canvas world coordinates
  const getCanvasCoordinates = (e) => {
    // 1. SVG CTM Translation: If drawing layer SVG exists, map screen coordinates via getScreenCTM().inverse()
    if (containerRef.current) {
      const svgEl = containerRef.current.querySelector('svg');
      if (svgEl && typeof svgEl.getScreenCTM === 'function') {
        try {
          const ctm = svgEl.getScreenCTM();
          if (ctm) {
            const inverseCTM = ctm.inverse();
            if (typeof svgEl.createSVGPoint === 'function') {
              const pt = svgEl.createSVGPoint();
              pt.x = e.clientX;
              pt.y = e.clientY;
              const svgPt = pt.matrixTransform(inverseCTM);
              if (Number.isFinite(svgPt.x) && Number.isFinite(svgPt.y)) {
                return { x: svgPt.x, y: svgPt.y };
              }
            }
          }
        } catch (err) {
          // Fallback if SVG CTM matrix transformation fails
        }
      }
    }

    // 2. Container Bounding Rect & Scale / Pan Factor Offset Calculation:
    // Subtract container left and top values from mouse e.clientX / e.clientY
    // and divide by active scale/zoom factor.
    const rect = containerRef.current
      ? containerRef.current.getBoundingClientRect()
      : { left: 0, top: 0 };

    const currentScale = scale || 1.0;
    const canvasX = (e.clientX - rect.left - pan.x) / currentScale;
    const canvasY = (e.clientY - rect.top - pan.y) / currentScale;

    return { x: canvasX, y: canvasY };
  };

  // Pan & Drag Selection Mouse Handlers
  const handleMouseDown = (e) => {
    // Middle click (button 1) OR Left click + Spacebar
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    } else if (e.button === 0 && (e.target.classList.contains('canvas-grid') || e.target.tagName === 'svg')) {
      // Left click on canvas background initiates rubber-band drag selection
      const { x: canvasX, y: canvasY } = getCanvasCoordinates(e);
      setSelectionBox({ startX: canvasX, startY: canvasY, currentX: canvasX, currentY: canvasY });
      if (!e.shiftKey) {
        setSelectedCompIds([]);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }

    // Un-transformed screen coordinates for multiplayer cursor overlay
    const screenCoords = { x: e.clientX, y: e.clientY };
    throttledCursorMove(screenCoords);

    // Transformed canvas world coordinates for wire drafting & selection
    const { x: canvasX, y: canvasY } = getCanvasCoordinates(e);
    setMousePos({ x: canvasX, y: canvasY });

    if (selectionBox) {
      const updatedBox = { ...selectionBox, currentX: canvasX, currentY: canvasY };
      setSelectionBox(updatedBox);

      // Compute intersection of selection box with component bounding boxes
      const minX = Math.min(updatedBox.startX, updatedBox.currentX);
      const maxX = Math.max(updatedBox.startX, updatedBox.currentX);
      const minY = Math.min(updatedBox.startY, updatedBox.currentY);
      const maxY = Math.max(updatedBox.startY, updatedBox.currentY);

      const newlySelected = components.filter((c) => {
        const cRight = c.x + 288;
        const cBottom = c.y + 200;
        return c.x < maxX && cRight > minX && c.y < maxY && cBottom > minY;
      }).map(c => c.id);

      setSelectedCompIds(newlySelected);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (selectionBox) {
      setSelectionBox(null);
    }
  };

  // Pin Click Logic: Output pin click starts wire, Input pin click completes wire
  const handlePinClick = (compId, pinId, direction) => {
    if (!activeWireSource) {
      if (direction === 'output') {
        setActiveWireSource({ compId, pinId, direction });
      }
    } else {
      if (activeWireSource.compId !== compId && direction === 'input') {
        const newWire = {
          id: `wire-${Date.now().toString(36)}`,
          fromCompId: activeWireSource.compId,
          fromPin: activeWireSource.pinId,
          toCompId: compId,
          toPin: pinId
        };
        onAddWire(newWire);
        setActiveWireSource(null);
      } else {
        setActiveWireSource(null);
      }
    }
  };

  const handleCanvasClick = (e) => {
    if (e.target.classList.contains('canvas-grid') || e.target.tagName === 'svg') {
      setActiveWireSource(null);
    }
  };

  const currentComponents = simData.components.length > 0 ? simData.components : components;
  const currentWires = simData.wires.length > 0 ? simData.wires : wires;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
      className={`canvas-grid ${themeClass} ${gridClass} relative w-screen h-screen overflow-hidden ${
        isPanning || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      style={{
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        backgroundSize: `${24 * scale}px ${24 * scale}px, ${120 * scale}px ${120 * scale}px, ${120 * scale}px ${120 * scale}px`
      }}
    >
      {/* Transformed Engineering Canvas Inner World */}
      <div
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {/* SVG Wire Layer */}
        <WireLayer
          components={currentComponents}
          wires={currentWires}
          activeWireSource={activeWireSource}
          mousePos={mousePos}
          onDeleteWire={onDeleteWire}
          scale={scale}
          settings={settings}
        />

        {/* Engineering Block Components */}
        {currentComponents.map((comp) => (
          <EngineeringBlock
            key={comp.id}
            component={comp}
            lock={locks[comp.id]}
            myUser={myUser}
            scale={scale}
            activeWireSource={activeWireSource}
            isSelected={selectedCompIds.includes(comp.id)}
            onLock={onLock}
            onUnlock={onUnlock}
            onMove={onMoveComponent}
            onToggleState={onToggleState}
            onDelete={onDeleteComponent}
            onPinClick={handlePinClick}
            onOpenCodeEditor={onOpenCodeEditor}
            onUpdatePinNetLabel={onUpdatePinNetLabel}
            onOpenSubcircuit={onOpenSubcircuit}
            onContextMenu={handleComponentContextMenu}
          />
        ))}

        {/* Rubber-band Drag Selection Box Overlay */}
        {selectionBox && (
          <div
            style={{
              left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
              top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
              width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
              height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`
            }}
            className="absolute border-2 border-dashed border-amber-400 bg-amber-500/10 pointer-events-none rounded-lg z-30"
          />
        )}
      </div>

      {/* Multiplayer Real-time Cursor Overlay (Screen Space) */}
      <CursorOverlay users={users} myUser={myUser} />

      {/* Navigable Mini-Map Component for Schematic Management */}
      <MiniMap
        components={currentComponents}
        wires={currentWires}
        pan={pan}
        scale={scale}
        onPanChange={(newPan) => setPan(newPan)}
      />
      <OscilloscopeDrawer
        components={currentComponents}
        wires={currentWires}
        isRunning={isSimRunning}
        onToggleRun={() => setIsSimRunning(!isSimRunning)}
      />

      {/* Floating Multi-Select Action Toolbar for Sub-circuit Macro Creation */}
      {selectedCompIds.length >= 2 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-2xl glass-panel border border-amber-500/50 shadow-2xl flex items-center space-x-4 text-xs font-mono text-slate-200 animate-fade-in">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-bold text-amber-300">{selectedCompIds.length} Components Selected</span>
          </div>
          <button
            onClick={() => {
              if (onCreateSubcircuit) onCreateSubcircuit(selectedCompIds);
              setSelectedCompIds([]);
            }}
            className="interactive-btn px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold shadow-md flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Group into Macro Sub-circuit</span>
          </button>
          <button
            onClick={() => setSelectedCompIds([])}
            className="px-2 py-1 text-slate-400 hover:text-white transition"
          >
            Clear
          </button>
        </div>
      )}

      {/* Wire Connection Helper Banner */}
      {activeWireSource && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs shadow-lg animate-pulse">
          ⚡ Drafting wire... Click an INPUT pin (or press ESC to cancel)
        </div>
      )}

      {/* Spacebar Pan Hint Pill */}
      {isSpacePressed && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-lg flex items-center space-x-1">
          <Move className="w-3.5 h-3.5" />
          <span>Pan Mode Active (Drag mouse to move canvas)</span>
        </div>
      )}

      {/* Zoom & View Controls Overlay */}
      <div className="fixed bottom-12 right-20 z-40 flex items-center space-x-2 px-3 py-1.5 rounded-2xl glass-panel border border-slate-800 text-xs font-mono text-slate-300 shadow-2xl">
        <button
          onClick={() => setScale((s) => Math.max(0.25, Number((s - 0.1).toFixed(2))))}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="w-12 text-center font-bold text-cyan-400 font-mono">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(3.0, Number((s + 0.1).toFixed(2))))}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-1"></div>
        <button
          onClick={() => {
            setScale(1.0);
            setPan({ x: 0, y: 0 });
          }}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-sans text-[11px] font-medium transition cursor-pointer"
          title="Reset Canvas View (100% scale, 0,0 pan)"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Right-Click Custom Component Context Menu Overlay */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          componentId={contextMenu.componentId}
          onRotate={(id) => {
            if (onRotateComponent) onRotateComponent(id);
          }}
          onDuplicate={(id) => {
            if (onDuplicateComponent) onDuplicateComponent(id);
          }}
          onDelete={(id) => {
            if (onDeleteComponent) onDeleteComponent(id);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
