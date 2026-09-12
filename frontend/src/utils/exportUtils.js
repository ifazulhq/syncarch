import { generateArduinoSketch } from './firmwareGenerator';

/**
 * Trigger browser file download for Blob objects
 */
function downloadFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Sanitize filename string
 */
function getSafeFileName(title, suffix, extension) {
  const safe = (title || 'SyncArch_Circuit')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  return `${safe}_${suffix}.${extension}`;
}

/**
 * 1. Export Bill of Materials (BOM) as CSV File
 */
export function exportBOMCSV(components = [], projectTitle = 'My ECE Lab Circuit') {
  if (!components || components.length === 0) {
    throw new Error('Canvas is empty. Add components to export BOM.');
  }

  const timestamp = new Date().toLocaleString();
  let csvLines = [];

  csvLines.push(`"BILL OF MATERIALS - SYNCARCH REAL-TIME CIRCUIT LAB"`);
  csvLines.push(`"Project Title:","${projectTitle.replace(/"/g, '""')}"`);
  csvLines.push(`"Export Timestamp:","${timestamp}"`);
  csvLines.push(`"Total Components:","${components.length}"`);
  csvLines.push('');

  // Group components by type
  const typeMap = {};
  components.forEach((comp) => {
    const typeName = comp.label || comp.type || 'Generic Block';
    if (!typeMap[typeName]) {
      typeMap[typeName] = { count: 0, ids: [] };
    }
    typeMap[typeName].count += 1;
    typeMap[typeName].ids.push(comp.id);
  });

  csvLines.push(`"BOM SUMMARY BY COMPONENT TYPE"`);
  csvLines.push(`"Item #","Component Name / Type","Quantity","Component Instance IDs"`);
  
  let itemNum = 1;
  for (const [typeName, data] of Object.entries(typeMap)) {
    csvLines.push(`"${itemNum}","${typeName.replace(/"/g, '""')}","${data.count}","${data.ids.join(', ')}"`);
    itemNum++;
  }

  csvLines.push('');
  csvLines.push(`"DETAILED COMPONENT INVENTORY"`);
  csvLines.push(`"Component ID","Type / Label","Grid X","Grid Y","Pin Count","State / Configuration"`);

  components.forEach((comp) => {
    const id = comp.id || 'N/A';
    const label = comp.label || comp.type || 'Block';
    const x = comp.x ?? 0;
    const y = comp.y ?? 0;
    const pinCount = comp.pins ? comp.pins.length : 0;
    
    let stateStr = 'Standard';
    if (comp.state) {
      if (typeof comp.state === 'object') {
        const parts = [];
        for (const [k, v] of Object.entries(comp.state)) {
          if (k !== 'code') parts.push(`${k}=${v}`);
        }
        stateStr = parts.length > 0 ? parts.join(', ') : 'Default';
      } else {
        stateStr = String(comp.state);
      }
    }

    csvLines.push(`"${id}","${label.replace(/"/g, '""')}","${x}","${y}","${pinCount}","${stateStr.replace(/"/g, '""')}"`);
  });

  const csvContent = csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = getSafeFileName(projectTitle, 'BOM', 'csv');
  downloadFile(blob, fileName);
}

/**
 * 2. Export Canvas Snapshot as SVG File
 */
export function exportCanvasSVG(components = [], wires = [], projectTitle = 'My ECE Lab Circuit') {
  if ((!components || components.length === 0) && (!wires || wires.length === 0)) {
    throw new Error('Canvas is empty. Add components or wires to export SVG.');
  }

  // Calculate bounding box of canvas contents
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  components.forEach((c) => {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x + 300);
    maxY = Math.max(maxY, c.y + 200);
  });

  if (minX === Infinity) {
    minX = 0; minY = 0; maxX = 1200; maxY = 800;
  } else {
    minX = Math.max(0, minX - 60);
    minY = Math.max(0, minY - 90);
    maxX = maxX + 60;
    maxY = maxY + 60;
  }

  const width = Math.max(800, maxX - minX);
  const height = Math.max(600, maxY - minY);

  // Try serializing existing SVG wire layer DOM element if present
  let wirePathsSvg = '';
  const svgEl = document.querySelector('.canvas-grid svg');
  if (svgEl) {
    wirePathsSvg = svgEl.innerHTML;
  }

  // Build standalone XML SVG String
  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" style="background-color: #020617; font-family: sans-serif;">
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#334155" />
    </pattern>
    <filter id="wireGlowActive" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Canvas Background -->
  <rect width="100%" height="100%" x="${minX}" y="${minY}" fill="#020617" />
  <rect width="100%" height="100%" x="${minX}" y="${minY}" fill="url(#grid)" opacity="0.6" />

  <!-- Title Banner Header -->
  <text x="${minX + 24}" y="${minY + 36}" fill="#38bdf8" font-size="22" font-weight="bold">${projectTitle.replace(/</g, '&lt;')}</text>
  <text x="${minX + 24}" y="${minY + 70}" fill="#94a3b8" font-size="12" font-family="monospace">SyncArch Real-Time Schematic Export • ${new Date().toLocaleDateString()}</text>

  <!-- Wire Layer -->
  <g class="wire-layer">
    ${wirePathsSvg}
  </g>

  <!-- Component Blocks -->
  <g class="components-layer">
