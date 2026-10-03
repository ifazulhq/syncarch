import { generateArduinoSketch } from './firmwareGenerator';

describe('Topology-Aware C++ Firmware Generator', () => {
  test('Traverses combinational net connections through gates to generate exact C++ boolean expressions', () => {
    const components = [
      { id: 'sw1', type: 'SWITCH', label: 'Switch A', pins: [{ id: 'out', direction: 'output' }] },
      { id: 'sw2', type: 'SWITCH', label: 'Switch B', pins: [{ id: 'out', direction: 'output' }] },
      { id: 'sw3', type: 'SWITCH', label: 'Switch C', pins: [{ id: 'out', direction: 'output' }] },
      {
        id: 'gate_and',
        type: 'AND',
        pins: [
          { id: 'inA', direction: 'input' },
          { id: 'inB', direction: 'input' },
          { id: 'outY', direction: 'output' }
        ]
      },
      {
        id: 'gate_or',
        type: 'OR',
        pins: [
          { id: 'inA', direction: 'input' },
          { id: 'inB', direction: 'input' },
          { id: 'outY', direction: 'output' }
        ]
      },
      { id: 'led1', type: 'LED', label: 'Output Indicator', pins: [{ id: 'in', direction: 'input' }] }
    ];

    const wires = [
      { fromCompId: 'sw1', fromPin: 'out', toCompId: 'gate_and', toPin: 'inA' },
      { fromCompId: 'sw2', fromPin: 'out', toCompId: 'gate_and', toPin: 'inB' },
      { fromCompId: 'gate_and', fromPin: 'outY', toCompId: 'gate_or', toPin: 'inA' },
      { fromCompId: 'sw3', fromPin: 'out', toCompId: 'gate_or', toPin: 'inB' },
      { fromCompId: 'gate_or', fromPin: 'outY', toCompId: 'led1', toPin: 'in' }
    ];

    const sketch = generateArduinoSketch(components, wires, 'Combinational Logic Test');

    // Header and platform verification
    expect(sketch).toContain('SyncArch Real-Time ECE Lab - Topology-Aware Arduino C++ Firmware Sketch');
    expect(sketch).toContain('Combinational Logic Test');

    // Pin definitions
    expect(sketch).toContain('const int PIN_SW_1 = 4;');
    expect(sketch).toContain('const int PIN_SW_2 = 5;');
    expect(sketch).toContain('const int PIN_SW_3 = 6;');
    expect(sketch).toContain('const int PIN_LED_1 = 18;');

    // Setup pinMode
    expect(sketch).toContain('pinMode(PIN_SW_1, INPUT_PULLUP);');
    expect(sketch).toContain('pinMode(PIN_LED_1, OUTPUT);');

    // Loop logic: Inputs read
    expect(sketch).toContain('bool sw_1 = (digitalRead(PIN_SW_1) == HIGH);');
    expect(sketch).toContain('bool sw_2 = (digitalRead(PIN_SW_2) == HIGH);');
    expect(sketch).toContain('bool sw_3 = (digitalRead(PIN_SW_3) == HIGH);');

    // Loop logic: Accurate synthesized boolean expression: ((sw_1 && sw_2) || sw_3)
    expect(sketch).toContain('bool led_1 = ((sw_1 && sw_2) || sw_3);');
    expect(sketch).toContain('digitalWrite(PIN_LED_1, led_1 ? HIGH : LOW);');
  });

  test('Correctly models NOT inverter logic', () => {
    const components = [
      { id: 'sw1', type: 'SWITCH', pins: [{ id: 'out', direction: 'output' }] },
      { id: 'not1', type: 'NOT', pins: [{ id: 'inA', direction: 'input' }, { id: 'outY', direction: 'output' }] },
      { id: 'led1', type: 'LED', pins: [{ id: 'in', direction: 'input' }] }
    ];

    const wires = [
      { fromCompId: 'sw1', fromPin: 'out', toCompId: 'not1', toPin: 'inA' },
      { fromCompId: 'not1', fromPin: 'outY', toCompId: 'led1', toPin: 'in' }
    ];

    const sketch = generateArduinoSketch(components, wires, 'NOT Gate Test');
    expect(sketch).toContain('bool led_1 = (!sw_1);');
  });

  test('Provides fallback for empty schematic', () => {
    const sketch = generateArduinoSketch([], [], 'Empty Project');
    expect(sketch).toContain('const int PIN_BUTTON = 4;');
    expect(sketch).toContain('const int PIN_STATUS_LED = 18;');
    expect(sketch).toContain('pinMode(PIN_BUTTON, INPUT_PULLUP);');
    expect(sketch).toContain('pinMode(PIN_STATUS_LED, OUTPUT);');
  });
});
