import React, { useRef, useState, useEffect, useMemo } from 'react';
import throttle from 'lodash.throttle';
import { Lock, Cpu, Binary, Layers, ToggleLeft, ToggleRight, Lightbulb, Trash2, Zap, Play, Monitor, Tv, Code2, Tag, Check, X, Maximize2 } from 'lucide-react';

function OledCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;
    let t = 0;

    const render = () => {
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, 128, 64);

      // Yellow top bar header
      ctx.fillStyle = '#f59e0b';
      ctx.font = '8px monospace';
      ctx.fillText('SyncArch OLED 0x3C', 4, 10);
      ctx.fillRect(0, 13, 128, 1);

      // Cyan oscilloscope waveform
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < 128; x++) {
        const y = 38 + Math.sin((x + t) * 0.12) * 12 + Math.cos((x - t) * 0.06) * 4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Blinking status pixel indicator
      ctx.fillStyle = (Math.floor(t / 15) % 2 === 0) ? '#38bdf8' : '#070b14';
      ctx.fillRect(118, 4, 4, 4);

      t += 2;
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={64}
      className="w-full h-20 bg-slate-950 rounded border border-slate-700/80 shadow-inner"
    />
  );
}

export default function EngineeringBlock({
  component,
  lock,
  myUser,
  scale = 1.0,
  activeWireSource,
  isSelected = false,
  onLock,
  onUnlock,
  onMove,
  onToggleState,
  onDelete,
  onPinClick,
  onOpenCodeEditor,
  onUpdatePinNetLabel,
  onOpenSubcircuit,
  onContextMenu
}) {
  const compRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });
  const [popoverPinId, setPopoverPinId] = useState(null);
  const [netInputVal, setNetInputVal] = useState('');

  const isLockedByOther = lock && lock.socketId !== myUser?.id;
  const isLockedByMe = lock && lock.socketId === myUser?.id;

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, component.id);
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (component.type === 'ESP32' || component.type === 'ARDUINO') {
      if (onOpenCodeEditor) {
        onOpenCodeEditor(component);
      }
    } else if (component.type === 'SUB_CIRCUIT') {
      if (onOpenSubcircuit) {
        onOpenSubcircuit(component);
      }
    }
  };

  // Throttled move emitter (30ms throttle) to prevent flooding the backend network
  const throttledMove = useMemo(
    () =>
      throttle((id, x, y) => {
        onMove(id, x, y);
      }, 30),
    [onMove]
  );

  useEffect(() => {
    return () => {
      throttledMove.cancel();
    };
  }, [throttledMove]);

  // Handle Drag Start & Lock Request
  const handleMouseDown = (e) => {
    if (e.button === 2) return; // Ignore right-click drag
    if (isLockedByOther) return;
    if (e.target.closest('.interactive-btn') || e.target.closest('.pin-node')) return;

    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { x: component.x, y: component.y };

    onLock(component.id);
  };

  // Handle Drag Movement scaled to canvas zoom level
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const currentScale = scale || 1.0;
      const deltaX = (e.clientX - dragStartRef.current.x) / currentScale;
      const deltaY = (e.clientY - dragStartRef.current.y) / currentScale;
      const rawX = Math.max(0, initialPosRef.current.x + deltaX);
      const rawY = Math.max(0, initialPosRef.current.y + deltaY);
      const GRID_SIZE = 24;
      const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
      throttledMove(component.id, snappedX, snappedY);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onUnlock(component.id);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scale, component.id, throttledMove, onUnlock]);

  const rotationDeg = component.rotation || 0;

  // Render Component Specific Internal UI
  const renderInternalContent = () => {
    switch (component.type) {
      case 'ESP32':
        return (
          <div className="flex flex-col space-y-3">
            {/* Microcontroller Shield Box */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 shadow-inner flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-mono text-[10px] text-slate-300 font-bold border border-slate-500">
                  ESP
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">ESP32-WROOM</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>WIFI: {component.state.wifi || 'ONLINE'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleState(component.id);
                }}
                className="interactive-btn px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-cyan-400 transition"
              >
                TX:{component.state.pinStates?.GPIO4 ?? 1}
              </button>
            </div>
          </div>
        );

      case 'AND':
      case 'OR':
      case 'NOT':
      case 'XOR':
      case 'NOR':
      case 'XNOR':
        const gateInputA = component.state.inputA ?? 0;
        const gateInputB = component.state.inputB ?? 0;
        const gateOutput = component.state.output ?? 0;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <div className="flex flex-col space-y-1 text-[11px] text-slate-400">
              <span className={gateInputA ? 'text-emerald-400 font-bold' : 'text-slate-500'}>A={gateInputA}</span>
              {component.type !== 'NOT' && (
                <span className={gateInputB ? 'text-emerald-400 font-bold' : 'text-slate-500'}>B={gateInputB}</span>
              )}
            </div>
            <div className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              {component.type}
            </div>
            <div className="text-[11px]">
              <span className={gateOutput ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                Y={gateOutput}
              </span>
            </div>
          </div>
        );

      case 'HALF_ADDER':
        const haSum = component.state.sum ?? 0;
        const haCarry = component.state.carry ?? 0;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <div className="flex flex-col space-y-1 text-[11px] text-slate-400">
              <span className={component.state.inputA ? 'text-emerald-400 font-bold' : ''}>A={component.state.inputA ?? 0}</span>
              <span className={component.state.inputB ? 'text-emerald-400 font-bold' : ''}>B={component.state.inputB ?? 0}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-300 font-bold text-center">
              <div>HALF ADDER</div>
            </div>
            <div className="flex flex-col space-y-1 text-[11px] text-right">
              <span className={haSum ? 'text-emerald-400 font-bold' : 'text-slate-500'}>S={haSum}</span>
              <span className={haCarry ? 'text-amber-400 font-bold' : 'text-slate-500'}>C={haCarry}</span>
            </div>
          </div>
        );

      case 'FULL_ADDER':
        const faSum = component.state.sum ?? 0;
        const faCout = component.state.cout ?? 0;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <div className="flex flex-col space-y-1 text-[10px] text-slate-400">
              <span>A={component.state.inputA ?? 0}</span>
              <span>B={component.state.inputB ?? 0}</span>
              <span className="text-cyan-400">CIN={component.state.cin ?? 0}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold text-center">
              <div>FULL ADDER</div>
            </div>
            <div className="flex flex-col space-y-1 text-[11px] text-right">
              <span className={faSum ? 'text-emerald-400 font-bold' : 'text-slate-500'}>S={faSum}</span>
              <span className={faCout ? 'text-amber-400 font-bold' : 'text-slate-500'}>COUT={faCout}</span>
            </div>
          </div>
        );

      case 'DEMUX14':
        const dmIn = component.state.inData ?? 0;
        const dmS0 = component.state.s0 ?? 0;
        const dmS1 = component.state.s1 ?? 0;
        const dmSel = (dmS1 << 1) | dmS0;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <div className="flex flex-col text-[10px] text-slate-400">
              <span className="text-emerald-400 font-bold">DIN={dmIn}</span>
              <span className="text-pink-400">SEL={dmSel}</span>
            </div>
            <div className="px-2 py-1 rounded bg-pink-500/10 border border-pink-500/30 text-pink-300 font-bold">
              1:4 DEMUX
            </div>
            <div className="text-[10px] text-emerald-400 font-bold">
              Y{dmSel}={dmIn}
            </div>
          </div>
        );

      case 'SR_LATCH':
        const srQ = component.state.q ?? 0;
        const srQBar = component.state.qBar ?? 1;
        const srInvalid = component.state.invalidState ?? false;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-bold">SR Latch</span>
              {srInvalid && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-bold animate-pulse">
                  ⚠️ INVALID (S=1, R=1)
                </span>
              )}
            </div>
            <div className="flex justify-around text-xs font-mono font-bold pt-1 border-t border-slate-800">
              <span className={srQ ? 'text-emerald-400' : 'text-slate-500'}>Q = {srQ}</span>
              <span className={srQBar ? 'text-emerald-400' : 'text-slate-500'}>~Q = {srQBar}</span>
            </div>
          </div>
        );

      case 'SHIFT_REG_4BIT':
        const buf = component.state.buffer || [0, 0, 0, 0];
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-400 font-bold">4-Bit Shift Register</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleState(component.id);
                }}
                className="interactive-btn px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px]"
              >
                CLK Shift
              </button>
            </div>
            <div className="flex items-center justify-around bg-slate-950 p-2 rounded border border-slate-800 text-center font-bold text-xs">
              {buf.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-500">Q{idx}</span>
                  <span className={val ? 'text-emerald-400' : 'text-slate-600'}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'COUNTER_4BIT':
        const countVal = component.state.count ?? 0;
        const ovf = component.state.overflow ?? 0;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-400 font-bold">4-Bit Binary Counter</span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                ovf ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-cyan-400'
              }`}>
                Val: {countVal}
              </span>
            </div>
            <div className="flex items-center justify-around bg-slate-950 p-2 rounded border border-slate-800 font-mono text-xs">
              <div className={countVal & 8 ? 'text-emerald-400 font-bold' : 'text-slate-600'}>Q3</div>
              <div className={countVal & 4 ? 'text-emerald-400 font-bold' : 'text-slate-600'}>Q2</div>
              <div className={countVal & 2 ? 'text-emerald-400 font-bold' : 'text-slate-600'}>Q1</div>
              <div className={countVal & 1 ? 'text-emerald-400 font-bold' : 'text-slate-600'}>Q0</div>
            </div>
          </div>
        );

      case 'JKFF':
      case 'TFF':
        const flipQ = component.state.q ?? 0;
        const flipQBar = component.state.qBar ?? 1;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold">{component.type} Latch</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleState(component.id);
                }}
                className="interactive-btn px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono flex items-center space-x-1 transition"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>CLK Pulse</span>
              </button>
            </div>
            <div className="flex justify-around text-xs font-mono font-bold pt-1 border-t border-slate-800">
              <span className={flipQ ? 'text-emerald-400' : 'text-slate-500'}>Q = {flipQ}</span>
              <span className={flipQBar ? 'text-emerald-400' : 'text-slate-500'}>~Q = {flipQBar}</span>
            </div>
          </div>
        );

      case 'MUX21':
        const muxOut = component.state.output ?? 0;
        const muxSel = component.state.sel ?? 0;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <div className="flex flex-col text-[10px] text-slate-400">
              <span>I0 / I1</span>
              <span className="text-amber-400">SEL={muxSel}</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 font-bold">
              2:1 MUX
            </div>
            <div className="text-emerald-400 font-bold">Y={muxOut}</div>
          </div>
        );

      case 'DEC38':
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <span className="text-slate-400 text-[10px]">A0..A2</span>
            <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold">
              3:8 DEC
            </div>
            <span className="text-emerald-400 font-bold text-[10px]">
              Y{component.state.activeLine ?? 0}=1
            </span>
          </div>
        );

      case 'DIODE':
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <span className="text-amber-400">Anode (+)</span>
            <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
              1N4148 ▶|
            </div>
            <span className="text-slate-400">Cathode (-)</span>
          </div>
        );

      case 'NPN':
      case 'PNP':
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <span className="text-cyan-400 text-[10px]">Base (B)</span>
            <div className="px-2.5 py-1 rounded bg-teal-500/10 border border-teal-500/30 text-teal-300 font-bold">
              {component.type} Transistor
            </div>
            <span className="text-slate-400 text-[10px]">C / E</span>
          </div>
        );

      case 'CAPACITOR':
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <span className="text-slate-400">100nF</span>
            <div className="px-3 py-1 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold">
              —||—
            </div>
            <span className="text-emerald-400">5.0V</span>
          </div>
        );

      case 'POTENTIOMETER':
        const potPos = component.state.position ?? 50;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-semibold">Potentiometer</span>
              <span className="text-slate-300 text-[11px]">{potPos}% ({((potPos / 100) * 5).toFixed(2)}V)</span>
            </div>
            {/* Interactive Potentiometer UI Slider Variable */}
            <input
              type="range"
              min="0"
              max="100"
              value={potPos}
              onChange={(e) => {
                e.stopPropagation();
                const val = parseInt(e.target.value, 10);
                component.state.position = val;
                onToggleState(component.id);
              }}
              className="interactive-btn w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        );

      case 'TIMER555':
        return (
          <div className="p-3 rounded-lg bg-violet-950/60 border border-violet-800/80 flex items-center justify-between font-mono text-xs">
            <div className="text-[10px] text-violet-300">
              <div>Mode: Astable</div>
              <div className="text-slate-400">1kHz Pulse</div>
            </div>
            <div className="px-2.5 py-1 rounded bg-violet-500/20 border border-violet-500/40 text-violet-200 font-bold">
              NE555
            </div>
            <div className="text-emerald-400 font-bold">OUT: 1</div>
          </div>
        );

      case 'CLOCK':
        const clkActive = component.state.active ?? true;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></div>
              <span className="text-xs font-semibold text-cyan-300">1Hz Auto Clock</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleState(component.id);
              }}
              className="interactive-btn px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]"
            >
              {clkActive ? 'RUNNING' : 'PAUSED'}
            </button>
          </div>
        );

      case 'VCC':
        return (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-between font-mono text-xs">
            <span className="text-emerald-400 font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>+5V DC POWER</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">HIGH (1)</span>
          </div>
        );

      case 'GND':
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <span className="text-slate-400 font-bold">0V GROUND (GND)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px]">LOW (0)</span>
          </div>
        );

      case 'LDR':
        const lux = component.state.lux ?? 500;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-semibold">Photoresistor (LDR)</span>
              <span className="text-slate-300 text-[10px]">{lux} Lux</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                component.state.lux = lux === 500 ? 50 : 500;
                onToggleState(component.id);
              }}
              className="interactive-btn w-full py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] text-center"
            >
              Toggle Light: {lux > 200 ? '☀️ DAYLIGHT' : '🌙 DARKNESS'}
            </button>
          </div>
        );

      case 'HCSR04':
        const dist = component.state.distanceCm ?? 42.5;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center space-x-1.5 text-blue-400">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-[9px]">🔊</div>
              <span>Ultrasonic</span>
            </div>
            <span className="text-emerald-400 font-bold text-[11px]">{dist} cm</span>
          </div>
        );

      case 'SERVO':
        const angle = component.state.angle ?? 90;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-1 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400 font-semibold">SG90 Servo</span>
              <span className="text-slate-300 text-[11px]">{angle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={angle}
              onChange={(e) => {
                e.stopPropagation();
                component.state.angle = parseInt(e.target.value, 10);
                onToggleState(component.id);
              }}
              className="interactive-btn w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        );

      case 'DFF':
        const dVal = component.state.d ?? 0;
        const clkVal = component.state.clk ?? 0;
        const qVal = component.state.q ?? 0;
        const qBarVal = component.state.qBar ?? 1;

        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="text-slate-400">D={dVal}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleState(component.id);
                }}
                className="interactive-btn px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono flex items-center space-x-1 transition"
                title="Pulse Clock Signal"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>CLK Pulse</span>
              </button>
            </div>
            <div className="flex justify-around text-xs font-mono font-bold pt-1 border-t border-slate-800">
              <span className={qVal ? 'text-emerald-400' : 'text-slate-500'}>Q = {qVal}</span>
              <span className={qBarVal ? 'text-emerald-400' : 'text-slate-500'}>~Q = {qBarVal}</span>
            </div>
          </div>
        );

      case 'SWITCH':
        const isActive = component.state.active;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-slate-700'}`}></div>
              <span className="text-xs font-mono font-semibold text-slate-300">
                STATE: {isActive ? 'HIGH (1)' : 'LOW (0)'}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleState(component.id);
              }}
              className={`interactive-btn p-1 rounded-lg transition-colors ${
                isActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>
        );

      case 'LED':
        const ledOn = component.state.active;
        return (
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              ledOn 
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/80 scale-110' 
                : 'bg-slate-800 text-slate-600 border border-slate-700'
            }`}>
              <Lightbulb className={`w-6 h-6 ${ledOn ? 'animate-bounce' : ''}`} />
            </div>
            <div className="text-xs font-mono">
              <div className={ledOn ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                {ledOn ? 'DIODE ILLUMINATED' : 'OFF'}
              </div>
            </div>
          </div>
        );

      case 'ARDUINO':
        return (
          <div className="p-3 rounded-lg bg-teal-950/60 border border-teal-800/80 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center font-mono text-[10px] text-white font-bold shadow">
                  UNO
                </div>
                <div>
                  <div className="text-xs font-semibold text-teal-200">ATmega328P</div>
                  <div className="text-[10px] text-teal-400 font-mono">Baud: 115200</div>
                </div>
              </div>
              <div className="w-4 h-4 rounded bg-slate-800 border border-slate-600" title="USB-B Interface"></div>
            </div>
          </div>
        );

      case 'OPAMP':
        const gain = component.state.gain || 10;
        const vout = component.state.vout || 5.0;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <div className="flex flex-col space-y-1 text-[11px] text-slate-400">
              <span className="text-cyan-400">IN+ (Non-Inv)</span>
              <span className="text-rose-400">IN- (Inv)</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold flex flex-col items-center">
              <span>Op-Amp</span>
              <span className="text-[9px] font-normal text-slate-400">Gain: {gain}x</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-bold">
              {vout}V
            </div>
          </div>
        );

      case 'RESISTOR':
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center space-y-2">
            <div className="w-full flex items-center justify-center space-x-1 py-1 bg-amber-950/40 rounded border border-amber-800/40">
              <div className="w-3 h-6 bg-amber-700 rounded-l"></div>
              <div className="w-1.5 h-6 bg-amber-900"></div>
              <div className="w-1.5 h-6 bg-black"></div>
              <div className="w-1.5 h-6 bg-orange-500"></div>
              <div className="w-1.5 h-6 bg-amber-300"></div>
              <div className="w-3 h-6 bg-amber-700 rounded-r"></div>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-300">10kΩ Carbon Resistor</span>
          </div>
        );

      case 'SENSOR':
        const temp = component.state.temp || 24.5;
        const humidity = component.state.humidity || 48;
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs font-bold">
                DHT
              </div>
              <div className="text-[11px]">
                <div className="text-slate-200 font-semibold">{temp}°C</div>
                <div className="text-slate-400 text-[10px]">RH: {humidity}%</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
              DATA OUT
            </span>
          </div>
        );

      case 'LCD1602':
        const l1 = (component.state.line1 || 'SyncArch Lab v1').padEnd(16, ' ').slice(0, 16);
        const l2 = (component.state.line2 || 'System Ready...').padEnd(16, ' ').slice(0, 16);
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-2 font-mono">
            {/* 16x2 Character Dot Matrix LCD Screen */}
            <div className="p-2.5 rounded bg-emerald-950/90 border-2 border-emerald-800/80 text-emerald-400 shadow-inner flex flex-col space-y-1.5">
              <div className="flex items-center justify-between text-[9px] text-emerald-600 font-bold border-b border-emerald-900/60 pb-0.5">
                <span>HD44780 LCD (I2C 0x27)</span>
                <span className="animate-pulse">● BL ON</span>
              </div>

              {/* Row 1 (Explicit 16 Horizontal Columns CSS Grid) */}
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))', gap: '1px' }}
                className="font-mono text-[10px] font-bold bg-emerald-950 p-1 rounded border border-emerald-900/80 shadow-inner text-center leading-none"
              >
                {l1.split('').map((char, idx) => (
                  <span key={idx} className="bg-emerald-900/50 text-emerald-300 py-0.5 rounded-xs flex items-center justify-center">
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>

              {/* Row 2 (Explicit 16 Horizontal Columns CSS Grid) */}
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))', gap: '1px' }}
                className="font-mono text-[10px] font-bold bg-emerald-950 p-1 rounded border border-emerald-900/80 shadow-inner text-center leading-none"
              >
                {l2.split('').map((char, idx) => (
                  <span key={idx} className="bg-emerald-900/50 text-emerald-300 py-0.5 rounded-xs flex items-center justify-center">
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'OLED12864':
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-2 font-mono">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="text-cyan-400 font-bold">SSD1306 OLED (128x64)</span>
              <span>I2C: 0x3C</span>
            </div>
            {/* HTML5 Canvas Element */}
            <div className="p-1 bg-slate-950 rounded-lg border border-slate-700/80 shadow-inner flex items-center justify-center">
              <OledCanvas />
            </div>
          </div>
        );

      case 'SUB_CIRCUIT':
        const sub = component.subcircuit || component.state?.subcircuit || { components: [], wires: [] };
        return (
          <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/40 flex flex-col space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-semibold flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5" />
                <span>SUB-CIRCUIT MACRO</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {sub.components?.length || 0} Comps • {sub.wires?.length || 0} Wires
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenSubcircuit) onOpenSubcircuit(component);
              }}
              className="interactive-btn w-full py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-[10px] flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Inspect Sub-circuit Schematic</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={compRef}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      style={{
        left: `${component.x}px`,
        top: `${component.y}px`,
        position: 'absolute',
        borderColor: isLockedByOther ? (lock?.color || '#f43f5e') : isLockedByMe ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
        transform: `rotate(${component.rotation || 0}deg)`
      }}
      className={`w-72 rounded-xl glass-panel p-4 border transition-transform duration-200 ease-in-out ${
        isLockedByOther ? 'locked-component-frame cursor-not-allowed opacity-90' : 'cursor-grab active:cursor-grabbing hover:border-slate-600'
      } ${isLockedByMe ? 'ring-2 ring-cyan-500/50 shadow-xl shadow-cyan-500/10' : ''} ${
        isSelected ? 'ring-2 ring-amber-400 border-amber-400 shadow-xl shadow-amber-500/20' : ''
      }`}
    >
      {/* Block Header & Lock Indicator Badge */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wide">{component.label}</span>
        </div>

        {/* Lock Overlay Badge & Header Buttons */}
        {lock ? (
          <div
            className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white shadow-sm"
            style={{ backgroundColor: lock.color || '#f43f5e' }}
          >
            <Lock className="w-3 h-3" />
            <span>{isLockedByMe ? 'Moving...' : lock.name}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            {(component.type === 'ESP32' || component.type === 'ARDUINO') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenCodeEditor) onOpenCodeEditor(component);
                }}
                className="interactive-btn p-1 text-cyan-400 hover:text-cyan-300 rounded transition-colors"
                title="Double click block or click here to open C++ Firmware Editor"
              >
                <Code2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(component.id);
              }}
              className="interactive-btn p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
              title="Delete Component"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Internal Logic View */}
      {renderInternalContent()}

      {/* Input / Output Connection Pins Section */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between items-start text-xs font-mono relative">
        {/* Input Pins (Left side) */}
        <div className="flex flex-col space-y-2">
          {component.pins.filter(p => p.direction === 'input').map((pin) => {
            const isConnecting = activeWireSource?.compId === component.id && activeWireSource?.pinId === pin.id;
            const currentNetLabel = pin.netLabel || component.netLabels?.[pin.id];
            const isPopoverOpen = popoverPinId === pin.id;

            return (
              <div key={pin.id} className="relative">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinClick(component.id, pin.id, 'input');
                  }}
                  className="pin-node flex items-center space-x-2 group cursor-pointer"
                >
                  <div
                    data-pin-id={`${component.id}:${pin.id}`}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      isConnecting 
                        ? 'bg-amber-400 border-white pin-connecting' 
                        : 'bg-slate-800 border-cyan-500 group-hover:bg-cyan-400 group-hover:scale-125'
                    }`}
                  ></div>
                  <span className="text-[11px] text-slate-400 group-hover:text-cyan-300 font-semibold">
                    {pin.name}
                  </span>

                  {/* Net Label Badge or Add Button */}
                  {currentNetLabel ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopoverPinId(isPopoverOpen ? null : pin.id);
                        setNetInputVal(currentNetLabel);
                      }}
                      className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono flex items-center space-x-1 hover:bg-cyan-500/30 transition"
                      title="Virtual Bus Net Label (Click to Edit)"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{currentNetLabel}</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopoverPinId(isPopoverOpen ? null : pin.id);
                        setNetInputVal('');
                      }}
                      className="opacity-0 group-hover:opacity-100 px-1 py-0.5 text-[9px] text-slate-500 hover:text-cyan-400 font-mono transition-opacity flex items-center space-x-0.5"
                      title="Assign Net Label"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>+Net</span>
                    </button>
                  )}
                </div>

                {/* Net Label Popover Modal */}
                {isPopoverOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-6 z-50 p-2.5 w-52 rounded-lg bg-slate-900 border border-cyan-500/50 shadow-2xl shadow-cyan-950/80 flex flex-col space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold border-b border-slate-800 pb-1">
                      <span>SET NET LABEL ({pin.name})</span>
                      <button onClick={() => setPopoverPinId(null)} className="text-slate-500 hover:text-rose-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={netInputVal}
                        onChange={(e) => setNetInputVal(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (onUpdatePinNetLabel) onUpdatePinNetLabel(component.id, pin.id, netInputVal.trim());
                            setPopoverPinId(null);
                          }
                        }}
                        placeholder="e.g. SCLK"
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          if (onUpdatePinNetLabel) onUpdatePinNetLabel(component.id, pin.id, netInputVal.trim());
                          setPopoverPinId(null);
                        }}
                        className="p-1.5 rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['VCC', 'GND', 'CLK', 'SCLK', 'MOSI', 'MISO', 'SDA', 'SCL', 'D0'].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => {
                            setNetInputVal(preset);
                            if (onUpdatePinNetLabel) onUpdatePinNetLabel(component.id, pin.id, preset);
                            setPopoverPinId(null);
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-[9px] text-slate-400 border border-slate-700 transition"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {currentNetLabel && (
                      <button
                        onClick={() => {
                          if (onUpdatePinNetLabel) onUpdatePinNetLabel(component.id, pin.id, '');
                          setPopoverPinId(null);
                        }}
                        className="w-full py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] text-center font-semibold transition"
                      >
                        Clear Net Label
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Output Pins (Right side) */}
        <div className="flex flex-col space-y-2 items-end">
          {component.pins.filter(p => p.direction === 'output').map((pin) => {
            const isConnecting = activeWireSource?.compId === component.id && activeWireSource?.pinId === pin.id;
            const currentNetLabel = pin.netLabel || component.netLabels?.[pin.id];
            const isPopoverOpen = popoverPinId === pin.id;

            return (
              <div key={pin.id} className="relative flex flex-col items-end">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinClick(component.id, pin.id, 'output');
                  }}
                  className="pin-node flex items-center space-x-2 group cursor-pointer"
                >
                  {/* Net Label Badge or Add Button */}
                  {currentNetLabel ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopoverPinId(isPopoverOpen ? null : pin.id);
                        setNetInputVal(currentNetLabel);
                      }}
                      className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono flex items-center space-x-1 hover:bg-amber-500/30 transition"
                      title="Virtual Bus Net Label (Click to Edit)"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{currentNetLabel}</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopoverPinId(isPopoverOpen ? null : pin.id);
                        setNetInputVal('');
                      }}
                      className="opacity-0 group-hover:opacity-100 px-1 py-0.5 text-[9px] text-slate-500 hover:text-amber-400 font-mono transition-opacity flex items-center space-x-0.5"
                      title="Assign Net Label"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>+Net</span>
                    </button>
                  )}

                  <span className="text-[11px] text-slate-400 group-hover:text-amber-300 font-semibold">
                    {pin.name}
                  </span>
                  <div
                    data-pin-id={`${component.id}:${pin.id}`}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      isConnecting 
                        ? 'bg-amber-400 border-white pin-connecting' 
                        : 'bg-slate-800 border-amber-500 group-hover:bg-amber-400 group-hover:scale-125'
                    }`}
                  ></div>
                </div>

                {/* Net Label Popover Modal */}
                {isPopoverOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-6 z-50 p-2.5 w-52 rounded-lg bg-slate-900 border border-amber-500/50 shadow-2xl shadow-amber-950/80 flex flex-col space-y-2 text-xs font-mono text-left"
                  >
                    <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold border-b border-slate-800 pb-1">
                      <span>SET NET LABEL ({pin.name})</span>
                      <button onClick={() => setPopoverPinId(null)} className="text-slate-500 hover:text-rose-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={netInputVal}
                        onChange={(e) => setNetInputVal(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (onUpdatePinNetLabel) onUpdatePinNetLabel(component.id, pin.id, netInputVal.trim());
                            setPopoverPinId(null);
                          }
                        }}
                        placeholder="e.g. SCLK"
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          if (onUpdatePinNetLabel) onUpdatePinNetLabel(component.id, pin.id, netInputVal.trim());
                          setPopoverPinId(null);
                        }}
                        className="p-1.5 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['VCC', 'GND', 'CLK', 'SCLK', 'MOSI', 'MISO', 'SDA', 'SCL', 'D0'].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => {
                            setNetInputVal(preset);
                            if (onUpdatePinNetLabel) onUpdatePinNetLabel(component.id, pin.id, preset);
                            setPopoverPinId(null);
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-[9px] text-slate-400 border border-slate-700 transition"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {currentNetLabel && (
                      <button
                        onClick={() => {
                          if (onUpdatePinNetLabel) onUpdatePinNetLabel(component.id, pin.id, '');
                          setPopoverPinId(null);
                        }}
                        className="w-full py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] text-center font-semibold transition"
                      >
                        Clear Net Label
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