`;

  components.forEach((c) => {
    const label = c.label || c.type || 'Block';
    const compX = c.x;
    const compY = c.y;    svgContent += `
    <g transform="translate(${compX}, ${compY})">
      <!-- Block Container -->
      <rect width="288" height="180" rx="16" fill="#0f172a" stroke="#334155" stroke-width="2" />
      <!-- Block Header -->
      <rect width="288" height="40" rx="16" fill="#1e293b" />
      <text x="16" y="26" fill="#f8fafc" font-size="13" font-weight="bold">${label.replace(/</g, '&lt;')}</text>
      <text x="272" y="26" fill="#38bdf8" font-size="10" font-family="monospace" text-anchor="end">${c.id}</text>
      <!-- Block Body Details -->
      <text x="16" y="70" fill="#94a3b8" font-size="11" font-family="monospace">Pos: (${c.x}, ${c.y})</text>
    `;

    if (c.pins) {
      const inputPins = c.pins.filter(p => p.direction === 'input');
      const outputPins = c.pins.filter(p => p.direction === 'output');

      inputPins.forEach((pin, idx) => {
        const pinX = 23;
        const pinY = 138 + (idx * 22);
        svgContent += `
        <circle cx="${pinX}" cy="${pinY}" r="7" fill="#0f172a" stroke="#06b6d4" stroke-width="2" />
        <text x="36" y="${pinY + 4}" fill="#94a3b8" font-size="11" font-family="monospace">${pin.name || pin.id}</text>
        `;
      });

      outputPins.forEach((pin, idx) => {
        const pinX = 265;
        const pinY = 138 + (idx * 22);
        svgContent += `
        <circle cx="${pinX}" cy="${pinY}" r="7" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
        <text x="252" y="${pinY + 4}" fill="#94a3b8" font-size="11" font-family="monospace" text-anchor="end">${pin.name || pin.id}</text>
        `;
      });
    }

    svgContent += `</g>`;
  });

  svgContent += `
  </g>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const fileName = getSafeFileName(projectTitle, 'schematic', 'svg');
  downloadFile(blob, fileName);
}

/**
 * 3. Export Canvas Snapshot as PNG File
 */
