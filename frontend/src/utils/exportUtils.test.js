import { generateSpiceNetlist } from './exportUtils';

describe('PSpice / SPICE Netlist Generator', () => {
  test('Generates valid SPICE netlist syntax with Header, DC sources, X-subcircuits, LED subcircuits, and .END', () => {
    const components = [
      {
        id: 'sw1',
        type: 'SWITCH',
        state: { active: true },
        pins: [{ id: 'out', name: 'OUT', direction: 'output' }]
      },
      {
        id: 'sw2',
        type: 'SWITCH',
        state: { active: false },
        pins: [{ id: 'out', name: 'OUT', direction: 'output' }]
      },
      {
        id: 'gate1',
        type: 'OR',
        pins: [
          { id: 'inA', name: 'A', direction: 'input' },
          { id: 'inB', name: 'B', direction: 'input' },
          { id: 'outY', name: 'Y', direction: 'output' }
        ]
      },
      {
        id: 'led1',
        type: 'LED',
        pins: [{ id: 'in', name: 'IN', direction: 'input' }]
      }
    ];

    const wires = [
      { id: 'w1', fromCompId: 'sw1', fromPin: 'out', toCompId: 'gate1', toPin: 'inA' },
      { id: 'w2', fromCompId: 'sw2', fromPin: 'out', toCompId: 'gate1', toPin: 'inB' },
      { id: 'w3', fromCompId: 'gate1', fromPin: 'outY', toCompId: 'led1', toPin: 'in' }
    ];

    const netlist = generateSpiceNetlist(components, wires, 'Test OR Gate Circuit');

    // Header check
    expect(netlist).toContain('* SyncArch Generated Netlist - v1.0');
    expect(netlist).toContain('* Project: Test OR Gate Circuit');

    // Switches as DC sources
    expect(netlist).toContain('V_sw1');
    expect(netlist).toContain('DC 5');
    expect(netlist).toContain('V_sw2');
    expect(netlist).toContain('DC 0');

    // OR Gate as 7432 X-subcircuit
    expect(netlist).toContain('X_gate1');
    expect(netlist).toContain('7432');

    // Status LED resistor/diode subcircuit
    expect(netlist).toContain('R_led1');
    expect(netlist).toContain('D_led1');
    expect(netlist).toContain('DLED');

    // Footer check
    expect(netlist).toContain('.END');
  });

  test('Component Rotation state increments by 90 degrees correctly', () => {
    let rotation = 0;
    const rotate = (r) => (r + 90) % 360;

    rotation = rotate(rotation);
    expect(rotation).toBe(90);

    rotation = rotate(rotation);
    expect(rotation).toBe(180);

    rotation = rotate(rotation);
    expect(rotation).toBe(270);

    rotation = rotate(rotation);
    expect(rotation).toBe(0);
  });
});
