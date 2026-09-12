import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, Copy, Layers, Cpu, Heart, ExternalLink, ArrowLeft, User, Sparkles, CheckCircle2 } from 'lucide-react';

import { API_BASE_URL } from '../config';

export default function CommunityPage({ authUser, onOpenAuth }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewProject, setPreviewProject] = useState(null);
  const [cloningId, setCloningId] = useState(null);

  useEffect(() => {
    async function fetchCommunityProjects() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/community/projects`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.warn('Error fetching community projects:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCommunityProjects();
  }, []);

  const handleCloneProject = async (proj) => {
    const token = localStorage.getItem('syncarch_token');
    if (!token || !authUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setCloningId(proj.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/community/projects/${proj.id}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.projectId) {
          navigate(`/lab/${data.projectId}`);
        }
      }
    } catch (err) {
      console.error('Failed to clone project:', err);
    } finally {
      setCloningId(null);
    }
  };

  const [selectedTag, setSelectedTag] = useState('All');
  const availableTags = ['All', '#Sequential-Logic', '#Shift-Registers', '#Arduino', '#Logic-Gates', '#Microcontroller'];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.author_name && p.author_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tags && p.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag === 'All' || (p.tags && p.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-8">
        {/* Header Navigation & Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="interactive-btn p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <Globe className="w-6 h-6 text-cyan-400" />
                <h1 className="text-2xl font-bold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                  Community Schematic Marketplace
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Explore open-source electronics schematics, microcontroller code, and logic topologies created by engineers worldwide.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schematics, tags, author..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Tag Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-mono text-slate-500 mr-1">Filter by Tag:</span>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition cursor-pointer border ${
                selectedTag === tag
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-md shadow-cyan-950/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Project Grid View */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono text-sm animate-pulse">
            Loading community schematics marketplace...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-16 rounded-2xl glass-panel border border-slate-800 text-center font-mono space-y-3">
            <Globe className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">
              {searchQuery || selectedTag !== 'All' ? 'No Matching Schematics' : 'No Schematics Published Yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery || selectedTag !== 'All' ? 'Try adjusting your search or tag filters.' : 'Be the first engineer to publish your schematic design! Open any saved project in the simulator lab and click "Publish to Community".'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => {
              let circuitObj = { components: [], wires: [] };
              try {
                circuitObj = typeof proj.circuit_data === 'string' ? JSON.parse(proj.circuit_data) : proj.circuit_data;
              } catch (e) {}

              const compCount = circuitObj.components?.length || 0;
              const wireCount = circuitObj.wires?.length || 0;

              return (
                <div
                  key={proj.id}
                  className="rounded-2xl glass-panel p-5 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group space-y-4 shadow-xl"
                >
                  {/* Card Header: Author & Visual Thumbnail */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {proj.author_picture ? (
                          <img src={proj.author_picture} alt={proj.author_name} className="w-7 h-7 rounded-full border border-cyan-500/50" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold border border-cyan-500/40">
                            {proj.author_name ? proj.author_name[0].toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-slate-200 font-mono">{proj.author_name || 'Anonymous Engineer'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{new Date(proj.updated_at).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono text-[10px]">
                        PUBLIC
                      </span>
                    </div>

                    {/* Thumbnail Image */}
                    <div className="w-full h-32 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative group-hover:border-cyan-500/30 transition">
                      {proj.thumbnail ? (
                        <img src={proj.thumbnail} alt={proj.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 text-slate-600">
                          <Cpu className="w-8 h-8 text-cyan-500/40 mb-1" />
                          <span className="text-[10px] font-mono text-slate-500">Community Schematic</span>
                        </div>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 font-mono transition">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-sans line-clamp-2 mt-1">
                        {proj.description || 'Open-source interactive circuit topology built in SyncArch.'}
                      </p>
                    </div>

                    {/* Tag Badges */}
                    {proj.tags && (
                      <div className="flex flex-wrap gap-1">
                        {proj.tags.split(',').map((t, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-cyan-400 border border-slate-700/80">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Topology Stats */}
                    <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 pt-1">
                      <span className="flex items-center space-x-1">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{compCount} Comps</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{wireCount} Wires</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewProject(proj)}
                      className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 font-semibold transition cursor-pointer text-center"
                    >
                      Inspect BOM
                    </button>
                    <button
                      onClick={() => handleCloneProject(proj)}
                      disabled={cloningId === proj.id}
                      className="interactive-btn px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{cloningId === proj.id ? 'Cloning...' : 'Clone to Lab'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOM Preview Modal */}
      {previewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-xl rounded-2xl glass-panel border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 font-mono">{previewProject.title} — BOM Overview</h2>
              <button onClick={() => setPreviewProject(null)} className="p-1 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto font-mono text-xs">
              <p className="text-slate-400">{previewProject.description || 'No detailed description provided.'}</p>
              
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900 text-slate-400 text-[11px]">
                    <tr>
                      <th className="p-3 border-b border-slate-800">Component Type</th>
                      <th className="p-3 border-b border-slate-800">Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {(() => {
                      let cObj = { components: [] };
                      try { cObj = JSON.parse(previewProject.circuit_data); } catch(e){}
                      return (cObj.components || []).map((c, i) => (
                        <tr key={i}>
                          <td className="p-3 text-cyan-400 font-bold">{c.type}</td>
                          <td className="p-3">{c.label || c.name || 'Component'}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
              <button
                onClick={() => {
                  handleCloneProject(previewProject);
                  setPreviewProject(null);
                }}
                className="interactive-btn px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold font-mono text-xs"
              >
                Clone to My Lab Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