export function exportCanvasPNG(components = [], wires = [], projectTitle = 'My ECE Lab Circuit') {
  if ((!components || components.length === 0) && (!wires || wires.length === 0)) {
    throw new Error('Canvas is empty. Add components or wires to export PNG.');
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  components.forEach((c) => {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x + 320);
    maxY = Math.max(maxY, c.y + 220);
  });

  if (minX === Infinity) { minX = 0; minY = 0; maxX = 1200; maxY = 800; }
  else { minX = Math.max(0, minX - 60); minY = Math.max(0, minY - 90); maxX += 60; maxY += 60; }

  const width = Math.max(900, maxX - minX);
  const height = Math.max(650, maxY - minY);

  let wirePathsSvg = '';
  const svgEl = document.querySelector('.canvas-grid svg');
  if (svgEl) { wirePathsSvg = svgEl.innerHTML; }

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" style="background-color: #020617; font-family: sans-serif;">
    <rect width="100%" height="100%" x="${minX}" y="${minY}" fill="#020617" />
    <text x="${minX + 24}" y="${minY + 36}" fill="#38bdf8" font-size="22" font-weight="bold">${projectTitle.replace(/</g, '&lt;')}</text>
    <text x="${minX + 24}" y="${minY + 70}" fill="#94a3b8" font-size="12" font-family="monospace">SyncArch High-Res Snapshot • ${new Date().toLocaleDateString()}</text>
    <g class="wire-layer">${wirePathsSvg}</g>
    <g class="components-layer">`;

  components.forEach((c) => {
    const label = c.label || c.type || 'Block';
    svgContent += `
      <g transform="translate(${c.x}, ${c.y})">
        <rect width="288" height="180" rx="16" fill="#0f172a" stroke="#334155" stroke-width="2" />
        <rect width="288" height="40" rx="16" fill="#1e293b" />
        <text x="16" y="26" fill="#f8fafc" font-size="13" font-weight="bold">${label.replace(/</g, '&lt;')}</text>
        <text x="272" y="26" fill="#38bdf8" font-size="10" font-family="monospace" text-anchor="end">${c.id}</text>
        <text x="16" y="70" fill="#94a3b8" font-size="11" font-family="monospace">Pos: (${c.x}, ${c.y})</text>`;

    if (c.pins) {
      const inputPins = c.pins.filter(p => p.direction === 'input');
      const outputPins = c.pins.filter(p => p.direction === 'output');

      inputPins.forEach((pin, idx) => {
        const pinX = 23;
        const pinY = 138 + (idx * 22);
        svgContent += `
        <circle cx="${pinX}" cy="${pinY}" r="7" fill="#0f172a" stroke="#06b6d4" stroke-width="2" />
        <text x="36" y="${pinY + 4}" fill="#94a3b8" font-size="11" font-family="monospace">${pin.name || pin.id}</text>
        `;
      });

      outputPins.forEach((pin, idx) => {
        const pinX = 265;
        const pinY = 138 + (idx * 22);
        svgContent += `
        <circle cx="${pinX}" cy="${pinY}" r="7" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
        <text x="252" y="${pinY + 4}" fill="#94a3b8" font-size="11" font-family="monospace" text-anchor="end">${pin.name || pin.id}</text>
        `;
      });
    }
    svgContent += `</g>`;
  });
  svgContent += `</g></svg>`;

  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((blob) => {
      URL.revokeObjectURL(url);
      if (blob) {
        const fileName = getSafeFileName(projectTitle, 'schematic', 'png');
        downloadFile(blob, fileName);
      }
    }, 'image/png');
  };
  img.onerror = (err) => {
    URL.revokeObjectURL(url);
    console.error('PNG conversion failed:', err);
  };
  img.src = url;
}

/**
 * 4. Export PDF Circuit Summary Report
 */
export function exportPDFReport(components = [], wires = [], projectTitle = 'My ECE Lab Circuit', authUser = null) {
  const timestamp = new Date().toLocaleString();
  const authorName = authUser?.name || authUser?.email || 'SyncArch Circuit Engineer';
  const authorEmail = authUser?.email || 'collaborator@syncarch.io';

  const typeMap = {};
  components.forEach((comp) => {
    const typeName = comp.label || comp.type || 'Generic Block';
    if (!typeMap[typeName]) {
      typeMap[typeName] = { count: 0, ids: [] };
    }
    typeMap[typeName].count += 1;
    typeMap[typeName].ids.push(comp.id);
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups to generate PDF report.');
  }

  const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <title>${projectTitle} - SyncArch Circuit Report</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background: #ffffff; padding: 24px; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { margin: 0 0 6px 0; font-size: 24px; color: #0284c7; }
    .header p { margin: 2px 0; font-size: 12px; color: #64748b; font-family: monospace; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 16px; font-weight: bold; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 10px; margin-bottom: 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-card .num { font-size: 22px; font-weight: bold; color: #0284c7; }
    .stat-card .label { font-size: 11px; color: #64748b; font-weight: 500; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background-color: #f1f5f9; color: #334155; font-weight: 600; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${projectTitle}</h1>
      <p><strong>Engineer:</strong> ${authorName} (${authorEmail})</p>
      <p><strong>Generated:</strong> ${timestamp}</p>
    </div>
    <div>
      <span class="badge">SyncArch Real-Time Lab Report</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Circuit Statistics</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="num">${components.length}</div>
        <div class="label">Total Components</div>
      </div>
      <div class="stat-card">
        <div class="num">${wires.length}</div>
        <div class="label">Active Wires</div>
      </div>
      <div class="stat-card">
        <div class="num">${Object.keys(typeMap).length}</div>
        <div class="label">Unique Types</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Bill of Materials (BOM Summary)</div>
    <table>
      <thead>
        <tr>
          <th>Item #</th>
          <th>Component Name / Type</th>
          <th>Quantity</th>
          <th>Component Instance IDs</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(typeMap).map(([typeName, data], index) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${typeName}</strong></td>
            <td>${data.count}</td>
            <td><code>${data.ids.join(', ')}</code></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Detailed Component Inventory</div>
    <table>
      <thead>
        <tr>
          <th>Component ID</th>
          <th>Type / Label</th>
          <th>Position (X, Y)</th>
          <th>Pin Count</th>
        </tr>
      </thead>
      <tbody>
        ${components.map((c) => `
          <tr>
            <td><code>${c.id}</code></td>
            <td>${c.label || c.type}</td>
            <td>(${c.x}, ${c.y})</td>
            <td>${c.pins ? c.pins.length : 0} Pins</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    SyncArch Engineering Report • Generated automatically via SyncArch Client Engine
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(htmlDoc);
  printWindow.document.close();
}

