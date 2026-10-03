/**
 * SyncArch C++ Firmware Generator
 * Translates canvas circuit topology into a valid Arduino/ESP32 C++ (.ino) sketch.
 * Traverses actual net connections between MCU pins, switches, logic gates, and outputs
 * to generate accurate boolean expressions in C++ for the microcontroller.
 */

export function generateArduinoSketch(components = [], wires = [], projectTitle = 'My ECE Lab Circuit') {
  const timestamp = new Date().toLocaleString();
  const safeTitle = (projectTitle || 'My ECE Lab Circuit').replace(/[\r\n"]/g, ' ');

  // 1. Identify Component Types
  const mcus = components.filter(c => c.type === 'ESP32' || c.type === 'ARDUINO');
  const switches = components.filter(c => c.type === 'SWITCH');
  const clocks = components.filter(c => c.type === 'CLOCK');
  const leds = components.filter(c => c.type === 'LED');
  const gates = components.filter(c => [
    'AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR',
    'HALF_ADDER', 'FULL_ADDER', 'MUX21'
  ].includes(c.type));
  const flipFlops = components.filter(c => ['DFF', 'JKFF', 'TFF', 'SR_LATCH'].includes(c.type));

  // 2. Build Adjacency Connection Graph:
  // Map an input terminal (compId:pinId) to its driver source (fromCompId:fromPin)
  const getDriver = (targetCompId, targetPinId) => {
    // Direct forward wires (from output -> to input)
    const forwardWire = wires.find(w => w.toCompId === targetCompId && w.toPin === targetPinId);
    if (forwardWire) {
      return { compId: forwardWire.fromCompId, pinId: forwardWire.fromPin };
    }
    // Reverse-drawn wires (from input -> to output)
    const reverseWire = wires.find(w => w.fromCompId === targetCompId && w.fromPin === targetPinId);
    if (reverseWire) {
      return { compId: reverseWire.toCompId, pinId: reverseWire.toPin };
    }
    // Virtual Bus Net Labels
    const targetComp = components.find(c => c.id === targetCompId);
    const targetPin = targetComp?.pins?.find(p => p.id === targetPinId);
    const targetNet = targetPin?.netLabel || targetComp?.netLabels?.[targetPinId];
    if (targetNet) {
      for (const comp of components) {
        if (comp.id === targetCompId) continue;
        for (const pin of (comp.pins || [])) {
          const pinNet = pin.netLabel || comp.netLabels?.[pin.id];
          if (pinNet === targetNet && pin.direction === 'output') {
            return { compId: comp.id, pinId: pin.id };
          }
        }
      }
    }
    return null;
  };

  const pinDefs = [];
  const setupLines = [];
  const readInputLines = [];
  const logicLines = [];
  const writeOutputLines = [];
  const serialPrintLines = [];

  const switchVarMap = new Map();
  const clockVarMap = new Map();
  const ledVarMap = new Map();

  // 3. Register Switches as Microcontroller Digital Inputs
  switches.forEach((sw, idx) => {
    const pinNo = 4 + idx;
    const pinConst = `PIN_SW_${idx + 1}`;
    const varName = `sw_${idx + 1}`;
    switchVarMap.set(sw.id, varName);

    pinDefs.push(`const int ${pinConst} = ${pinNo}; // ${sw.label || sw.type} (${sw.id})`);
    setupLines.push(`  pinMode(${pinConst}, INPUT_PULLUP);`);
    readInputLines.push(`  bool ${varName} = (digitalRead(${pinConst}) == HIGH); // ${sw.label || sw.type}`);
  });

  // 4. Register Clocks
  clocks.forEach((clk, idx) => {
    const varName = `clk_${idx + 1}`;
    clockVarMap.set(clk.id, varName);
    readInputLines.push(`  bool ${varName} = ((millis() / 500) % 2 == 0); // 1Hz Clock: ${clk.label || clk.type}`);
  });

  // 5. Register Microcontroller Pins if an MCU block exists on the canvas
  mcus.forEach((mcu) => {
    (mcu.pins || []).forEach((pin) => {
      if (pin.type === 'digital') {
        const pinConst = `PIN_MCU_${pin.id}`;
        pinDefs.push(`const int ${pinConst} = ${pin.id.replace(/[^0-9]/g, '') || 13}; // ${mcu.label || mcu.type} ${pin.name}`);
        if (pin.direction === 'output') {
          setupLines.push(`  pinMode(${pinConst}, OUTPUT);`);
        } else {
          setupLines.push(`  pinMode(${pinConst}, INPUT);`);
          readInputLines.push(`  bool mcu_${pin.id.toLowerCase()} = (digitalRead(${pinConst}) == HIGH);`);
        }
      }
    });
  });

  // 6. Register LEDs as Microcontroller Digital Outputs
  leds.forEach((led, idx) => {
    const pinNo = 18 + idx;
    const pinConst = `PIN_LED_${idx + 1}`;
    const varName = `led_${idx + 1}`;
    ledVarMap.set(led.id, { pinConst, varName, pinNo });

    pinDefs.push(`const int ${pinConst} = ${pinNo}; // ${led.label || led.type} (${led.id})`);
    setupLines.push(`  pinMode(${pinConst}, OUTPUT);`);
  });

  // 7. Recursive Net Expression Builder:
  // Traverses backward from any target terminal through combinational logic gates
  const buildSignalExpr = (compId, pinId, visited = new Set()) => {
    const visitKey = `${compId}:${pinId}`;
    if (visited.has(visitKey)) {
      return 'false'; // Circular dependency safeguard
    }
    const newVisited = new Set(visited);
    newVisited.add(visitKey);

    const comp = components.find(c => c.id === compId);
    if (!comp) return 'false';

    // Base Sources
    if (comp.type === 'SWITCH') {
      return switchVarMap.get(comp.id) || 'false';
    }
    if (comp.type === 'CLOCK') {
      return clockVarMap.get(comp.id) || 'false';
    }
    if (comp.type === 'VCC') {
      return 'true';
    }
    if (comp.type === 'GND') {
      return 'false';
    }
    if (comp.type === 'ESP32' || comp.type === 'ARDUINO') {
      return `mcu_${pinId.toLowerCase()}`;
    }

    // Helper to resolve an input pin on this component
    const getGateInputExpr = (inPinId) => {
      const driver = getDriver(compId, inPinId);
      if (!driver) return 'false';
      return buildSignalExpr(driver.compId, driver.pinId, newVisited);
    };

    switch (comp.type) {
      case 'AND': {
        const a = getGateInputExpr('inA');
        const b = getGateInputExpr('inB');
        return `(${a} && ${b})`;
      }
      case 'OR': {
        const a = getGateInputExpr('inA');
        const b = getGateInputExpr('inB');
        return `(${a} || ${b})`;
      }
      case 'NOT': {
        const a = getGateInputExpr('inA');
        return `(!${a})`;
      }
      case 'NAND': {
        const a = getGateInputExpr('inA');
        const b = getGateInputExpr('inB');
        return `(!(${a} && ${b}))`;
      }
      case 'NOR': {
        const a = getGateInputExpr('inA');
        const b = getGateInputExpr('inB');
        return `(!(${a} || ${b}))`;
      }
      case 'XOR': {
        const a = getGateInputExpr('inA');
        const b = getGateInputExpr('inB');
        return `(${a} ^ ${b})`;
      }
      case 'XNOR': {
        const a = getGateInputExpr('inA');
        const b = getGateInputExpr('inB');
        return `(!(${a} ^ ${b}))`;
      }
      case 'HALF_ADDER': {
        const a = getGateInputExpr('inA');
        const b = getGateInputExpr('inB');
        return pinId === 'carry' ? `(${a} && ${b})` : `(${a} ^ ${b})`;
      }
      case 'FULL_ADDER': {
        const a = getGateInputExpr('inA');
        const b = getGateInputExpr('inB');
        const cin = getGateInputExpr('cin');
        return pinId === 'cout'
          ? `((${a} && ${b}) || (${cin} && (${a} ^ ${b})))`
          : `(${a} ^ ${b} ^ ${cin})`;
      }
      case 'MUX21': {
        const sel = getGateInputExpr('sel');
        const in0 = getGateInputExpr('in0');
        const in1 = getGateInputExpr('in1');
        return `(${sel} ? ${in1} : ${in0})`;
      }
      case 'DFF':
      case 'JKFF':
      case 'TFF':
      case 'SR_LATCH': {
        return `q_${comp.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      }
      default:
        return 'false';
    }
  };

  // 8. Traverse Topology to Generate Logic for LEDs / Outputs
  if (leds.length > 0) {
    leds.forEach((led) => {
      const ledInfo = ledVarMap.get(led.id);
      const driver = getDriver(led.id, 'in');

      let expr = 'false';
      if (driver) {
        expr = buildSignalExpr(driver.compId, driver.pinId);
      }

      logicLines.push(`  // Synthesized Topology Logic for ${led.label || 'LED'} (${led.id})`);
      logicLines.push(`  bool ${ledInfo.varName} = ${expr};`);
      writeOutputLines.push(`  digitalWrite(${ledInfo.pinConst}, ${ledInfo.varName} ? HIGH : LOW);`);
      serialPrintLines.push(`  Serial.print(F("${ledInfo.pinConst}: ")); Serial.println(${ledInfo.varName});`);
    });
  } else if (gates.length > 0) {
    // If no LEDs exist, find terminal gate outputs to compute
    gates.forEach((gate, gIdx) => {
      const outPins = (gate.pins || []).filter(p => p.direction === 'output');
      outPins.forEach(outPin => {
        const expr = buildSignalExpr(gate.id, outPin.id);
        const outVar = `gate_${gate.type.toLowerCase()}_${gIdx + 1}_${outPin.id}`;
        logicLines.push(`  // Net expression for ${gate.label || gate.type} (${gate.id}:${outPin.id})`);
        logicLines.push(`  bool ${outVar} = ${expr};`);
        serialPrintLines.push(`  Serial.print(F("${outVar}: ")); Serial.println(${outVar});`);
      });
    });
  }

  // 9. Handle Sequential Elements (DFF, JKFF, TFF)
  if (flipFlops.length > 0) {
    flipFlops.forEach((ff) => {
      const ffSafeId = ff.id.replace(/[^a-zA-Z0-9_]/g, '_');
      const qVar = `q_${ffSafeId}`;
      const prevClkVar = `prev_clk_${ffSafeId}`;
      const clkDriver = getDriver(ff.id, 'clk');
      const clkExpr = clkDriver ? buildSignalExpr(clkDriver.compId, clkDriver.pinId) : 'false';

      logicLines.push(`  // Sequential Flip-Flop: ${ff.label || ff.type} (${ff.id})`);
      logicLines.push(`  static bool ${qVar} = false;`);
      logicLines.push(`  static bool ${prevClkVar} = false;`);
      logicLines.push(`  bool cur_clk_${ffSafeId} = ${clkExpr};`);

      if (ff.type === 'DFF') {
        const dDriver = getDriver(ff.id, 'd');
        const dExpr = dDriver ? buildSignalExpr(dDriver.compId, dDriver.pinId) : 'false';
        logicLines.push(`  if (cur_clk_${ffSafeId} && !${prevClkVar}) { ${qVar} = ${dExpr}; }`);
      } else if (ff.type === 'TFF') {
        const tDriver = getDriver(ff.id, 't');
        const tExpr = tDriver ? buildSignalExpr(tDriver.compId, tDriver.pinId) : 'false';
        logicLines.push(`  if (cur_clk_${ffSafeId} && !${prevClkVar}) { if (${tExpr}) ${qVar} = !${qVar}; }`);
      } else if (ff.type === 'JKFF') {
        const jDriver = getDriver(ff.id, 'j');
        const kDriver = getDriver(ff.id, 'k');
        const jExpr = jDriver ? buildSignalExpr(jDriver.compId, jDriver.pinId) : 'false';
        const kExpr = kDriver ? buildSignalExpr(kDriver.compId, kDriver.pinId) : 'false';
        logicLines.push(`  if (cur_clk_${ffSafeId} && !${prevClkVar}) {`);
        logicLines.push(`    if (${jExpr} && !${kExpr}) ${qVar} = true;`);
        logicLines.push(`    else if (!${jExpr} && ${kExpr}) ${qVar} = false;`);
        logicLines.push(`    else if (${jExpr} && ${kExpr}) ${qVar} = !${qVar};`);
        logicLines.push(`  }`);
      }
      logicLines.push(`  ${prevClkVar} = cur_clk_${ffSafeId};`);
      serialPrintLines.push(`  Serial.print(F("${qVar}: ")); Serial.println(${qVar});`);
    });
  }

  // 10. Fallback for Empty Schematic
  if (pinDefs.length === 0 && logicLines.length === 0) {
    pinDefs.push(`const int PIN_BUTTON = 4;      // Default Digital Input`);
    pinDefs.push(`const int PIN_STATUS_LED = 18; // Default Digital Output`);
    setupLines.push(`  pinMode(PIN_BUTTON, INPUT_PULLUP);`);
    setupLines.push(`  pinMode(PIN_STATUS_LED, OUTPUT);`);
    readInputLines.push(`  bool buttonState = (digitalRead(PIN_BUTTON) == LOW);`);
    writeOutputLines.push(`  digitalWrite(PIN_STATUS_LED, buttonState ? HIGH : LOW);`);
  }

  // 11. Assemble Sketch Template
  let sketch = `// ============================================================================
// SyncArch Real-Time ECE Lab - Topology-Aware Arduino C++ Firmware Sketch
// Project: ${safeTitle}
// Generated: ${timestamp}
// Target Platform: ESP32 / Arduino Uno R3 / ATmega328P
// ============================================================================

#include <Arduino.h>

// ----------------------------------------------------------------------------
// Pin Definitions derived from canvas circuit topology
// ----------------------------------------------------------------------------
${pinDefs.join('\n')}

// ----------------------------------------------------------------------------
// Microcontroller Hardware Initialization
// ----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 2000) { delay(10); } // Wait for USB Serial
  
  Serial.println(F("================================================="));
  Serial.println(F("⚡ SyncArch Topology-Aware MCU Firmware Initialized"));
  Serial.println(F("Project: ${safeTitle}"));
  Serial.println(F("================================================="));

${setupLines.join('\n')}
}

// ----------------------------------------------------------------------------
// Real-Time Simulation & Boolean Logic Execution Loop
// ----------------------------------------------------------------------------
void loop() {
  // 1. Read Inputs
${readInputLines.length > 0 ? readInputLines.join('\n') : '  // No external digital inputs configured'}

  // 2. Synthesized Combinational / Sequential Logic Evaluation
${logicLines.length > 0 ? logicLines.join('\n') : '  // No combinational logic configured'}

  // 3. Write Outputs
${writeOutputLines.length > 0 ? writeOutputLines.join('\n') : '  // No digital outputs configured'}

  // 4. Telemetry / Diagnostics
${serialPrintLines.length > 0 ? serialPrintLines.join('\n') : ''}

  delay(10); // 10ms Signal Sampling Rate (100Hz tick cycle)
}
`;

  return sketch;
}
