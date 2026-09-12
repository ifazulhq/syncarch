import React, { useState, useEffect } from 'react';
import { X, GitCommit, GitBranch, History, RotateCcw, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function VersionHistoryModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  components,
  wires,
  onRestoreCanvas,
  onToast
}) {
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    async function fetchCheckpoints() {
      setLoading(true);
      const token = localStorage.getItem('syncarch_token');
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/checkpoints`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCheckpoints(data.checkpoints || []);
        }
      } catch (err) {
        console.warn('Error fetching checkpoints:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCheckpoints();
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleCreateCheckpoint = async (e) => {
    e.preventDefault();
    if (!versionLabel.trim() || !projectId) return;

    setIsCreating(true);
    const token = localStorage.getItem('syncarch_token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/checkpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          version_label: versionLabel.trim(),
          description: description.trim(),
          circuit_data: { components, wires }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCheckpoints((prev) => [
          {
            id: data.checkpointId,
            project_id: projectId,
            version_label: versionLabel.trim(),
            description: description.trim(),
            created_at: new Date().toISOString()
          },
          ...prev
        ]);
        setVersionLabel('');
        setDescription('');
        if (onToast) onToast(`Checkpoint "${versionLabel.trim()}" saved successfully!`);
      }
    } catch (err) {
      console.error('Failed to create checkpoint:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreCheckpoint = async (checkpointId, label) => {
    if (!window.confirm(`Are you sure you want to restore canvas topology to "${label}"? Any unsaved changes will be overwritten.`)) {
      return;
    }

    const token = localStorage.getItem('syncarch_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/checkpoints/${checkpointId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.circuit_data) {
          onRestoreCanvas(data.circuit_data.components || [], data.circuit_data.wires || []);
          if (onToast) onToast(`Canvas topology restored to "${label}"`);
          onClose();
        }
      }
    } catch (err) {
      console.error('Failed to restore checkpoint:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono">Project Checkpoints & Version History</h2>
              <p className="text-xs text-slate-400 font-mono">{projectTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Create New Checkpoint Form */}
          <form onSubmit={handleCreateCheckpoint} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 font-mono">
            <div className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
              <GitCommit className="w-4 h-4" />
              <span>SAVE NEW VERSION CHECKPOINT</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="e.g. v1.0 - Initial schematic layout"
                required
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description (e.g. Added 4-bit Counter)"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !versionLabel.trim() || !projectId}
              className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? 'Creating Checkpoint...' : 'Save Version Checkpoint'}</span>
            </button>
          </form>

          {/* Timeline List of Checkpoints */}
          <div className="space-y-3 font-mono">
            <div className="text-xs font-bold text-slate-400 tracking-wider">VERSION TIMELINE</div>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500 animate-pulse">Loading checkpoints...</div>
            ) : checkpoints.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No checkpoints created yet. Save your first version snapshot above!
              </div>
            ) : (
              <div className="space-y-3">
                {checkpoints.map((cp) => (
                  <div
                    key={cp.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 p-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                          <span>{cp.version_label}</span>
                        </div>
                        {cp.description && <p className="text-[11px] text-slate-400 mt-0.5">{cp.description}</p>}
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(cp.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreCheckpoint(cp.id, cp.version_label)}
                      className="interactive-btn px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
