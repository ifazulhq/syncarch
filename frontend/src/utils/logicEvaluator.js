/**
 * Client-Side Boolean Logic Simulation Engine for SyncArch
 * Evaluates combinational & sequential logic state propagation across canvas topology
 */

import { COMPONENT_REGISTRY } from '../services/ComponentRegistry';

/**
 * Evaluates current canvas components & wires and returns updated states and active wire signals
 */
export function evaluateCircuitTopology(components = [], wires = []) {
  if (!components || components.length === 0) {
    return { components: [], wires: [] };
  }

  // Clone component state map to avoid direct mutation
  const compStateMap = {};
  const updatedComps = components.map((comp) => {
    const cloned = { ...comp, state: { ...(comp.state || {}) } };
    compStateMap[comp.id] = cloned;
    return cloned;
  });

  // Map wire signal sources
  // Build lookup of input signals: key = `${targetCompId}:${targetPinId}`, val = 0 or 1
  const pinInputValues = {};
  const activeWireIds = new Set();

  // First pass: Calculate output signals for source components
  const getPinOutputValue = (compId, pinId) => {
    const c = compStateMap[compId];
    if (!c) return 0;

    switch (c.type) {
      case 'SWITCH':
        return c.state?.active ? 1 : 0;
      case 'VCC':
        return 1;
      case 'GND':
        return 0;
      case 'CLOCK':
        return c.state?.signal ?? (c.state?.active ? 1 : 0);
      case 'NOT':
        return c.state?.output ?? 1;
      case 'AND':
      case 'OR':
      case 'NAND':
      case 'NOR':
      case 'XOR':
      case 'XNOR':
      case 'MUX21':
        return c.state?.output ?? 0;
      case 'HALF_ADDER':
        if (pinId === 'carry') return c.state?.carry ?? 0;
        return c.state?.sum ?? 0;
      case 'FULL_ADDER':
        if (pinId === 'cout') return c.state?.cout ?? 0;
        return c.state?.sum ?? 0;
      case 'DEMUX14':
      case 'DEC38':
        return c.state?.[pinId] ?? 0;
      case 'SR_LATCH':
      case 'DFF':
      case 'JKFF':
      case 'TFF':
        if (pinId === 'qBar') return c.state?.qBar ?? 1;
        return c.state?.q ?? 0;
      case 'SHIFT_REG_4BIT':
      case 'COUNTER_4BIT':
        return c.state?.[pinId] ?? 0;
      case 'ESP32':
        return c.state?.pinStates?.GPIO4 ?? 1;
      case 'ARDUINO':
        return c.state?.pinStates?.D2 ?? 1;
      case 'SUB_CIRCUIT':
        return c.state?.outputs?.[pinId] ?? c.state?.[pinId] ?? 0;
      default:
        return c.state?.output ?? (c.state?.active ? 1 : 0);
    }
  };

  // Net Label Resolver: Map net labels to their active logic signal values (0 or 1)
  const netLabelSignals = {};

  // Register output signals from pins with Net Labels
  updatedComps.forEach((c) => {
    if (c.pins) {
      c.pins.forEach((p) => {
        const netLabel = p.netLabel || c.netLabels?.[p.id];
        if (netLabel && p.direction === 'output') {
          const val = getPinOutputValue(c.id, p.id);
          if (val === 1) {
            netLabelSignals[netLabel] = 1;
          } else if (netLabelSignals[netLabel] === undefined) {
            netLabelSignals[netLabel] = 0;
          }
        }
      });
    }
  });

  // Evaluate physical wire signal propagation and update wire net labels
  wires.forEach((w) => {
    const val = getPinOutputValue(w.fromCompId, w.fromPin);
    const key = `${w.toCompId}:${w.toPin}`;

    // If wire itself has a net label or connects to a labeled pin, update net label signals
    const wireLabel = w.netLabel;
    if (wireLabel) {
      if (val === 1) {
        netLabelSignals[wireLabel] = 1;
      } else if (netLabelSignals[wireLabel] === undefined) {
        netLabelSignals[wireLabel] = 0;
      }
    }

    // Store highest signal if multiple wires connect to same pin
    if (val === 1) {
      pinInputValues[key] = 1;
      activeWireIds.add(w.id);
    } else if (pinInputValues[key] === undefined) {
      pinInputValues[key] = 0;
    }
  });

  // Apply virtual net label signal values to input pins with matching net labels
  updatedComps.forEach((c) => {
    if (c.pins) {
      c.pins.forEach((p) => {
        const netLabel = p.netLabel || c.netLabels?.[p.id];
        if (netLabel && p.direction === 'input') {
          const key = `${c.id}:${p.id}`;
          const netVal = netLabelSignals[netLabel];
          if (netVal === 1) {
            pinInputValues[key] = 1;
          } else if (pinInputValues[key] === undefined && netVal !== undefined) {
            pinInputValues[key] = netVal;
          }
        }
      });
    }
  });

  // Second pass: Evaluate logic for each component based on collected inputs
  updatedComps.forEach((comp) => {
    const reg = COMPONENT_REGISTRY[comp.type];
    if (!reg) return;

    // Collect inputs for this component
    const inputs = {};
    if (comp.pins) {
      comp.pins.forEach((p) => {
        if (p.direction === 'input') {
          const key = `${comp.id}:${p.id}`;
          inputs[p.id] = pinInputValues[key] ?? 0;
        }
      });
    }

    // Evaluate component specific logic
    if (reg.calculateState) {
      const newState = reg.calculateState(inputs, comp.state || {});
      comp.state = { ...comp.state, ...newState };
    } else {
      // Default evaluation for simple components
      if (comp.type === 'LED') {
        const inSignal = inputs.in ?? inputs.anode ?? 0;
        comp.state.active = inSignal === 1;
      } else if (comp.type === 'DFF') {
        const d = inputs.d ?? 0;
        const clk = inputs.clk ?? 0;
        const prevClk = comp.state.prevClk ?? 0;
        let q = comp.state.q ?? 0;
        let qBar = comp.state.qBar ?? 1;

        if (clk === 1 && prevClk === 0) { // Positive edge clock trigger
          q = d;
          qBar = d === 1 ? 0 : 1;
        }

        comp.state = { ...comp.state, d, clk, prevClk: clk, q, qBar };
      } else if (comp.type === 'JKFF') {
        const j = inputs.j ?? 0;
        const k = inputs.k ?? 0;
        const clk = inputs.clk ?? 0;
        const prevClk = comp.state.prevClk ?? 0;
        let q = comp.state.q ?? 0;
        let qBar = comp.state.qBar ?? 1;

        if (clk === 1 && prevClk === 0) {
          if (j === 1 && k === 1) { q = q === 1 ? 0 : 1; }
          else if (j === 1 && k === 0) { q = 1; }
          else if (j === 0 && k === 1) { q = 0; }
          qBar = q === 1 ? 0 : 1;
        }
        comp.state = { ...comp.state, j, k, clk, prevClk: clk, q, qBar };
      } else if (comp.type === 'TFF') {
        const t = inputs.t ?? 0;
        const clk = inputs.clk ?? 0;
        const prevClk = comp.state.prevClk ?? 0;
        let q = comp.state.q ?? 0;
        let qBar = comp.state.qBar ?? 1;

        if (clk === 1 && prevClk === 0) {
          if (t === 1) { q = q === 1 ? 0 : 1; }
          qBar = q === 1 ? 0 : 1;
        }
        comp.state = { ...comp.state, t, clk, prevClk: clk, q, qBar };
      } else if (comp.type === 'MUX21') {
        const i0 = inputs.i0 ?? 0;
        const i1 = inputs.i1 ?? 0;
        const sel = inputs.sel ?? 0;
        const output = sel === 1 ? i1 : i0;
        comp.state = { ...comp.state, i0, i1, sel, output };
      } else if (comp.type === 'SUB_CIRCUIT') {
        const sub = comp.subcircuit || comp.state?.subcircuit;
        if (sub && sub.components) {
          const internalComps = sub.components.map((ic) => {
            const cloned = { ...ic, state: { ...(ic.state || {}) } };
            return cloned;
          });

          // Inject external macro input signals as virtual input wires
          const virtualInputWires = [];
          if (comp.pins) {
            comp.pins.forEach((p) => {
              if (p.direction === 'input' && p.targetCompId) {
                const extVal = inputs[p.id] ?? 0;
                if (extVal === 1) {
                  virtualInputWires.push({
                    id: `vwire-${p.id}`,
                    fromCompId: '__ext_vcc__',
                    fromPin: 'vcc',
                    toCompId: p.targetCompId,
                    toPin: p.targetPin
                  });
                }
              }
            });
          }

          const subSourceComps = [
            ...internalComps,
            { id: '__ext_vcc__', type: 'VCC', state: {} }
          ];

          const { components: evaluatedSubComps, wires: evaluatedSubWires } = evaluateCircuitTopology(
            subSourceComps,
            [...(sub.wires || []), ...virtualInputWires]
          );

          const finalSubComps = evaluatedSubComps.filter((ic) => ic.id !== '__ext_vcc__');

          const outputs = {};
          if (comp.pins) {
            comp.pins.forEach((p) => {
              if (p.direction === 'output') {
                const targetComp = finalSubComps.find((ic) => ic.id === p.targetCompId);
                if (targetComp) {
                  outputs[p.id] = targetComp.state?.output ?? targetComp.state?.[p.targetPin] ?? (targetComp.state?.active ? 1 : 0);
                }
              }
            });
          }

          comp.state = {
            ...comp.state,
            outputs,
            subcircuit: { components: finalSubComps, wires: sub.wires || [] }
          };
        }
      }
    }
  });

  // Annotate wires with live signal status
  const updatedWires = wires.map((w) => ({
    ...w,
    active: activeWireIds.has(w.id) ? 1 : 0
  }));

  return {
    components: updatedComps,
    wires: updatedWires
  };
}
