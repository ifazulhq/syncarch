import React from 'react';

export default function WireLayer({ components, wires, activeWireSource, mousePos, onDeleteWire, scale = 1.0, settings }) {
  const isGlowEnabled = settings?.animationGlow ?? true;
  const currentTheme = settings?.theme || 'dark';

  const activeStrokeColor = currentTheme === 'cyberpunk' ? '#f43f5e' : (currentTheme === 'pcb' ? '#f59e0b' : '#38bdf8');
  const inactiveStrokeColor = currentTheme === 'cyberpunk' ? '#475569' : (currentTheme === 'pcb' ? '#047857' : '#64748b');

  // Helper to calculate exact (x, y) coordinates locking directly to port circle centers
  const getPinCoords = (compId, pinId) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };

    const pin = comp.pins?.find(p => p.id === pinId);
    if (!pin) return { x: comp.x, y: comp.y };

    // 1. Precise DOM measurement of circular port element
    const pinEl = document.querySelector(`[data-pin-id="${compId}:${pinId}"]`);
    const canvasWorldEl = pinEl?.closest('.canvas-grid')?.querySelector('div[style*="translate3d"]');

    if (pinEl && canvasWorldEl) {
      const pinRect = pinEl.getBoundingClientRect();
      const worldRect = canvasWorldEl.getBoundingClientRect();
      const s = scale || 1.0;

      // Absolute center of the circular port circle in canvas world coordinates
      const worldX = Math.round((pinRect.left + pinRect.width / 2 - worldRect.left) / s);
      const worldY = Math.round((pinRect.top + pinRect.height / 2 - worldRect.top) / s);

      if (worldX > 0 && worldY > 0) {
        return { x: worldX, y: worldY };
      }
    }

    // 2. High-precision fallback using component grid coordinates (matching EngineeringBlock w-72 geometry)
    const isOutput = pin.direction === 'output';
    const sameDirectionPins = comp.pins.filter(p => p.direction === pin.direction);
    const pinIndex = sameDirectionPins.findIndex(p => p.id === pinId);

    // Input pin center: 16px padding + 7px radius = 23px
    // Output pin center: 288px width - 16px padding - 7px radius = 265px
    const rawX = isOutput ? comp.x + 265 : comp.x + 23;
    const rawY = comp.y + 138 + (pinIndex * 22);

    const rot = comp.rotation || 0;
    if (!rot) return { x: rawX, y: rawY };

    // Rotate raw pin coordinate around component center (w-72 = 288px, h ~ 180px)
    const compW = 288;
    const compH = 180;
    const cx = comp.x + compW / 2;
    const cy = comp.y + compH / 2;

    const rad = (rot * Math.PI) / 180;
    const dx = rawX - cx;
    const dy = rawY - cy;

    const rotX = Math.round(cx + (dx * Math.cos(rad) - dy * Math.sin(rad)));
    const rotY = Math.round(cy + (dx * Math.sin(rad) + dy * Math.cos(rad)));

    return { x: rotX, y: rotY };
  };

  // Calculate drafted wire end position with magnetic terminal snapping
  let draftedEndPos = mousePos;
  let isTerminalSnapped = false;

  if (activeWireSource && mousePos) {
    let closestDist = Infinity;
    let closestCoords = null;

    components.forEach((c) => {
      if (c.id !== activeWireSource.compId) {
        c.pins.forEach((p) => {
          if (p.direction === 'input') {
            const coords = getPinCoords(c.id, p.id);
            const dist = Math.hypot(mousePos.x - coords.x, mousePos.y - coords.y);
            if (dist < 44 && dist < closestDist) {
              closestDist = dist;
              closestCoords = coords;
            }
          }
        });
      }
    });

    if (closestCoords) {
      draftedEndPos = closestCoords;
      isTerminalSnapped = true;
    }
  }

  // Generate strict 90-degree orthogonal (Manhattan) path segments
  const getOrthogonalSegments = (p1, p2) => {
    const GRID_SIZE = 24;
    const snap = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;

    const startX = p1.x;
    const startY = p1.y;
    const endX = p2.x;
    const endY = p2.y;

    if (endX > startX + 24) {
      const midX = snap(startX + (endX - startX) / 2);
      return [
        { type: 'H', x1: startX, y1: startY, x2: midX, y2: startY },
        { type: 'V', x1: midX, y1: startY, x2: midX, y2: endY },
        { type: 'H', x1: midX, y1: endY, x2: endX, y2: endY }
      ];
    } else {
      const outX = startX + 24;
      const inX = endX - 24;
      const midY = snap(Math.min(startY, endY) - 48);
      return [
        { type: 'H', x1: startX, y1: startY, x2: outX, y2: startY },
        { type: 'V', x1: outX, y1: startY, x2: outX, y2: midY },
        { type: 'H', x1: outX, y1: midY, x2: inX, y2: midY },
        { type: 'V', x1: inX, y1: midY, x2: inX, y2: endY },
        { type: 'H', x1: inX, y1: endY, x2: endX, y2: endY }
      ];
    }
  };

  // Build map of coordinates and line segments for all established wires
  const wireDataMap = wires.map((w) => {
    const p1 = getPinCoords(w.fromCompId, w.fromPin);
    const p2 = getPinCoords(w.toCompId, w.toPin);
    const segments = getOrthogonalSegments(p1, p2);
    return { wire: w, p1, p2, segments };
  });

  // Calculate geometric crossings and junction nodes
  const junctionDotsMap = new Map(); // key = `${x}:${y}`
  const wireCrossingsMap = {}; // key = wire.id, val = array of { segIdx, crossX, crossY }

  for (let i = 0; i < wireDataMap.length; i++) {
    for (let j = i + 1; j < wireDataMap.length; j++) {
      const w1 = wireDataMap[i];
      const w2 = wireDataMap[j];

      // Check if wires share a connection pin or endpoint
      const isConnected =
        (w1.wire.fromCompId === w2.wire.fromCompId && w1.wire.fromPin === w2.wire.fromPin) ||
        (w1.wire.toCompId === w2.wire.toCompId && w1.wire.toPin === w2.wire.toPin) ||
        (w1.wire.fromCompId === w2.wire.toCompId && w1.wire.fromPin === w2.wire.toPin) ||
        (w1.wire.toCompId === w2.wire.fromCompId && w1.wire.toPin === w2.wire.fromPin);

      // Check segment intersections
      w1.segments.forEach((s1, s1Idx) => {
        w2.segments.forEach((s2) => {
          let crossX = null;
          let crossY = null;

          if (s1.type === 'H' && s2.type === 'V') {
            const hMinX = Math.min(s1.x1, s1.x2);
            const hMaxX = Math.max(s1.x1, s1.x2);
            const vMinY = Math.min(s2.y1, s2.y2);
            const vMaxY = Math.max(s2.y1, s2.y2);

            if (s2.x1 > hMinX + 6 && s2.x1 < hMaxX - 6 && s1.y1 > vMinY + 6 && s1.y1 < vMaxY - 6) {
              crossX = s2.x1;
              crossY = s1.y1;
            }
          }

          if (crossX !== null && crossY !== null) {
            const key = `${crossX}:${crossY}`;
            
            // Check if intersection coincides with an endpoint (T-Junction)
            const isEndpointNear =
              Math.hypot(crossX - w1.p1.x, crossY - w1.p1.y) < 12 ||
              Math.hypot(crossX - w1.p2.x, crossY - w1.p2.y) < 12 ||
              Math.hypot(crossX - w2.p1.x, crossY - w2.p1.y) < 12 ||
              Math.hypot(crossX - w2.p2.x, crossY - w2.p2.y) < 12;

            if (isConnected || isEndpointNear) {
              // Connected Node Junction Dot
              junctionDotsMap.set(key, {
                x: crossX,
                y: crossY,
                active: w1.wire.active || w2.wire.active
              });
            } else {
              // Unconnected Crossing Bridge Arc on w1's horizontal segment
              if (!wireCrossingsMap[w1.wire.id]) wireCrossingsMap[w1.wire.id] = [];
              wireCrossingsMap[w1.wire.id].push({ segIdx: s1Idx, crossX, crossY });
            }
          }
        });
      });
    }
  }

  // Construct SVG Path String with Bridge Arcs for a wire
  const createPathWithBridges = (wData) => {
    const crossings = wireCrossingsMap[wData.wire.id] || [];
    let pathD = `M ${wData.p1.x} ${wData.p1.y}`;

    wData.segments.forEach((seg, idx) => {
      const segCrossings = crossings
        .filter((c) => c.segIdx === idx)
        .sort((a, b) => Math.abs(a.crossX - seg.x1) - Math.abs(b.crossX - seg.x1));

      if (seg.type === 'V') {
        pathD += ` V ${seg.y2}`;
      } else {
        if (segCrossings.length === 0) {
          pathD += ` H ${seg.x2}`;
        } else {
          let currX = seg.x1;
          const isRightward = seg.x2 > seg.x1;

          segCrossings.forEach((cr) => {
            const bridgeR = 7;
            const preX = isRightward ? cr.crossX - bridgeR : cr.crossX + bridgeR;
            const postX = isRightward ? cr.crossX + bridgeR : cr.crossX - bridgeR;

            pathD += ` L ${preX} ${seg.y1}`;
            pathD += ` A ${bridgeR} ${bridgeR} 0 0 1 ${postX} ${seg.y1}`;
            currX = postX;
          });

          pathD += ` H ${seg.x2}`;
        }
      }
    });

    return pathD;
  };

  const createOrthogonalPath = (p1, p2) => {
    const segs = getOrthogonalSegments(p1, p2);
    let pathData = `M ${segs[0].x1} ${segs[0].y1}`;
    segs.forEach((s) => {
      if (s.type === 'H') pathData += ` H ${s.x2}`;
      else pathData += ` V ${s.y2}`;
    });
    return pathData;
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
      <defs>
        {/* Glow Filters for active HIGH signals */}
        <filter id="wireGlowActive" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render Established Wires with Bridge Arcs */}
      {wireDataMap.map(({ wire, p1, p2 }) => {
        const pathData = createPathWithBridges({ wire, p1, p2, segments: getOrthogonalSegments(p1, p2) });
        const isActiveSignal = wire.active;

        return (
          <g key={wire.id} className="group pointer-events-auto cursor-pointer" onClick={() => onDeleteWire(wire.id)}>
            {/* Wider invisible stroke for easy clicking */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="16"
            />
            {/* Background Glow Stroke */}
            <path
              d={pathData}
              fill="none"
              stroke={isActiveSignal ? activeStrokeColor : inactiveStrokeColor}
              strokeWidth={isActiveSignal ? '3' : '2'}
              opacity={isActiveSignal ? '0.9' : '0.4'}
              filter={isActiveSignal && isGlowEnabled ? 'url(#wireGlowActive)' : undefined}
            />
            {/* Animated Active Flow Line */}
            {isActiveSignal && (
              <path
                d={pathData}
                fill="none"
                stroke={activeStrokeColor}
                strokeWidth="2"
                className={isGlowEnabled ? 'wire-active-flow' : ''}
              />
            )}
          </g>
        );
      })}

      {/* Render Connection Junction Dots at T-Junctions */}
      {Array.from(junctionDotsMap.values()).map((dot, idx) => (
        <circle
          key={`junction-${idx}-${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r="4.5"
          fill={dot.active ? activeStrokeColor : inactiveStrokeColor}
          stroke="#ffffff"
          strokeWidth="1.5"
          filter={dot.active && isGlowEnabled ? 'url(#wireGlowActive)' : undefined}
          className="transition-colors duration-200"
        />
      ))}

      {/* Render Wire Being Drafted in Real-Time with Terminal Snapping */}
      {activeWireSource && draftedEndPos && (
        <g>
          <path
            d={createOrthogonalPath(
              getPinCoords(activeWireSource.compId, activeWireSource.pinId),
              draftedEndPos
            )}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="6 4"
            filter="url(#wireGlowActive)"
            className="animate-pulse"
          />
          {/* Magnetically Snapped Port Indicator Ring */}
          {isTerminalSnapped && (
            <circle
              cx={draftedEndPos.x}
              cy={draftedEndPos.y}
              r="7"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="2"
              className="animate-ping"
            />
          )}
        </g>
      )}
    </svg>
  );
}
