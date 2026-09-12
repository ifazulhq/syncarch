import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Clock, X, Cpu, ArrowRight, Trash2 } from 'lucide-react';

export default function ProjectsModal({ isOpen, onClose, projects, loading, onSelectProject }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">My Saved Circuits</h3>
              <p className="text-xs text-slate-400">Select a project to load onto the canvas workspace</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Projects List Container */}
        <div className="p-6 max-h-[380px] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
              <p className="text-xs">Fetching saved circuits...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2 text-center">
              <Cpu className="w-10 h-10 text-slate-600 mb-1" />
              <p className="text-sm font-medium text-slate-300">No Saved Circuits Yet</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Build your logic design on canvas and click 'Save Circuit' in the top header to store it.
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="group flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/40 transition">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition">
                      {project.title || 'Untitled Circuit'}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(project.updated_at.endsWith('Z') ? project.updated_at : project.updated_at + 'Z').toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-medium text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Load</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
