import { COMPONENT_REGISTRY } from './ComponentRegistry';
import { evaluateCircuitTopology } from '../utils/logicEvaluator';

describe('ComponentRegistry Logic Gates & Circuit Blocks', () => {

  describe('AND Gate (7408)', () => {
    const gate = COMPONENT_REGISTRY.AND;
    test('Truth Table Evaluation', () => {
      expect(gate.calculateState({ inA: 0, inB: 0 }).output).toBe(0);
      expect(gate.calculateState({ inA: 0, inB: 1 }).output).toBe(0);
      expect(gate.calculateState({ inA: 1, inB: 0 }).output).toBe(0);
      expect(gate.calculateState({ inA: 1, inB: 1 }).output).toBe(1);
    });
  });

  describe('OR Gate (7432)', () => {
    const gate = COMPONENT_REGISTRY.OR;
    test('Truth Table Evaluation', () => {
      expect(gate.calculateState({ inA: 0, inB: 0 }).output).toBe(0);
      expect(gate.calculateState({ inA: 0, inB: 1 }).output).toBe(1);
      expect(gate.calculateState({ inA: 1, inB: 0 }).output).toBe(1);
      expect(gate.calculateState({ inA: 1, inB: 1 }).output).toBe(1);
    });
  });

  describe('NOT Inverter (7404)', () => {
    const gate = COMPONENT_REGISTRY.NOT;
    test('Truth Table Evaluation', () => {
      expect(gate.calculateState({ inA: 0 }).output).toBe(1);
      expect(gate.calculateState({ inA: 1 }).output).toBe(0);
    });
  });

  describe('NAND Gate (7400)', () => {
    const gate = COMPONENT_REGISTRY.NAND;
    test('Truth Table Evaluation', () => {
      expect(gate.calculateState({ inA: 0, inB: 0 }).output).toBe(1);
      expect(gate.calculateState({ inA: 0, inB: 1 }).output).toBe(1);
      expect(gate.calculateState({ inA: 1, inB: 0 }).output).toBe(1);
      expect(gate.calculateState({ inA: 1, inB: 1 }).output).toBe(0);
    });
  });

  describe('NOR Gate (7402)', () => {
    const gate = COMPONENT_REGISTRY.NOR;
    test('Truth Table Evaluation: !(A || B)', () => {
      expect(gate.calculateState({ inA: 0, inB: 0 }).output).toBe(1);
      expect(gate.calculateState({ inA: 0, inB: 1 }).output).toBe(0);
      expect(gate.calculateState({ inA: 1, inB: 0 }).output).toBe(0);
      expect(gate.calculateState({ inA: 1, inB: 1 }).output).toBe(0);
    });
  });

  describe('XOR Gate (7486)', () => {
    const gate = COMPONENT_REGISTRY.XOR;
    test('Truth Table Evaluation: A ^ B', () => {
      expect(gate.calculateState({ inA: 0, inB: 0 }).output).toBe(0);
      expect(gate.calculateState({ inA: 0, inB: 1 }).output).toBe(1);
      expect(gate.calculateState({ inA: 1, inB: 0 }).output).toBe(1);
      expect(gate.calculateState({ inA: 1, inB: 1 }).output).toBe(0);
    });
  });

  describe('XNOR Gate (74266)', () => {
    const gate = COMPONENT_REGISTRY.XNOR;
    test('Truth Table Evaluation: A === B', () => {
      expect(gate.calculateState({ inA: 0, inB: 0 }).output).toBe(1);
      expect(gate.calculateState({ inA: 0, inB: 1 }).output).toBe(0);
      expect(gate.calculateState({ inA: 1, inB: 0 }).output).toBe(0);
      expect(gate.calculateState({ inA: 1, inB: 1 }).output).toBe(1);
    });
  });

  describe('Half Adder', () => {
    const adder = COMPONENT_REGISTRY.HALF_ADDER;
    test('Sum and Carry Truth Table', () => {
      // 0 + 0 = 0 (Carry 0)
      expect(adder.calculateState({ inA: 0, inB: 0 })).toEqual({ inputA: 0, inputB: 0, sum: 0, carry: 0 });
      // 0 + 1 = 1 (Carry 0)
      expect(adder.calculateState({ inA: 0, inB: 1 })).toEqual({ inputA: 0, inputB: 1, sum: 1, carry: 0 });
      // 1 + 0 = 1 (Carry 0)
      expect(adder.calculateState({ inA: 1, inB: 0 })).toEqual({ inputA: 1, inputB: 0, sum: 1, carry: 0 });
      // 1 + 1 = 0 (Carry 1)
      expect(adder.calculateState({ inA: 1, inB: 1 })).toEqual({ inputA: 1, inputB: 1, sum: 0, carry: 1 });
    });
  });

  describe('Full Adder', () => {
    const adder = COMPONENT_REGISTRY.FULL_ADDER;
    test('Full 3-Input Truth Table Evaluation', () => {
      const truthTable = [
        { a: 0, b: 0, cin: 0, expectedSum: 0, expectedCout: 0 },
        { a: 0, b: 0, cin: 1, expectedSum: 1, expectedCout: 0 },
        { a: 0, b: 1, cin: 0, expectedSum: 1, expectedCout: 0 },
        { a: 0, b: 1, cin: 1, expectedSum: 0, expectedCout: 1 },
        { a: 1, b: 0, cin: 0, expectedSum: 1, expectedCout: 0 },
        { a: 1, b: 0, cin: 1, expectedSum: 0, expectedCout: 1 },
        { a: 1, b: 1, cin: 0, expectedSum: 0, expectedCout: 1 },
        { a: 1, b: 1, cin: 1, expectedSum: 1, expectedCout: 1 },
      ];

      truthTable.forEach(({ a, b, cin, expectedSum, expectedCout }) => {
        const res = adder.calculateState({ inA: a, inB: b, cin });
        expect(res.sum).toBe(expectedSum);
        expect(res.cout).toBe(expectedCout);
      });
    });
  });

  describe('1-to-4 Demux (DEMUX14)', () => {
    const demux = COMPONENT_REGISTRY.DEMUX14;
    test('Routing Data Input DIN=1 based on (S1, S0)', () => {
      // S1=0, S0=0 -> Y0=1
      expect(demux.calculateState({ inData: 1, s1: 0, s0: 0 })).toMatchObject({ y0: 1, y1: 0, y2: 0, y3: 0 });
      // S1=0, S0=1 -> Y1=1
      expect(demux.calculateState({ inData: 1, s1: 0, s0: 1 })).toMatchObject({ y0: 0, y1: 1, y2: 0, y3: 0 });
      // S1=1, S0=0 -> Y2=1
      expect(demux.calculateState({ inData: 1, s1: 1, s0: 0 })).toMatchObject({ y0: 0, y1: 0, y2: 1, y3: 0 });
      // S1=1, S0=1 -> Y3=1
      expect(demux.calculateState({ inData: 1, s1: 1, s0: 1 })).toMatchObject({ y0: 0, y1: 0, y2: 0, y3: 1 });
    });

    test('All outputs 0 when DIN=0 regardless of selection', () => {
      expect(demux.calculateState({ inData: 0, s1: 1, s0: 0 })).toMatchObject({ y0: 0, y1: 0, y2: 0, y3: 0 });
    });
  });

  describe('SR Latch', () => {
    const latch = COMPONENT_REGISTRY.SR_LATCH;
    const initialState = latch.defaultState;

    test('Set Operation (S=1, R=0)', () => {
      const state = latch.calculateState({ s: 1, r: 0 }, initialState);
      expect(state.q).toBe(1);
      expect(state.qBar).toBe(0);
      expect(state.invalidState).toBe(false);
    });

    test('Reset Operation (S=0, R=1)', () => {
      const state = latch.calculateState({ s: 0, r: 1 }, { s: 1, r: 0, q: 1, qBar: 0 });
      expect(state.q).toBe(0);
      expect(state.qBar).toBe(1);
      expect(state.invalidState).toBe(false);
    });

    test('Forbidden / Invalid State Handling (S=1, R=1)', () => {
      const state = latch.calculateState({ s: 1, r: 1 }, initialState);
      expect(state.q).toBe(0);
      expect(state.qBar).toBe(0);
      expect(state.invalidState).toBe(true);
    });
  });

  describe('4-Bit Shift Register', () => {
    const shiftReg = COMPONENT_REGISTRY.SHIFT_REG_4BIT;

    test('Serial In / Parallel Out on Clock Rising Edge', () => {
      let state = shiftReg.defaultState;

      // Clock Low -> High with dataIn=1
      state = shiftReg.calculateState({ dataIn: 1, clk: 1, reset: 0 }, state);
      expect(state.buffer).toEqual([1, 0, 0, 0]);

      // Clock High -> High (No edge, buffer remains unchanged)
      state = shiftReg.calculateState({ dataIn: 0, clk: 1, reset: 0 }, state);
      expect(state.buffer).toEqual([1, 0, 0, 0]);

      // Clock High -> Low -> High with dataIn=0
      state = shiftReg.calculateState({ dataIn: 0, clk: 0, reset: 0 }, state);
      state = shiftReg.calculateState({ dataIn: 0, clk: 1, reset: 0 }, state);
      expect(state.buffer).toEqual([0, 1, 0, 0]);
    });
  });

  describe('4-Bit Binary Counter', () => {
    const counter = COMPONENT_REGISTRY.COUNTER_4BIT;

    test('Increments count on rising clock edge', () => {
      let state = counter.defaultState;

      // Pulse 1
      state = counter.calculateState({ enable: 1, clk: 1, reset: 0 }, state);
      expect(state.count).toBe(1);
      expect(state.q0).toBe(1);

      // Pulse 2
      state = counter.calculateState({ enable: 1, clk: 0, reset: 0 }, state);
      state = counter.calculateState({ enable: 1, clk: 1, reset: 0 }, state);
      expect(state.count).toBe(2);
      expect(state.q1).toBe(1);
      expect(state.q0).toBe(0);
    });
  });

  describe('Virtual Net Label Logical Resolver', () => {
    test('Pins sharing matching Net Label communicate virtually without physical wires', () => {
      const components = [
        {
          id: 'sw1',
          type: 'SWITCH',
          state: { active: true },
          pins: [{ id: 'out', direction: 'output', netLabel: 'SCLK' }]
        },
        {
          id: 'led1',
          type: 'LED',
          state: { active: false },
          pins: [{ id: 'in', direction: 'input', netLabel: 'SCLK' }]
        }
      ];

      const { components: evaluatedComps } = evaluateCircuitTopology(components, []);
      const ledComp = evaluatedComps.find(c => c.id === 'led1');
      expect(ledComp.state.active).toBe(true);
    });
  });

  describe('Sub-circuit Macro Hierarchical Logic Evaluation', () => {
    test('Sub-circuit macro block evaluates internal logic and propagates outputs', () => {
      const internalComponents = [
        {
          id: 'gate1',
          type: 'AND',
          state: { inputA: 0, inputB: 0, output: 0 },
          pins: [
            { id: 'inA', direction: 'input' },
            { id: 'inB', direction: 'input' },
            { id: 'outY', direction: 'output' }
          ]
        }
      ];

      const subcircuitComp = {
        id: 'macro1',
        type: 'SUB_CIRCUIT',
        pins: [
          { id: 'in1', direction: 'input', targetCompId: 'gate1', targetPin: 'inA' },
          { id: 'in2', direction: 'input', targetCompId: 'gate1', targetPin: 'inB' },
          { id: 'out1', direction: 'output', targetCompId: 'gate1', targetPin: 'outY' }
        ],
        subcircuit: {
          components: internalComponents,
          wires: []
        },
        state: {
          subcircuit: {
            components: internalComponents,
            wires: []
          }
        }
      };

      const outerSwitch1 = {
        id: 'swA',
        type: 'SWITCH',
        state: { active: true },
        pins: [{ id: 'out', direction: 'output' }]
      };

      const outerSwitch2 = {
        id: 'swB',
        type: 'SWITCH',
        state: { active: true },
        pins: [{ id: 'out', direction: 'output' }]
      };

      const outerWires = [
        { id: 'w1', fromCompId: 'swA', fromPin: 'out', toCompId: 'macro1', toPin: 'in1' },
        { id: 'w2', fromCompId: 'swB', fromPin: 'out', toCompId: 'macro1', toPin: 'in2' }
      ];

      const { components: evaluatedComps } = evaluateCircuitTopology(
        [outerSwitch1, outerSwitch2, subcircuitComp],
        outerWires
      );

      const evaluatedMacro = evaluatedComps.find(c => c.id === 'macro1');
      expect(evaluatedMacro.state.outputs?.out1).toBe(1);
    });
  });

  describe('3-to-8 Decoder (DEC38)', () => {
    const decoder = COMPONENT_REGISTRY.DEC38;

    test('Contains complete 8-output pin definitions y0-y7', () => {
      const pinIds = decoder.pins.map(p => p.id);
      expect(pinIds).toContain('y0');
      expect(pinIds).toContain('y1');
      expect(pinIds).toContain('y2');
      expect(pinIds).toContain('y3');
      expect(pinIds).toContain('y4');
      expect(pinIds).toContain('y5');
      expect(pinIds).toContain('y6');
      expect(pinIds).toContain('y7');
    });

    test('Decodes 3-bit binary addresses to 1-of-8 active line', () => {
      // 000 -> Y0
      expect(decoder.calculateState({ a0: 0, a1: 0, a2: 0 })).toMatchObject({ activeLine: 0, y0: 1, y1: 0, y7: 0 });
      // 011 -> Y3
      expect(decoder.calculateState({ a0: 1, a1: 1, a2: 0 })).toMatchObject({ activeLine: 3, y3: 1, y0: 0, y7: 0 });
      // 100 -> Y4
      expect(decoder.calculateState({ a0: 0, a1: 0, a2: 1 })).toMatchObject({ activeLine: 4, y4: 1, y0: 0, y5: 0 });
      // 111 -> Y7
      expect(decoder.calculateState({ a0: 1, a1: 1, a2: 1 })).toMatchObject({ activeLine: 7, y7: 1, y0: 0, y6: 0 });
    });
  });

  describe('Analog Models: OPAMP, DIODE, RESISTOR', () => {
    test('OPAMP comparator saturation & output calculation', () => {
      const opamp = COMPONENT_REGISTRY.OPAMP;
      // Vpos > Vneg -> saturated high (+5V, output 1)
      const resHigh = opamp.calculateState({ nonInv: 3.0, inv: 2.0, vcc: 5.0, vee: 0.0 });
      expect(resHigh.vout).toBe(5.0);
      expect(resHigh.output).toBe(1);
      expect(resHigh.saturated).toBe(true);

      // Vpos < Vneg -> saturated low (0V, output 0)
      const resLow = opamp.calculateState({ nonInv: 1.0, inv: 3.5, vcc: 5.0, vee: 0.0 });
      expect(resLow.vout).toBe(0.0);
      expect(resLow.output).toBe(0);
      expect(resLow.saturated).toBe(true);
    });

    test('DIODE forward conduction & reverse cutoff', () => {
      const diode = COMPONENT_REGISTRY.DIODE;
      // Anode HIGH, Cathode LOW -> Conducting with 0.7V forward drop
      const conductingState = diode.calculateState({ anode: 1, cathode: 0 });
      expect(conductingState.conducting).toBe(true);
      expect(conductingState.output).toBe(1);
      expect(conductingState.cathodeVoltage).toBe(4.3);

      // Anode LOW -> Cutoff
      const cutoffState = diode.calculateState({ anode: 0, cathode: 0 });
      expect(cutoffState.conducting).toBe(false);
      expect(cutoffState.output).toBe(0);
    });

    test('RESISTOR linear transmission', () => {
      const resistor = COMPONENT_REGISTRY.RESISTOR;
      const res = resistor.calculateState({ t1: 1 });
      expect(res.output).toBe(1);
      expect(res.t2).toBe(1);
      expect(res.inVoltage).toBe(5.0);
    });
  });

  describe('Short-Circuit / Wire Conflict Detection', () => {
    test('Flags conflict when opposing logic levels drive the same node', () => {
      const components = [
        { id: 'vcc1', type: 'VCC', state: {} },
        { id: 'gnd1', type: 'GND', state: {} },
        { id: 'led1', type: 'LED', state: {}, pins: [{ id: 'in', direction: 'input' }] }
      ];
      const wires = [
        { id: 'w1', fromCompId: 'vcc1', fromPin: 'out', toCompId: 'led1', toPin: 'in' },
        { id: 'w2', fromCompId: 'gnd1', fromPin: 'out', toCompId: 'led1', toPin: 'in' }
      ];

      const { components: evaluatedComps, wires: evaluatedWires } = evaluateCircuitTopology(components, wires);
      const targetComp = evaluatedComps.find(c => c.id === 'led1');
      expect(targetComp.state.shortCircuit).toBe(true);
      expect(evaluatedWires.some(w => w.conflict)).toBe(true);
    });
  });

  describe('Topological Convergence Loop (Deep Propagation)', () => {
    test('Propagates through a multi-stage logic chain in a single simulation run', () => {
      // 4-stage inverter chain: SW -> NOT1 -> NOT2 -> NOT3 -> LED
      const components = [
        { id: 'sw', type: 'SWITCH', state: { active: true }, pins: [{ id: 'out', direction: 'output' }] },
        { id: 'not1', type: 'NOT', state: { output: 0 }, pins: [{ id: 'inA', direction: 'input' }, { id: 'outY', direction: 'output' }] },
        { id: 'not2', type: 'NOT', state: { output: 1 }, pins: [{ id: 'inA', direction: 'input' }, { id: 'outY', direction: 'output' }] },
        { id: 'not3', type: 'NOT', state: { output: 0 }, pins: [{ id: 'inA', direction: 'input' }, { id: 'outY', direction: 'output' }] },
        { id: 'led', type: 'LED', state: { active: true }, pins: [{ id: 'in', direction: 'input' }] }
      ];
      const wires = [
        { id: 'w1', fromCompId: 'sw', fromPin: 'out', toCompId: 'not1', toPin: 'inA' },
        { id: 'w2', fromCompId: 'not1', fromPin: 'outY', toCompId: 'not2', toPin: 'inA' },
        { id: 'w3', fromCompId: 'not2', fromPin: 'outY', toCompId: 'not3', toPin: 'inA' },
        { id: 'w4', fromCompId: 'not3', fromPin: 'outY', toCompId: 'led', toPin: 'in' }
      ];

      // SW=1 -> NOT1=0 -> NOT2=1 -> NOT3=0 -> LED=false
      const { components: evaluatedComps } = evaluateCircuitTopology(components, wires);
      const not1 = evaluatedComps.find(c => c.id === 'not1');
      const not2 = evaluatedComps.find(c => c.id === 'not2');
      const not3 = evaluatedComps.find(c => c.id === 'not3');
      const led = evaluatedComps.find(c => c.id === 'led');

      expect(not1.state.output).toBe(0);
      expect(not2.state.output).toBe(1);
      expect(not3.state.output).toBe(0);
      expect(led.state.active).toBe(false);
    });
  });

});