/**
 * 5. Export Firmware (.ino) Sketch File
 */
export function exportFirmwareIno(components = [], wires = [], projectTitle = 'My ECE Lab Circuit', customCode = null) {
  const codeToExport = customCode || generateArduinoSketch(components, wires, projectTitle);
  const blob = new Blob([codeToExport], { type: 'text/x-c++src;charset=utf-8;' });
  const fileName = getSafeFileName(projectTitle, 'firmware', 'ino');
  downloadFile(blob, fileName);
}

/**
 * 6. Generate lightweight base64 SVG snapshot data URL for project thumbnail
 */
export function generateCanvasThumbnailBase64(components = [], wires = [], projectTitle = 'Untitled Circuit') {
  if (!components || components.length === 0) {
    const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240" style="background:#090d16;"><rect width="100%" height="100%" fill="#090d16"/><circle cx="200" cy="120" r="40" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.3"/><text x="200" y="125" fill="#38bdf8" font-size="12" font-family="sans-serif" text-anchor="middle">SyncArch Circuit</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(defaultSvg)}`;
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  components.forEach((c) => {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x + 288);
    maxY = Math.max(maxY, c.y + 180);
  });

  minX = Math.max(0, minX - 40);
  minY = Math.max(0, minY - 40);
  const width = Math.max(500, maxX - minX + 40);
  const height = Math.max(350, maxY - minY + 40);

  let wirePathsSvg = '';
  const svgEl = document.querySelector('.canvas-grid svg');
  if (svgEl) {
    wirePathsSvg = svgEl.innerHTML;
  }

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="${minX} ${minY} ${width} ${height}" style="background-color: #090d16; font-family: monospace;">
    <rect width="100%" height="100%" x="${minX}" y="${minY}" fill="#090d16" />
    <g class="wire-layer">${wirePathsSvg}</g>
    <g class="components-layer">`;

  components.forEach((c) => {
    const label = c.label || c.type || 'Block';
    svgContent += `
      <g transform="translate(${c.x}, ${c.y})">
        <rect width="288" height="180" rx="12" fill="#0f172a" stroke="#334155" stroke-width="2" />
        <rect width="288" height="36" rx="12" fill="#1e293b" />
        <text x="16" y="24" fill="#38bdf8" font-size="14" font-weight="bold">${label.replace(/</g, '&lt;')}</text>
      </g>`;
  });

  svgContent += `</g></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

/**
 * 7. PSpice / SPICE Netlist Generator & Exporter
 * Translates canvas topology into standard SPICE netlist syntax (.cir / .net)
 */
export function generateSpiceNetlist(components = [], wires = [], projectTitle = 'SyncArch Circuit') {
  const timestamp = new Date().toLocaleString();
  const title = (projectTitle || 'SyncArch Circuit').replace(/[\r\n]/g, ' ');

  // Map of pinKey -> nodeID
  const pinToNode = new Map();
  const parent = new Map();

  function sanitizeId(str) {
    return (str || 'node').replace(/[^a-zA-Z0-9_]/g, '_');
  }

  function getPinKey(compId, pinId) {
    return `${compId}:${pinId}`;
  }

  // Register all component pins in Union-Find
  components.forEach(comp => {
    const pins = comp.pins || [];
    pins.forEach(pin => {
      const key = getPinKey(comp.id, pin.id);
      parent.set(key, key);
    });
  });

  // Helper Union-Find functions
  function find(i) {
    if (!parent.has(i)) parent.set(i, i);
    if (parent.get(i) === i) return i;
    const root = find(parent.get(i));
    parent.set(i, root);
    return root;
  }

  function union(i, j) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent.set(rootI, rootJ);
    }
  }

  // Process wires to connect pins
  wires.forEach(wire => {
    const fromKey = getPinKey(wire.fromCompId, wire.fromPin);
    const toKey = getPinKey(wire.toCompId, wire.toPin);
    union(fromKey, toKey);
  });

  // Group pinKeys by root
  const rootGroups = new Map();
  parent.forEach((_, pinKey) => {
    const root = find(pinKey);
    if (!rootGroups.has(root)) {
      rootGroups.set(root, []);
    }
    rootGroups.get(root).push(pinKey);
  });

  // Assign Node IDs: 0 for Ground, N1, N2, N3... for active nets
  let nextNodeNumber = 1;
  const rootToNodeId = new Map();

  // First check if group contains GND
  rootGroups.forEach((pinKeys, root) => {
    const isGroundNet = pinKeys.some(key => {
      const lower = key.toLowerCase();
      return lower.includes('gnd') || lower.includes('ground') || lower.includes('0v');
    });
    if (isGroundNet) {
      rootToNodeId.set(root, '0');
    }
  });

  // Assign N1, N2, N3 to remaining groups
  rootGroups.forEach((_, root) => {
    if (!rootToNodeId.has(root)) {
      rootToNodeId.set(root, `N${nextNodeNumber}`);
      nextNodeNumber++;
    }
  });

  // Map individual pinKey -> Node ID
  parent.forEach((_, pinKey) => {
    const root = find(pinKey);
    pinToNode.set(pinKey, rootToNodeId.get(root) || `N_${sanitizeId(pinKey)}`);
  });

  // Helper to get Node ID for a specific pin
  function getNode(compId, pinId) {
    const key = getPinKey(compId, pinId);
    if (pinToNode.has(key)) return pinToNode.get(key);
    
    if (pinId && pinId.toLowerCase().includes('gnd')) return '0';
    
    const newRoot = find(key);
    if (!rootToNodeId.has(newRoot)) {
      rootToNodeId.set(newRoot, `N${nextNodeNumber++}`);
    }
    const nId = rootToNodeId.get(newRoot);
    pinToNode.set(key, nId);
    return nId;
  }

  // Generate SPICE Netlist Header
  let lines = [];
  lines.push(`* SyncArch Generated Netlist - v1.0`);
  lines.push(`* Project: ${title}`);
  lines.push(`* Timestamp: ${timestamp}`);
  lines.push(`* Target Simulator: PSpice / LTspice / Ngspice`);
  lines.push(``);
  lines.push(`* ----------------------------------------------------------------------------`);
  lines.push(`* Circuit Elements & Subcircuits`);
  lines.push(`* ----------------------------------------------------------------------------`);

  const gateModelsUsed = new Set();
  let hasLed = false;

  // Process Components
  components.forEach(comp => {
    const compId = sanitizeId(comp.id);
    const type = (comp.type || '').toUpperCase();
    const state = comp.state || {};

    if (type === 'SWITCH' || type === 'VCC') {
      const outNode = getNode(comp.id, 'out') || getNode(comp.id, 'vcc') || 'N1';
      const voltage = state.active === false ? 0 : 5;
      lines.push(`V_${compId} ${outNode} 0 DC ${voltage}`);
    } else if (type === 'CLOCK') {
      const outNode = getNode(comp.id, 'out') || 'N1';
      lines.push(`V_${compId} ${outNode} 0 PULSE(0 5 0 1n 1n 5m 10m)`);
    } else if (type === 'GND') {
      // Ground node is 0, handled in graph
    } else if (type === 'LED') {
      hasLed = true;
      const inNode = getNode(comp.id, 'in') || 'N1';
      const internalNode = `N_led_${compId}`;
      lines.push(`* Status LED Subcircuit for ${comp.id}`);
      lines.push(`R_${compId} ${inNode} ${internalNode} 330`);
      lines.push(`D_${compId} ${internalNode} 0 DLED`);
    } else if (['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'].includes(type)) {
      const inANode = getNode(comp.id, 'inA') || '0';
      const inBNode = getNode(comp.id, 'inB') || '0';
      const outYNode = getNode(comp.id, 'outY') || '0';

      let icModel = '7408';
      if (type === 'AND') icModel = '7408';
      else if (type === 'OR') icModel = '7432';
      else if (type === 'NOT') icModel = '7404';
      else if (type === 'NAND') icModel = '7400';
      else if (type === 'NOR') icModel = '7402';
      else if (type === 'XOR') icModel = '7486';
      else if (type === 'XNOR') icModel = '74266';

      gateModelsUsed.add(icModel);

      if (type === 'NOT') {
        lines.push(`X_${compId} ${inANode} ${outYNode} ${icModel}`);
      } else {
        lines.push(`X_${compId} ${inANode} ${inBNode} ${outYNode} ${icModel}`);
      }
    } else if (type === 'RESISTOR') {
      const n1 = getNode(comp.id, 't1') || 'N1';
      const n2 = getNode(comp.id, 't2') || '0';
      const resVal = state.resistance || '1k';
      lines.push(`R_${compId} ${n1} ${n2} ${resVal}`);
    } else if (type === 'CAPACITOR') {
      const n1 = getNode(comp.id, 't1') || 'N1';
      const n2 = getNode(comp.id, 't2') || '0';
      const capVal = state.capacitance || '10u';
      lines.push(`C_${compId} ${n1} ${n2} ${capVal}`);
    } else if (type === 'DIODE') {
      const anode = getNode(comp.id, 'anode') || 'N1';
      const cathode = getNode(comp.id, 'cathode') || '0';
      lines.push(`D_${compId} ${anode} ${cathode} 1N4148`);
    } else {
      // Generic component fallback
      const pinNodes = (comp.pins || []).map(p => getNode(comp.id, p.id));
      const nodesStr = pinNodes.length > 0 ? pinNodes.join(' ') : 'N1 0';
      lines.push(`X_${compId} ${nodesStr} ${type}`);
    }
  });

  // Subcircuit & Model Definitions
  lines.push(``);
  lines.push(`* ----------------------------------------------------------------------------`);
  lines.push(`* Subcircuit & Component Models`);
  lines.push(`* ----------------------------------------------------------------------------`);

  if (hasLed) {
    lines.push(`.model DLED D(Is=1e-14 Rs=10 N=1.8 Cjo=10p Vj=0.75 M=0.333 Eg=1.11 Cpar=2p)`);
  }
  lines.push(`.model 1N4148 D(Is=2.52n Rs=0.568 N=1.752 Cjo=4p Vj=0.5 M=0.333)`);

  const modelDefinitions = {
    '7408': `.subckt 7408 A B Y\nA1 [A B] Y AND_GATE\n.model AND_GATE d_and(rise_delay=1n fall_delay=1n)\n.ends 7408`,
    '7432': `.subckt 7432 A B Y\nA1 [A B] Y OR_GATE\n.model OR_GATE d_or(rise_delay=1n fall_delay=1n)\n.ends 7432`,
    '7404': `.subckt 7404 A Y\nA1 A Y NOT_GATE\n.model NOT_GATE d_inverter(rise_delay=1n fall_delay=1n)\n.ends 7404`,
    '7400': `.subckt 7400 A B Y\nA1 [A B] Y NAND_GATE\n.model NAND_GATE d_nand(rise_delay=1n fall_delay=1n)\n.ends 7400`,
    '7402': `.subckt 7402 A B Y\nA1 [A B] Y NOR_GATE\n.model NOR_GATE d_nor(rise_delay=1n fall_delay=1n)\n.ends 7402`,
    '7486': `.subckt 7486 A B Y\nA1 [A B] Y XOR_GATE\n.model XOR_GATE d_xor(rise_delay=1n fall_delay=1n)\n.ends 7486`,
    '74266': `.subckt 74266 A B Y\nA1 [A B] Y XNOR_GATE\n.model XNOR_GATE d_xnor(rise_delay=1n fall_delay=1n)\n.ends 74266`
  };

  gateModelsUsed.forEach(ic => {
    if (modelDefinitions[ic]) {
      lines.push(modelDefinitions[ic]);
    }
  });

  lines.push(``);
  lines.push(`.END`);

  return lines.join('\n');
}

/**
 * Export PSpice / SPICE Netlist File (.cir)
 */
export function exportSpiceNetlist(components = [], wires = [], projectTitle = 'My ECE Lab Circuit') {
  const netlist = generateSpiceNetlist(components, wires, projectTitle);
  const blob = new Blob([netlist], { type: 'text/plain;charset=utf-8;' });
  const fileName = getSafeFileName(projectTitle, 'export', 'cir');
  downloadFile(blob, fileName);
}

