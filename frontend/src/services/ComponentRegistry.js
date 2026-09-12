import {
  Cpu,
  Binary,
  Layers,
  ToggleLeft,
  Lightbulb,
  Activity,
  Zap,
  Thermometer,
  Radio,
  Clock,
  Gauge,
  Sliders,
  Maximize2,
  Compass,
  Power,
  Monitor,
  Tv
} from 'lucide-react';

export const COMPONENT_CATEGORIES = [
  'Microcontrollers',
  'Logic',
  'Analog & Semiconductors',
  'Timing & Power',
  'Passives',
  'Sensors',
  'Displays'
];

export const COMPONENT_REGISTRY = {
  // --- MICROCONTROLLERS ---
  ESP32: {
    type: 'ESP32',
    name: 'ESP32 Micro',
    category: 'Microcontrollers',
    icon: Cpu,
    color: 'from-cyan-500 to-blue-600',
    description: 'Dual-core MCU with Wi-Fi & Bluetooth GPIO headers',
    pins: [
      { id: '3V3', name: '3V3', type: 'power', direction: 'output' },
      { id: 'GND', name: 'GND', type: 'power', direction: 'output' },
      { id: 'GPIO4', name: 'IO4 (TX)', type: 'digital', direction: 'output' },
      { id: 'GPIO5', name: 'IO5 (RX)', type: 'digital', direction: 'input' },
      { id: 'GPIO18', name: 'IO18 (CLK)', type: 'digital', direction: 'output' },
      { id: 'GPIO19', name: 'IO19 (MISO)', type: 'digital', direction: 'input' }
    ],
    defaultState: { powered: true, wifi: 'ONLINE', pinStates: { GPIO4: 1, GPIO5: 0 } }
  },
  ARDUINO: {
    type: 'ARDUINO',
    name: 'Arduino Uno R3',
    category: 'Microcontrollers',
    icon: Radio,
    color: 'from-teal-500 to-emerald-600',
    description: 'ATmega328P Microcontroller Board with Digital & PWM I/O',
    pins: [
      { id: '5V', name: '5V', type: 'power', direction: 'output' },
      { id: 'GND', name: 'GND', type: 'power', direction: 'output' },
      { id: 'D2', name: 'D2 (INT)', type: 'digital', direction: 'output' },
      { id: 'D3', name: 'D3 (PWM)', type: 'digital', direction: 'output' },
      { id: 'D13', name: 'D13 (LED)', type: 'digital', direction: 'output' },
      { id: 'A0', name: 'A0 (ADC)', type: 'analog', direction: 'input' }
    ],
    defaultState: { powered: true, serialBaud: 115200, pinStates: { D2: 1, D13: 0 } }
  },

  SUB_CIRCUIT: {
    type: 'SUB_CIRCUIT',
    name: 'Custom Sub-circuit Macro',
    category: 'Logic',
    icon: Layers,
    color: 'from-amber-500 to-orange-600',
    description: 'Encapsulated Sub-circuit Macro Block',
    pins: [
      { id: 'in1', name: 'IN 1', type: 'digital', direction: 'input' },
      { id: 'in2', name: 'IN 2', type: 'digital', direction: 'input' },
      { id: 'out1', name: 'OUT 1', type: 'digital', direction: 'output' }
    ],
    defaultState: { subcircuit: { components: [], wires: [] } }
  },

  // --- LOGIC GATES & SEQUENTIAL ---
  AND: {
    type: 'AND',
    name: '7408 AND Gate',
    category: 'Logic',
    icon: Binary,
    color: 'from-emerald-500 to-green-600',
    description: 'Quad 2-Input AND Gate',
    pins: [
      { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
      { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
      { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
    ],
    defaultState: { inputA: 0, inputB: 0, output: 0 },
    calculateState: (inputs) => {
      const a = inputs.inA ?? 0;
      const b = inputs.inB ?? 0;
      return { inputA: a, inputB: b, output: a === 1 && b === 1 ? 1 : 0 };
    }
  },
  OR: {
    type: 'OR',
    name: '7432 OR Gate',
    category: 'Logic',
    icon: Binary,
    color: 'from-blue-500 to-indigo-600',
    description: 'Quad 2-Input OR Gate',
    pins: [
      { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
      { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
      { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
    ],
    defaultState: { inputA: 0, inputB: 0, output: 0 },
    calculateState: (inputs) => {
      const a = inputs.inA ?? 0;
      const b = inputs.inB ?? 0;
      return { inputA: a, inputB: b, output: a === 1 || b === 1 ? 1 : 0 };
    }
  },
  NOT: {
    type: 'NOT',
    name: '7404 NOT Inverter',
    category: 'Logic',
    icon: Binary,
    color: 'from-purple-500 to-pink-600',
    description: 'Hex Inverter Logic Gate',
    pins: [
      { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
      { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
    ],
    defaultState: { inputA: 0, output: 1 },
    calculateState: (inputs) => {
      const a = inputs.inA ?? 0;
      return { inputA: a, output: a === 1 ? 0 : 1 };
    }
  },
  NAND: {
    type: 'NAND',
    name: '7400 NAND Gate',
    category: 'Logic',
    icon: Binary,
    color: 'from-amber-500 to-orange-600',
    description: 'Quad 2-Input Universal NAND Gate',
    pins: [
      { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
      { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
      { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
    ],
    defaultState: { inputA: 0, inputB: 0, output: 1 },
    calculateState: (inputs) => {
      const a = inputs.inA ?? 0;
      const b = inputs.inB ?? 0;
      return { inputA: a, inputB: b, output: !(a === 1 && b === 1) ? 1 : 0 };
    }
  },
  NOR: {
    type: 'NOR',
    name: '7402 NOR Gate',
    category: 'Logic',
    icon: Binary,
    color: 'from-rose-500 to-red-600',
    description: 'Quad 2-Input NOR Logic Gate',
    pins: [
      { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
      { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
      { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
    ],
    defaultState: { inputA: 0, inputB: 0, output: 1 },
    calculateState: (inputs) => {
      const a = inputs.inA ?? 0;
      const b = inputs.inB ?? 0;
      return { inputA: a, inputB: b, output: !(a === 1 || b === 1) ? 1 : 0 };
    }
  },
  XOR: {
    type: 'XOR',
    name: '7486 XOR Gate',
    category: 'Logic',
    icon: Binary,
    color: 'from-violet-500 to-purple-600',
    description: 'Quad 2-Input Exclusive-OR Gate',
    pins: [
      { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
      { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
      { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
    ],
    defaultState: { inputA: 0, inputB: 0, output: 0 },
    calculateState: (inputs) => {
      const a = inputs.inA ?? 0;
      const b = inputs.inB ?? 0;
      return { inputA: a, inputB: b, output: a !== b ? 1 : 0 };
    }
  },
  XNOR: {
    type: 'XNOR',
    name: '74266 XNOR Gate',
    category: 'Logic',
    icon: Binary,
    color: 'from-purple-600 to-indigo-700',
    description: 'Quad 2-Input Exclusive-NOR Gate',
    pins: [
      { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
      { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
      { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
    ],
    defaultState: { inputA: 0, inputB: 0, output: 1 },
    calculateState: (inputs) => {
      const a = inputs.inA ?? 0;
      const b = inputs.inB ?? 0;
      return { inputA: a, inputB: b, output: a === b ? 1 : 0 };
    }
  },
  HALF_ADDER: {
    type: 'HALF_ADDER',
    name: 'Half Adder Block',
    category: 'Logic',
    icon: Binary,
    color: 'from-emerald-600 to-teal-700',
    description: '2-Bit Combinational Half Adder (Sum & Carry)',
    pins: [
      { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
      { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
      { id: 'sum', name: 'SUM (S)', type: 'digital', direction: 'output' },
      { id: 'carry', name: 'CARRY (C)', type: 'digital', direction: 'output' }
    ],
    defaultState: { inputA: 0, inputB: 0, sum: 0, carry: 0 },
    calculateState: (inputs) => {
      const a = inputs.inA ?? 0;
      const b = inputs.inB ?? 0;
      const sum = a !== b ? 1 : 0;
      const carry = (a === 1 && b === 1) ? 1 : 0;
      return { inputA: a, inputB: b, sum, carry };
    }
  },
  FULL_ADDER: {
    type: 'FULL_ADDER',
    name: 'Full Adder Block',
    category: 'Logic',
    icon: Binary,
    color: 'from-teal-600 to-cyan-700',
    description: '3-Input Binary Full Adder with Carry-In & Carry-Out',
    pins: [
      { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
      { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
      { id: 'cin', name: 'CIN', type: 'digital', direction: 'input' },
      { id: 'sum', name: 'SUM (S)', type: 'digital', direction: 'output' },
      { id: 'cout', name: 'COUT', type: 'digital', direction: 'output' }
    ],
    defaultState: { inputA: 0, inputB: 0, cin: 0, sum: 0, cout: 0 },
    calculateState: (inputs) => {
      const a = inputs.inA ?? 0;
      const b = inputs.inB ?? 0;
      const cin = inputs.cin ?? 0;
      const sum = ((a ^ b ^ cin) & 1);
      const cout = ((a & b) | (cin & (a ^ b))) ? 1 : 0;
      return { inputA: a, inputB: b, cin, sum, cout };
    }
  },
  DEMUX14: {
    type: 'DEMUX14',
    name: '1-to-4 Demux',
    category: 'Logic',
    icon: Sliders,
    color: 'from-pink-600 to-rose-700',
    description: '1-Line to 4-Line Demultiplexer with 2-bit Select (S0, S1)',
    pins: [
      { id: 'inData', name: 'DIN', type: 'digital', direction: 'input' },
      { id: 's0', name: 'S0', type: 'digital', direction: 'input' },
      { id: 's1', name: 'S1', type: 'digital', direction: 'input' },
      { id: 'y0', name: 'Y0', type: 'digital', direction: 'output' },
      { id: 'y1', name: 'Y1', type: 'digital', direction: 'output' },
      { id: 'y2', name: 'Y2', type: 'digital', direction: 'output' },
      { id: 'y3', name: 'Y3', type: 'digital', direction: 'output' }
    ],
    defaultState: { inData: 0, s0: 0, s1: 0, y0: 0, y1: 0, y2: 0, y3: 0 },
    calculateState: (inputs) => {
      const d = inputs.inData ?? 0;
      const s0 = inputs.s0 ?? 0;
      const s1 = inputs.s1 ?? 0;
      const sel = (s1 << 1) | s0;
      return {
        inData: d, s0, s1,
        y0: sel === 0 ? d : 0,
        y1: sel === 1 ? d : 0,
        y2: sel === 2 ? d : 0,
        y3: sel === 3 ? d : 0
      };
    }
  },
  SR_LATCH: {
    type: 'SR_LATCH',
    name: 'SR Latch',
    category: 'Logic',
    icon: Layers,
    color: 'from-amber-600 to-yellow-700',
    description: 'Set/Reset Latch with Invalid (1,1) Error Protection',
    pins: [
      { id: 's', name: 'SET (S)', type: 'digital', direction: 'input' },
      { id: 'r', name: 'RESET (R)', type: 'digital', direction: 'input' },
      { id: 'q', name: 'Q', type: 'digital', direction: 'output' },
      { id: 'qBar', name: '~Q', type: 'digital', direction: 'output' }
    ],
    defaultState: { s: 0, r: 0, q: 0, qBar: 1, invalidState: false },
    calculateState: (inputs, currentState) => {
      const s = inputs.s ?? 0;
      const r = inputs.r ?? 0;
      let q = currentState.q ?? 0;
      let qBar = currentState.qBar ?? 1;
      let invalidState = false;

      if (s === 1 && r === 1) {
        // Forbidden state
        q = 0;
        qBar = 0;
        invalidState = true;
      } else if (s === 1 && r === 0) {
        q = 1;
        qBar = 0;
      } else if (s === 0 && r === 1) {
        q = 0;
        qBar = 1;
      }
      return { s, r, q, qBar, invalidState };
    }
  },
  DFF: {
    type: 'DFF',
    name: '7474 D Flip-Flop',
    category: 'Logic',
    icon: Layers,
    color: 'from-purple-500 to-indigo-600',
    description: 'Dual D-Type Positive-Edge Flip-Flop',
    pins: [
      { id: 'd', name: 'D', type: 'digital', direction: 'input' },
      { id: 'clk', name: 'CLK', type: 'digital', direction: 'input' },
      { id: 'q', name: 'Q', type: 'digital', direction: 'output' },
      { id: 'qBar', name: '~Q', type: 'digital', direction: 'output' }
    ],
    defaultState: { d: 0, clk: 0, q: 0, qBar: 1 }
  },
  JKFF: {
    type: 'JKFF',
    name: 'JK Flip-Flop',
    category: 'Logic',
    icon: Layers,
    color: 'from-cyan-600 to-blue-700',
    description: 'Universal JK Sequential Logic Latch',
    pins: [
      { id: 'j', name: 'J', type: 'digital', direction: 'input' },
      { id: 'k', name: 'K', type: 'digital', direction: 'input' },
      { id: 'clk', name: 'CLK', type: 'digital', direction: 'input' },
      { id: 'q', name: 'Q', type: 'digital', direction: 'output' },
      { id: 'qBar', name: '~Q', type: 'digital', direction: 'output' }
    ],
    defaultState: { j: 0, k: 0, clk: 0, q: 0, qBar: 1 }
  },
  TFF: {
    type: 'TFF',
    name: 'T Flip-Flop',
    category: 'Logic',
    icon: Layers,
    color: 'from-indigo-600 to-purple-700',
    description: 'Toggle Flip-Flop Frequency Divider',
    pins: [
      { id: 't', name: 'T', type: 'digital', direction: 'input' },
      { id: 'clk', name: 'CLK', type: 'digital', direction: 'input' },
      { id: 'q', name: 'Q', type: 'digital', direction: 'output' },
      { id: 'qBar', name: '~Q', type: 'digital', direction: 'output' }
    ],
    defaultState: { t: 0, clk: 0, q: 0, qBar: 1 }
  },
  SHIFT_REG_4BIT: {
    type: 'SHIFT_REG_4BIT',
    name: '4-Bit Shift Register',
    category: 'Logic',
    icon: Layers,
    color: 'from-indigo-600 to-violet-700',
    description: '74195 4-Bit Serial-In Parallel-Out Shift Register',
    pins: [
      { id: 'dataIn', name: 'SER IN', type: 'digital', direction: 'input' },
      { id: 'clk', name: 'CLK', type: 'digital', direction: 'input' },
      { id: 'reset', name: 'RST', type: 'digital', direction: 'input' },
      { id: 'q0', name: 'Q0', type: 'digital', direction: 'output' },
      { id: 'q1', name: 'Q1', type: 'digital', direction: 'output' },
      { id: 'q2', name: 'Q2', type: 'digital', direction: 'output' },
      { id: 'q3', name: 'Q3', type: 'digital', direction: 'output' }
    ],
    defaultState: { buffer: [0, 0, 0, 0], prevClk: 0, q0: 0, q1: 0, q2: 0, q3: 0 },
    calculateState: (inputs, currentState) => {
      const dataIn = inputs.dataIn ?? 0;
      const clk = inputs.clk ?? 0;
      const reset = inputs.reset ?? 0;
      const prevClk = currentState.prevClk ?? 0;
      let buffer = [...(currentState.buffer || [0, 0, 0, 0])];

      if (reset === 1) {
        buffer = [0, 0, 0, 0];
      } else if (clk === 1 && prevClk === 0) {
        buffer = [dataIn, buffer[0], buffer[1], buffer[2]];
      }

      return {
        buffer,
        prevClk: clk,
        q0: buffer[0],
        q1: buffer[1],
        q2: buffer[2],
        q3: buffer[3]
      };
    }
  },
  COUNTER_4BIT: {
    type: 'COUNTER_4BIT',
    name: '4-Bit Binary Counter',
    category: 'Logic',
    icon: Layers,
    color: 'from-blue-600 to-cyan-700',
    description: '7493 4-Bit Synchronous Up-Counter (0-15)',
    pins: [
      { id: 'enable', name: 'EN', type: 'digital', direction: 'input' },
      { id: 'clk', name: 'CLK', type: 'digital', direction: 'input' },
      { id: 'reset', name: 'RST', type: 'digital', direction: 'input' },
      { id: 'q0', name: 'Q0 (LSB)', type: 'digital', direction: 'output' },
      { id: 'q1', name: 'Q1', type: 'digital', direction: 'output' },
      { id: 'q2', name: 'Q2', type: 'digital', direction: 'output' },
      { id: 'q3', name: 'Q3 (MSB)', type: 'digital', direction: 'output' },
      { id: 'overflow', name: 'OVF', type: 'digital', direction: 'output' }
    ],
    defaultState: { count: 0, prevClk: 0, q0: 0, q1: 0, q2: 0, q3: 0, overflow: 0 },
    calculateState: (inputs, currentState) => {
      const enable = inputs.enable ?? 1;
      const clk = inputs.clk ?? 0;
      const reset = inputs.reset ?? 0;
      const prevClk = currentState.prevClk ?? 0;
      let count = currentState.count ?? 0;

      if (reset === 1) {
        count = 0;
      } else if (clk === 1 && prevClk === 0 && enable === 1) {
        count = (count + 1) % 16;
      }

      const q0 = count & 1;
      const q1 = (count & 2) >> 1;
      const q2 = (count & 4) >> 2;
      const q3 = (count & 8) >> 3;
      const overflow = count === 15 ? 1 : 0;

      return { count, prevClk: clk, q0, q1, q2, q3, overflow };
    }
  },
  MUX21: {
    type: 'MUX21',
    name: '2-to-1 Multiplexer',
    category: 'Logic',
    icon: Sliders,
    color: 'from-fuchsia-600 to-pink-600',
    description: 'Data Selector MUX (Inputs I0, I1, Sel S)',
    pins: [
      { id: 'i0', name: 'I0', type: 'digital', direction: 'input' },
      { id: 'i1', name: 'I1', type: 'digital', direction: 'input' },
      { id: 'sel', name: 'SEL', type: 'digital', direction: 'input' },
      { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
    ],
    defaultState: { i0: 0, i1: 0, sel: 0, output: 0 }
  },
  DEC38: {
    type: 'DEC38',
    name: '3-to-8 Decoder',
    category: 'Logic',
    icon: Binary,
    color: 'from-blue-600 to-cyan-600',
    description: '74138 3-Line to 8-Line Line Decoder',
    pins: [
      { id: 'a0', name: 'A0', type: 'digital', direction: 'input' },
      { id: 'a1', name: 'A1', type: 'digital', direction: 'input' },
      { id: 'a2', name: 'A2', type: 'digital', direction: 'input' },
      { id: 'y0', name: 'Y0', type: 'digital', direction: 'output' },
      { id: 'y1', name: 'Y1', type: 'digital', direction: 'output' },
      { id: 'y2', name: 'Y2', type: 'digital', direction: 'output' },
      { id: 'y3', name: 'Y3', type: 'digital', direction: 'output' }
    ],
    defaultState: { activeLine: 0 }
  },

  // --- ANALOG & SEMICONDUCTORS ---
  OPAMP: {
    type: 'OPAMP',
    name: 'LM741 Op-Amp',
    category: 'Analog & Semiconductors',
    icon: Activity,
    color: 'from-blue-600 to-indigo-700',
    description: 'General Purpose Operational Amplifier IC',
    pins: [
      { id: 'nonInv', name: 'IN+', type: 'analog', direction: 'input' },
      { id: 'inv', name: 'IN-', type: 'analog', direction: 'input' },
      { id: 'vcc', name: 'VCC (+)', type: 'power', direction: 'input' },
      { id: 'vee', name: 'VEE (-)', type: 'power', direction: 'input' },
      { id: 'out', name: 'VOUT', type: 'analog', direction: 'output' }
    ],
    defaultState: { gain: 10, vout: 5.0, saturated: false }
  },
  DIODE: {
    type: 'DIODE',
    name: '1N4148 Diode',
    category: 'Analog & Semiconductors',
    icon: Zap,
    color: 'from-amber-600 to-red-600',
    description: 'High-Speed Silicon Switching Diode',
    pins: [
      { id: 'anode', name: 'A (Anode)', type: 'analog', direction: 'input' },
      { id: 'cathode', name: 'K (Cathode)', type: 'analog', direction: 'output' }
    ],
    defaultState: { conducting: false, vf: '0.7V' }
  },
  NPN: {
    type: 'NPN',
    name: '2N2222 NPN BJT',
    category: 'Analog & Semiconductors',
    icon: Activity,
    color: 'from-teal-600 to-cyan-700',
    description: 'General Purpose NPN Bipolar Junction Transistor',
    pins: [
      { id: 'base', name: 'B (Base)', type: 'analog', direction: 'input' },
      { id: 'collector', name: 'C (Collector)', type: 'analog', direction: 'input' },
      { id: 'emitter', name: 'E (Emitter)', type: 'analog', direction: 'output' }
    ],
    defaultState: { state: 'OFF', hfe: 100 }
  },
  PNP: {
    type: 'PNP',
    name: '2N3906 PNP BJT',
    category: 'Analog & Semiconductors',
    icon: Activity,
    color: 'from-rose-600 to-red-700',
    description: 'General Purpose PNP Bipolar Junction Transistor',
    pins: [
      { id: 'base', name: 'B (Base)', type: 'analog', direction: 'input' },
      { id: 'collector', name: 'C (Collector)', type: 'analog', direction: 'output' },
      { id: 'emitter', name: 'E (Emitter)', type: 'analog', direction: 'input' }
    ],
    defaultState: { state: 'OFF', hfe: 100 }
  },
  CAPACITOR: {
    type: 'CAPACITOR',
    name: 'Capacitor',
    category: 'Analog & Semiconductors',
    icon: Zap,
    color: 'from-sky-500 to-blue-600',
    description: 'Unpolarized Ceramic Capacitor (100nF)',
    pins: [
      { id: 't1', name: 'T1', type: 'passive', direction: 'input' },
      { id: 't2', name: 'T2', type: 'passive', direction: 'output' }
    ],
    defaultState: { capacitance: '100nF', voltage: '5.0V' }
  },
  POTENTIOMETER: {
    type: 'POTENTIOMETER',
    name: 'Potentiometer',
    category: 'Analog & Semiconductors',
    icon: Sliders,
    color: 'from-amber-500 to-yellow-600',
    description: 'Variable Rotary Potentiometer (10kΩ) with UI Slider',
    pins: [
      { id: 't1', name: 'T1 (High)', type: 'analog', direction: 'input' },
      { id: 'wiper', name: 'Wiper', type: 'analog', direction: 'output' },
      { id: 't2', name: 'T2 (Low)', type: 'analog', direction: 'input' }
    ],
    defaultState: { resistance: '10kΩ', position: 50, outputVoltage: 2.5 }
  },

  // --- TIMING & POWER ---
  TIMER555: {
    type: 'TIMER555',
    name: '555 Timer IC',
    category: 'Timing & Power',
    icon: Clock,
    color: 'from-violet-600 to-purple-700',
    description: 'Precision Timer & Astable / Monostable Oscillator',
    pins: [
      { id: 'vcc', name: 'VCC', type: 'power', direction: 'input' },
      { id: 'trig', name: 'TRIG', type: 'analog', direction: 'input' },
      { id: 'thresh', name: 'THRESH', type: 'analog', direction: 'input' },
      { id: 'reset', name: 'RESET', type: 'digital', direction: 'input' },
      { id: 'out', name: 'OUT', type: 'digital', direction: 'output' },
      { id: 'disch', name: 'DISCH', type: 'analog', direction: 'output' },
      { id: 'gnd', name: 'GND', type: 'power', direction: 'input' }
    ],
    defaultState: { mode: 'Astable', frequency: '1kHz', out: 1 }
  },
  CLOCK: {
    type: 'CLOCK',
    name: '1Hz Clock Generator',
    category: 'Timing & Power',
    icon: Clock,
    color: 'from-cyan-500 to-teal-600',
    description: 'Automated 1Hz Square-Wave Clock Signal Source',
    pins: [
      { id: 'out', name: 'CLK OUT', type: 'digital', direction: 'output' }
    ],
    defaultState: { active: true, frequencyHz: 1, signal: 1 }
  },
  VCC: {
    type: 'VCC',
    name: 'VCC (+5V Power)',
    category: 'Timing & Power',
    icon: Power,
    color: 'from-emerald-500 to-teal-600',
    description: 'Constant Logic HIGH (+5V DC Power Source)',
    pins: [
      { id: 'out', name: '+5V', type: 'power', direction: 'output' }
    ],
    defaultState: { voltage: 5.0, signal: 1 }
  },
  GND: {
    type: 'GND',
    name: 'GND (0V Ground)',
    category: 'Timing & Power',
    icon: Zap,
    color: 'from-slate-600 to-slate-800',
    description: 'Constant Logic LOW (0V Ground Reference Node)',
    pins: [
      { id: 'out', name: '0V (GND)', type: 'power', direction: 'output' }
    ],
    defaultState: { voltage: 0.0, signal: 0 }
  },

  // --- PASSIVES ---
  RESISTOR: {
    type: 'RESISTOR',
    name: '10kΩ Resistor',
    category: 'Passives',
    icon: Zap,
    color: 'from-yellow-500 to-amber-600',
    description: '10,000 Ohm Carbon Film Resistor',
    pins: [
      { id: 't1', name: 'T1', type: 'passive', direction: 'input' },
      { id: 't2', name: 'T2', type: 'passive', direction: 'output' }
    ],
    defaultState: { resistance: '10kΩ', voltageDrop: 0.5 }
  },
  SWITCH: {
    type: 'SWITCH',
    name: 'Logic Switch',
    category: 'Passives',
    icon: ToggleLeft,
    color: 'from-emerald-500 to-teal-600',
    description: 'SPST Logic Toggle High/Low Signal Source',
    pins: [
      { id: 'out', name: 'OUT', type: 'digital', direction: 'output' }
    ],
    defaultState: { active: true }
  },
  LED: {
    type: 'LED',
    name: 'Status LED',
    category: 'Passives',
    icon: Lightbulb,
    color: 'from-pink-500 to-rose-600',
    description: '5mm Red Diode Indicator Light Visualizer',
    pins: [
      { id: 'in', name: 'IN', type: 'digital', direction: 'input' }
    ],
    defaultState: { active: false }
  },

  // --- SENSORS ---
  LDR: {
    type: 'LDR',
    name: 'Photoresistor (LDR)',
    category: 'Sensors',
    icon: Gauge,
    color: 'from-amber-500 to-orange-600',
    description: 'Light Dependent Resistor with Ambient Lux Controls',
    pins: [
      { id: 'vcc', name: 'VCC', type: 'power', direction: 'input' },
      { id: 'out', name: 'SIGNAL', type: 'analog', direction: 'output' }
    ],
    defaultState: { lux: 500, lightState: 'DAYLIGHT', outputSignal: 1 }
  },
  HCSR04: {
    type: 'HCSR04',
    name: 'HC-SR04 Ultrasonic',
    category: 'Sensors',
    icon: Compass,
    color: 'from-blue-500 to-indigo-600',
    description: 'Ultrasonic Distance Sensor Transceiver Module',
    pins: [
      { id: 'vcc', name: 'VCC', type: 'power', direction: 'input' },
      { id: 'trig', name: 'TRIG', type: 'digital', direction: 'input' },
      { id: 'echo', name: 'ECHO', type: 'digital', direction: 'output' },
      { id: 'gnd', name: 'GND', type: 'power', direction: 'input' }
    ],
    defaultState: { distanceCm: 42.5, echoPulseMs: 2.4 }
  },
  SENSOR: {
    type: 'SENSOR',
    name: 'DHT11 Temp/Humidity',
    category: 'Sensors',
    icon: Thermometer,
    color: 'from-rose-500 to-red-600',
    description: 'Digital Temperature & Relative Humidity Sensor Module',
    pins: [
      { id: 'vcc', name: 'VCC', type: 'power', direction: 'input' },
      { id: 'gnd', name: 'GND', type: 'power', direction: 'input' },
      { id: 'data', name: 'DATA', type: 'digital', direction: 'output' }
    ],
    defaultState: { temp: 24.5, humidity: 48, status: 'NORMAL' }
  },
  SERVO: {
    type: 'SERVO',
    name: 'SG90 Micro Servo',
    category: 'Sensors',
    icon: Maximize2,
    color: 'from-cyan-600 to-blue-700',
    description: '180-Degree PWM Position Micro Servo Motor',
    pins: [
      { id: 'pwm', name: 'PWM', type: 'digital', direction: 'input' },
      { id: 'vcc', name: 'VCC', type: 'power', direction: 'input' },
      { id: 'gnd', name: 'GND', type: 'power', direction: 'input' }
    ],
    defaultState: { angle: 90, targetAngle: 90 }
  },

  // --- DISPLAYS ---
  LCD1602: {
    type: 'LCD1602',
    name: '16x2 I2C LCD Display',
    category: 'Displays',
    icon: Monitor,
    color: 'from-teal-600 to-cyan-700',
    description: '16x2 Character Alphanumeric LCD with PCF8574 I2C Module',
    pins: [
      { id: 'vcc', name: 'VCC', type: 'power', direction: 'input' },
      { id: 'gnd', name: 'GND', type: 'power', direction: 'input' },
      { id: 'sda', name: 'SDA', type: 'digital', direction: 'input' },
      { id: 'scl', name: 'SCL', type: 'digital', direction: 'input' }
    ],
    defaultState: {
      line1: 'SyncArch Lab v1',
      line2: 'System Ready...',
      backlight: true,
      addr: '0x27'
    }
  },
  OLED12864: {
    type: 'OLED12864',
    name: '128x64 SSD1306 OLED',
    category: 'Displays',
    icon: Tv,
    color: 'from-blue-600 to-indigo-800',
    description: '0.96 inch Monochromatic Blue I2C Graphic OLED Display',
    pins: [
      { id: 'vcc', name: 'VCC', type: 'power', direction: 'input' },
      { id: 'gnd', name: 'GND', type: 'power', direction: 'input' },
      { id: 'sda', name: 'SDA', type: 'digital', direction: 'input' },
      { id: 'scl', name: 'SCL', type: 'digital', direction: 'input' }
    ],
    defaultState: {
      addr: '0x3C',
      mode: 'GRAPHICS',
      frame: 0,
      active: true
    }
  }
};

export function createComponentInstance(componentType, customX, customY) {
  const template = COMPONENT_REGISTRY[componentType] || COMPONENT_REGISTRY.NAND;
  const GRID_SIZE = 24;
  const snap = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;

  const rawX = customX ?? (312 + Math.floor(Math.random() * 4) * 48);
  const rawY = customY ?? (192 + Math.floor(Math.random() * 4) * 48);

  const defaultX = snap(rawX);
  const defaultY = snap(rawY);

  return {
    id: `${componentType.toLowerCase()}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
    type: template.type,
    x: defaultX,
    y: defaultY,
    label: `${template.name} #${Math.floor(10 + Math.random() * 89)}`,
    pins: template.pins,
    state: JSON.parse(JSON.stringify(template.defaultState))
  };
}
