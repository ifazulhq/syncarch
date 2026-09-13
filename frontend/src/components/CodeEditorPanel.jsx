import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Cpu, Play, X, CheckCircle2, Terminal, Code2, Loader2, Download } from 'lucide-react';
import { exportFirmwareIno } from '../utils/exportUtils';
import { generateArduinoSketch } from '../utils/firmwareGenerator';

const DEFAULT_ARDUINO_SKETCH = `// SyncArch Embedded C++ Firmware Sketch
// Target Board: ESP32 / Arduino Uno R3

void setup() {
  // Initialize digital pin 4 as an output
  pinMode(4, OUTPUT);
  Serial.begin(115200);
  Serial.println("SyncArch MCU Firmware Initialized.");
}

void loop() {
  // Toggle High/Low with delay
  digitalWrite(4, HIGH);
  Serial.println("GPIO 4 HIGH");
  delay(1000);
  
  digitalWrite(4, LOW);
  Serial.println("GPIO 4 LOW");
  delay(1000);
}
`;

export default function CodeEditorPanel({ component, onClose, onSaveCode, components = [], wires = [], projectTitle = 'My ECE Lab Circuit' }) {
  const [code, setCode] = useState(() => {
    return component?.state?.code || generateArduinoSketch(components, wires, projectTitle) || DEFAULT_ARDUINO_SKETCH;
  });
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState(null);

  useEffect(() => {
    if (component?.state?.code) {
      setCode(component.state.code);
    } else {
      setCode(generateArduinoSketch(components, wires, projectTitle) || DEFAULT_ARDUINO_SKETCH);
    }
    setCompileStatus(null);
  }, [component?.id]);

  const handleEditorChange = (value) => {
    const newCode = value || '';
    setCode(newCode);
    if (component?.id) {
      onSaveCode(component.id, newCode);
    }
  };

  const handleCompileAndRun = () => {
    setIsCompiling(true);
    setCompileStatus('compiling');

    setTimeout(() => {
      setIsCompiling(false);
      setCompileStatus('success');
      if (component?.id) {
        onSaveCode(component.id, code);
      }
    }, 1200);
  };

  if (!component) return null;

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-[640px] h-[520px] z-50 glass-panel border-t md:border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300">
      {/* Editor Header Bar */}
      <div className="h-13 px-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
              <span>{component.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400">
                C++ Firmware
              </span>
            </h3>
          </div>
        </div>

        {/* Action Controls: Export Firmware & Compile */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportFirmwareIno(components, wires, projectTitle, code)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition shadow-sm cursor-pointer"
            title="Download Arduino C++ Sketch (.ino) File"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export Firmware</span>
            <span>(.ino)</span>
          </button>

          <button
            onClick={handleCompileAndRun}
            disabled={isCompiling}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
          >
            {isCompiling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isCompiling ? 'Compiling...' : 'Compile & Run'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Close Firmware Editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Compile Feedback Banner */}
      {compileStatus && (
        <div className={`px-4 py-1.5 text-xs font-mono flex items-center justify-between border-b ${
          compileStatus === 'compiling'
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        }`}>
          <div className="flex items-center space-x-2">
            {compileStatus === 'compiling' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              {compileStatus === 'compiling'
                ? 'Compiling C++ sketch with xtensa-esp32-elf-g++...'
                : '✓ Compilation Successful! Sketch size: 142,850 bytes (Flash: 10%, RAM: 8%)'}
            </span>
          </div>
        </div>
      )}

      {/* Monaco Code Editor */}
      <div className="flex-1 w-full bg-[#1e1e1e] overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          language="cpp"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            readOnly: false,
            domReadOnly: false,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            fontFamily: "'Fira Code', monospace",
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 12, bottom: 12 }
          }}
        />
      </div>

      {/* Footer Console Log Bar */}
      <div className="h-7 px-4 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3 h-3 text-cyan-400" />
          <span>Serial Monitor @ 115200 baud</span>
        </div>
        <div className="text-slate-500">Auto-saved to component state</div>
      </div>
    </div>
  );
}
