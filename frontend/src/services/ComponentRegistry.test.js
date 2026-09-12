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

});
