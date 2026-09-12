import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Users, Wifi, WifiOff, Zap, LogIn, LogOut, UserCheck, ChevronDown, Save, Folder, Pencil, Check, Settings, Share2, Download, FileSpreadsheet, Image, FileText, Code2, GitBranch, Globe, X } from 'lucide-react';
import { exportBOMCSV, exportCanvasSVG, exportCanvasPNG, exportPDFReport, exportFirmwareIno, exportSpiceNetlist } from '../utils/exportUtils';

export default function UserPresence({
  users,
  myUser,
  isConnected,
  componentCount,
  wireCount,
  authUser,
  onOpenAuth,
  onLogout,
  onSaveCircuit,
  onOpenMyCircuits,
  isSaving,
  projectTitle,
  onUpdateTitle,
  onOpenSettings,
  onShareRoom,
  onOpenVersionHistory,
  onTogglePublish,
  onPublishCircuit,
  isPublic = false,
  components = [],
  wires = [],
  onToast
}) {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectTitle || 'My ECE Lab Circuit');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState(projectTitle || 'My ECE Lab Circuit');
  const [publishTags, setPublishTags] = useState('#Sequential-Logic, #Logic-Gates');
  const profileMenuRef = useRef(null);

  const handleConfirmPublish = () => {
    setIsPublishModalOpen(false);
    if (publishTitle.trim() && onUpdateTitle) {
      onUpdateTitle(publishTitle.trim());
    }
    if (onPublishCircuit) {
      onPublishCircuit(publishTitle.trim(), publishTags);
    } else if (onTogglePublish) {
      onTogglePublish();
    }
  };

  // Click-Outside Hook: Close profile menu when user clicks anywhere outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (isProfileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleExport = (type) => {
    setIsExportOpen(false);
    try {
      if (type === 'csv') {
        exportBOMCSV(components, projectTitle);
        if (onToast) onToast({ type: 'success', text: '📊 Bill of Materials (BOM.csv) downloaded!' });
      } else if (type === 'svg') {
        exportCanvasSVG(components, wires, projectTitle);
        if (onToast) onToast({ type: 'success', text: '🖼️ Schematic snapshot (.svg) downloaded!' });
      } else if (type === 'png') {
        exportCanvasPNG(components, wires, projectTitle);
        if (onToast) onToast({ type: 'success', text: '🎨 High-resolution PNG snapshot downloaded!' });
      } else if (type === 'pdf') {
        exportPDFReport(components, wires, projectTitle, authUser);
        if (onToast) onToast({ type: 'success', text: '📄 Opening PDF report print preview...' });
      } else if (type === 'ino') {
        exportFirmwareIno(components, wires, projectTitle);
        if (onToast) onToast({ type: 'success', text: '⚡ Arduino C++ Firmware sketch (.ino) downloaded!' });
      } else if (type === 'cir') {
        exportSpiceNetlist(components, wires, projectTitle);
        if (onToast) onToast({ type: 'success', text: '⚡ PSpice netlist circuit file (.cir) downloaded!' });
      }
    } catch (err) {
      console.error('Export error:', err);
      if (onToast) onToast({ type: 'error', text: `⚠️ ${err.message}` });
    }
  };

  const handleStartEditing = () => {
    setTempTitle(projectTitle || 'My ECE Lab Circuit');
    setIsEditingTitle(true);
  };

  const handleCommitTitle = () => {
    setIsEditingTitle(false);
    const trimmed = tempTitle.trim();
    if (trimmed && trimmed !== projectTitle) {
      if (onUpdateTitle) onUpdateTitle(trimmed);
      if (onSaveCircuit) onSaveCircuit(trimmed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommitTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTempTitle(projectTitle || 'My ECE Lab Circuit');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 glass-panel z-[100] px-3 sm:px-4 py-1.5 flex flex-nowrap items-center justify-between gap-2 border-b border-slate-800 text-slate-100">
      {/* Brand & Editable Circuit Title Group */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
          <Cpu className="w-4 h-4 text-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <h1 className="font-extrabold text-sm tracking-wide text-white">SyncArch</h1>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hidden xs:inline">
              v1.0
            </span>
          </div>

          {/* Editable Project Title */}
          <div className="flex items-center space-x-1">
            {isEditingTitle ? (
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleCommitTitle}
                  autoFocus
                  className="px-1.5 py-0.5 text-xs font-semibold text-cyan-300 bg-slate-900 border border-cyan-500/80 rounded-md outline-none focus:ring-1 focus:ring-cyan-400 max-w-[110px] sm:max-w-[160px]"
                  placeholder="Enter title..."
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleCommitTitle(); }}
                  className="p-0.5 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 cursor-pointer"
                  title="Save title"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartEditing}
                className="group flex items-center space-x-1 px-1 py-0.5 rounded hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 cursor-pointer transition"
                title="Click to rename circuit project"
              >
                <span className="text-xs font-semibold text-slate-300 group-hover:text-cyan-300 transition max-w-[100px] sm:max-w-[150px] lg:max-w-[200px] truncate">
                  {projectTitle || 'My ECE Lab Circuit'}
                </span>
                <Pencil className="w-2.5 h-2.5 text-slate-500 group-hover:text-cyan-400 transition opacity-80 group-hover:opacity-100 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Group 1 & 2 Consolidated Actions Bar with Responsive Icon Fallbacks */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onSaveCircuit}
          disabled={isSaving}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-cyan-300 hover:text-cyan-200 transition shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
          title="Save Circuit to Cloud Database"
        >
          {isSaving ? (
            <span className="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin shrink-0"></span>
          ) : (
            <Save className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          )}
          <span className="hidden sm:inline">Save</span>
          <span className="hidden lg:inline"> Circuit</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition shadow-sm cursor-pointer"
            title="Export Circuit Documentation & Snapshots"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {isExportOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl py-1 z-[110]">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                Documentation & Export Tools
              </div>
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold">Export BOM (CSV)</div>
                  <div className="text-[10px] text-slate-400">Component inventory spreadsheet</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('svg')}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2.5 transition cursor-pointer"
              >
                <Image className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-semibold">Export Snapshot (SVG)</div>
                  <div className="text-[10px] text-slate-400">Scalable vector graphic</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('png')}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2.5 transition cursor-pointer"
              >
                <Image className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-semibold">Export Snapshot (PNG)</div>
                  <div className="text-[10px] text-slate-400">High-resolution raster image</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2.5 transition border-t border-slate-800 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="font-semibold">Export PDF Report</div>
                  <div className="text-[10px] text-slate-400">Full printable documentation</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('ino')}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2.5 transition border-t border-slate-800 cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold">Export Firmware (.ino)</div>
                  <div className="text-[10px] text-slate-400">Flashable Arduino C++ sketch</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('cir')}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2.5 transition border-t border-slate-800 cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="font-semibold">Export to PSpice (.cir)</div>
                  <div className="text-[10px] text-slate-400">SPICE netlist circuit simulation</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Version History Checkpoints Button */}
        <button
          onClick={onOpenVersionHistory}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-amber-300 hover:text-amber-200 transition shadow-sm cursor-pointer shrink-0"
          title="Git-like Version History & Checkpoints"
        >
          <GitBranch className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden lg:inline">Version History</span>
        </button>

        {/* Share Room Button */}
        <button
          onClick={onShareRoom}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-500/40 hover:to-indigo-500/40 border border-cyan-500/40 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition shadow-sm cursor-pointer shrink-0"
          title="Copy Shareable Collaboration Room Link"
        >
          <Share2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* My Circuits Button */}
        <button
          onClick={onOpenMyCircuits}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition shadow-sm cursor-pointer shrink-0"
          title="View & Load Saved Circuits"
        >
          <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="hidden md:inline">My Circuits</span>
        </button>

        {/* Toggle Publish Button */}
        <button
          onClick={() => {
            setPublishTitle(projectTitle || 'My ECE Lab Circuit');
            setIsPublishModalOpen(true);
          }}
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition shadow-sm cursor-pointer shrink-0 ${
            isPublic
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
          }`}
          title="Publish Circuit to Community Marketplace"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden lg:inline">{isPublic ? 'Public' : 'Publish'}</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-amber-300 hover:text-amber-200 transition shadow-sm cursor-pointer shrink-0"
          title="Settings & Customization"
        >
          <Settings className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden xl:inline">Settings</span>
        </button>
      </div>

      {/* Center Circuit Stats Pill */}
      <div className="hidden lg:flex items-center space-x-3 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-300 shrink-0">
        <div className="flex items-center space-x-1">
          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{componentCount} Blocks</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
        <div className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-ping shrink-0"></span>
          <span>{wireCount} Active Wires</span>
        </div>
      </div>

      {/* Right Side: Active Collaborators & Connection Badge */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Connection Status Badge */}
        <div className={`flex items-center space-x-1.5 text-[11px] px-2.5 py-1 rounded-full border shrink-0 ${
          isConnected 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          {isConnected ? <Wifi className="w-3 h-3 shrink-0" /> : <WifiOff className="w-3 h-3 shrink-0" />}
          <span className="font-medium hidden md:inline">{isConnected ? 'Live Sync' : 'Offline'}</span>
        </div>

        {/* User Avatars List */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="flex -space-x-2 overflow-visible py-1">
            {users.map((user) => {
              const isMe = user.id === myUser?.id;
              const avatarUrl = isMe ? (authUser?.picture || authUser?.avatar || user.picture) : user.picture;
              const displayName = isMe ? (authUser?.given_name || authUser?.displayName || authUser?.name || authUser?.email?.split('@')[0] || user.name) : (user.name || user.email?.split('@')[0] || 'Collaborator');
              const userEmail = isMe ? authUser?.email : user.email;
              const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

              return (
                <div key={user.id} className="relative group cursor-pointer">
                  {/* Profile Picture or Initial Badge */}
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-slate-900 shadow-md transition-transform group-hover:scale-110 group-hover:z-20"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white border-2 border-slate-900 shadow-md transition-transform group-hover:scale-110 group-hover:z-20 ${avatarUrl ? 'hidden' : 'flex'}`}
                    style={{ backgroundColor: user.color || '#38bdf8' }}
                  >
                    {initial}
                  </div>

                  {/* Online indicator dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 z-20"></span>

                  {/* Personalized Hover Card / Tooltip */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none transition-all duration-200">
                    <div className="w-2.5 h-2.5 bg-slate-900 border-t border-l border-cyan-500/40 rotate-45 -mb-1 z-10"></div>
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-xl p-3 shadow-2xl min-w-[180px] max-w-[240px] text-center space-y-1.5">
                      <div className="relative mx-auto w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-400/50 shadow-md">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center font-bold text-sm text-white"
                            style={{ backgroundColor: user.color || '#38bdf8' }}
                          >
                            {initial}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100 truncate">{displayName}</p>
                        {userEmail && <p className="text-[10px] text-cyan-400 font-mono truncate">{userEmail}</p>}
                      </div>
                      <div className="pt-1 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{isMe ? 'Active (You)' : 'Collaborating Live'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center text-xs text-slate-400 font-mono px-2 py-1 rounded bg-slate-800/80">
            <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>{users.length}</span>
          </div>
        </div>

        {/* Auth Button / User Profile Dropdown Menu */}
        <div className="relative pl-2 border-l border-slate-800" ref={profileMenuRef}>
          {authUser ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-9 h-9 p-0 rounded-full overflow-hidden bg-slate-900 hover:bg-slate-800 border-2 border-cyan-500/40 hover:border-cyan-400/80 transition cursor-pointer flex items-center justify-center shadow-md shrink-0"
                title={`Account Profile (${authUser.given_name || authUser.name || authUser.email})`}
              >
                {authUser.picture || authUser.avatar ? (
                  <img
                    src={authUser.picture || authUser.avatar}
                    alt={authUser.given_name || authUser.name || authUser.email}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}

                <div
                  className={`w-full h-full rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white ${
                    (authUser.picture || authUser.avatar) ? 'hidden' : 'flex'
                  }`}
                >
                  {authUser.given_name
                    ? authUser.given_name.charAt(0).toUpperCase()
                    : authUser.email
                    ? authUser.email.charAt(0).toUpperCase()
                    : 'U'}
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-xl shadow-2xl p-1.5 z-[110] animate-in fade-in zoom-in-95 duration-150">
                  {/* Read-only Header: User Name & Email */}
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Signed in as</p>
                    <p className="text-xs font-bold text-slate-100 truncate mt-0.5">
                      {authUser.given_name || authUser.displayName || authUser.name || 'SyncArch Engineer'}
                    </p>
                    <p className="text-[11px] text-cyan-400 font-mono truncate">{authUser.email}</p>
                  </div>

                  {/* Menu Item 1: Workspace Dashboard */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/90 flex items-center space-x-2.5 transition cursor-pointer"
                  >
                    <Folder className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Workspace Dashboard</span>
                  </button>

                  {/* Menu Item 2: Preferences */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onOpenSettings) onOpenSettings();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/90 flex items-center space-x-2.5 transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Preferences</span>
                  </button>

                  {/* Menu Item 3: Red Sign Out */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2.5 transition border-t border-slate-800/80 mt-1 pt-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 border border-cyan-400/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Publish Circuit Schematic Modal Overlay */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 relative">
            {/* Close Button */}
            <button
              onClick={() => setIsPublishModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title Header */}
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Publish Circuit to Marketplace</h3>
                <p className="text-xs text-slate-400">Share your schematic with the engineering community</p>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Circuit Title
                </label>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 font-semibold"
                  placeholder="e.g. 4-Bit Synchronous Binary Counter"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Tags & Categories (comma separated)
                </label>
                <input
                  type="text"
                  value={publishTags}
                  onChange={(e) => setPublishTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 font-mono"
                  placeholder="#Sequential-Logic, #Logic-Gates, #Arduino"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPublish}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 border border-cyan-400/30 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Confirm Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
