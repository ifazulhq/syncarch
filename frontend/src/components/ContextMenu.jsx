import React, { useEffect, useRef } from 'react';
import { RotateCw, Copy, Trash2 } from 'lucide-react';

export default function ContextMenu({ x, y, componentId, onRotate, onDuplicate, onDelete, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust menu position if near screen edge
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const menuWidth = 192; // 12rem = w-48
  const menuHeight = 130;

  const adjustedX = x + menuWidth > screenWidth ? Math.max(10, x - menuWidth) : x;
  const adjustedY = y + menuHeight > screenHeight ? Math.max(10, y - menuHeight) : y;

  return (
    <div
      ref={menuRef}
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`
      }}
      className="fixed z-[150] w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl p-1.5 text-slate-200 text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800 mb-1">
        Component Actions
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRotate(componentId);
          onClose();
        }}
        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center space-x-2.5 transition text-slate-200 hover:text-cyan-300 cursor-pointer"
      >
        <RotateCw className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>Rotate 90°</span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate(componentId);
          onClose();
        }}
        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center space-x-2.5 transition text-slate-200 hover:text-emerald-300 cursor-pointer"
      >
        <Copy className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Duplicate</span>
      </button>

      <div className="my-1 border-t border-slate-800"></div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(componentId);
          onClose();
        }}
        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-950/50 flex items-center space-x-2.5 transition text-rose-400 hover:text-rose-300 cursor-pointer"
      >
        <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
        <span>Delete</span>
      </button>
    </div>
  );
}
