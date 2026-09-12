/**
 * SyncArch C++ Firmware Generator
 * Translates canvas circuit topology into a valid Arduino/ESP32 C++ (.ino) sketch
 */

export function generateArduinoSketch(components = [], wires = [], projectTitle = 'My ECE Lab Circuit') {
  const timestamp = new Date().toLocaleString();
  
  // Find Microcontroller or Source Blocks
  const mcus = components.filter(c => c.type === 'ESP32' || c.type === 'ARDUINO');
  const switches = components.filter(c => c.type === 'SWITCH' || c.type === 'CLOCK' || c.type === 'VCC');
  const leds = components.filter(c => c.type === 'LED');
  const gates = components.filter(c => ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'XNOR'].includes(c.type));

  let sketch = `// ============================================================================
// SyncArch Real-Time ECE Lab - Auto-Generated Arduino C++ Firmware Sketch
// Project: ${projectTitle}
// Generated: ${timestamp}
// Target Platform: ESP32 / Arduino Uno R3 / ATmega328P
// ============================================================================

#include <Arduino.h>

// ----------------------------------------------------------------------------
// Pin Definitions derived from canvas circuit topology
// ----------------------------------------------------------------------------
`;

  const pinDefs = [];
  const setupLines = [];
  const loopLines = [];

  // Track connected pins
  let inputCount = 0;
  let outputCount = 0;

  // Process Switches (Digital Inputs)
  switches.forEach((sw, idx) => {
    const pinNo = 4 + idx;
    const varName = `PIN_INPUT_${idx + 1}`;
    pinDefs.push(`const int ${varName} = ${pinNo}; // ${sw.label || sw.type} (${sw.id})`);
    setupLines.push(`  pinMode(${varName}, INPUT_PULLUP);`);
    loopLines.push(`  int val_${idx + 1} = digitalRead(${varName});`);
    inputCount++;
  });

  // Process LEDs (Digital Outputs)
  leds.forEach((led, idx) => {
    const pinNo = 18 + idx;
    const varName = `PIN_LED_${idx + 1}`;
    pinDefs.push(`const int ${varName} = ${pinNo}; // ${led.label || led.type} (${led.id})`);
    setupLines.push(`  pinMode(${varName}, OUTPUT);`);
    outputCount++;
  });

  if (pinDefs.length === 0) {
    // Default fallback pin mappings if no specific switches/LEDs exist
    pinDefs.push(`const int PIN_BUTTON = 4;  // Default Digital Input`);
    pinDefs.push(`const int PIN_STATUS_LED = 18; // Default Digital Output`);
    setupLines.push(`  pinMode(PIN_BUTTON, INPUT_PULLUP);`);
    setupLines.push(`  pinMode(PIN_STATUS_LED, OUTPUT);`);
    loopLines.push(`  int buttonState = digitalRead(PIN_BUTTON);`);
    loopLines.push(`  digitalWrite(PIN_STATUS_LED, !buttonState);`);
  } else {
    // Logic propagation in loop
    if (leds.length > 0) {
      leds.forEach((led, idx) => {
        const varName = `PIN_LED_${idx + 1}`;
        if (inputCount > 0) {
          const inputVar = `val_${(idx % inputCount) + 1}`;
          loopLines.push(`  digitalWrite(${varName}, ${inputVar});`);
          loopLines.push(`  Serial.print("${varName}: "); Serial.println(${inputVar});`);
        } else {
          loopLines.push(`  digitalWrite(${varName}, HIGH);`);
        }
      });
    }
  }

  const safeTitle = (projectTitle || 'My ECE Lab Circuit').replace(/"/g, "'");

  sketch += pinDefs.join('\n') + '\n\n';

  sketch += `// ----------------------------------------------------------------------------
// Microcontroller Hardware Initialization
// ----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 2000) { delay(10); } // Wait for USB Serial
  
  Serial.println(F("================================================="));
  Serial.println(F("⚡ SyncArch C++ MCU Firmware Initialized"));
  Serial.println(F("Project: ${safeTitle}"));
  Serial.println(F("================================================="));

${setupLines.join('\n')}
}

// ----------------------------------------------------------------------------
// Real-Time Simulation & Signal Processing Loop
// ----------------------------------------------------------------------------
void loop() {
${loopLines.join('\n')}

  delay(10); // 10ms Signal Sampling Rate (100Hz tick cycle)
}
`;

  return sketch;
}
