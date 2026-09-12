import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { socket } from './services/socket';
import { API_BASE_URL } from './config';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import UserPresence from './components/UserPresence';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import CodeEditorPanel from './components/CodeEditorPanel';
import AIAssistant from './components/AIAssistant';
import AuthModal from './components/AuthModal';
import ProjectsModal from './components/ProjectsModal';
import SettingsModal from './components/SettingsModal';
import SubcircuitModal from './components/SubcircuitModal';
import VersionHistoryModal from './components/VersionHistoryModal';
import CommunityPage from './pages/CommunityPage';
import { createComponentInstance } from './services/ComponentRegistry';
import { playWireSnapSound, playComponentLockSound } from './utils/audioFeedback';
import { generateCanvasThumbnailBase64 } from './utils/exportUtils';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [myUser, setMyUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [locks, setLocks] = useState({});
  const [activeCodeComponent, setActiveCodeComponent] = useState(null);
  const [activeSubcircuitModalComp, setActiveSubcircuitModalComp] = useState(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isProjectPublic, setIsProjectPublic] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectTitle, setProjectTitle] = useState('My ECE Lab Circuit');
  const [userProjects, setUserProjects] = useState([]);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('syncarch_settings');
      return cached ? JSON.parse(cached) : {
        theme: 'dark',
        gridPattern: 'dots',
        clockSpeed: 100,
        animationGlow: true,
        customApiKey: '',
        displayName: '',
        bio: '',
        customAvatar: ''
      };
    } catch (e) {
      return {
        theme: 'dark',
        gridPattern: 'dots',
        clockSpeed: 100,
        animationGlow: true,
        customApiKey: '',
        displayName: '',
        bio: '',
        customAvatar: ''
      };
    }
  });
  const [authUser, setAuthUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('syncarch_user');
      const token = localStorage.getItem('syncarch_token');
      return savedUser && token ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      if (authUser) {
        socket.emit('user:identify', {
          email: authUser.email,
          name: authUser.name || authUser.email?.split('@')[0],
          picture: authUser.picture || authUser.avatar
        });
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onInitState(data) {
      setIsConnected(true);
      setMyUser(data.myUser);
      setUsers(data.users || []);
      setComponents(data.components || []);
      setWires(data.wires || []);
      setLocks(data.locks || {});
    }

    function onUserJoined(user) {
      setUsers((prev) => [...prev.filter((u) => u.id !== user.id), user]);
    }

    function onUserLeft({ socketId }) {
      setUsers((prev) => prev.filter((u) => u.id !== socketId));
    }

    function onCursorUpdated({ socketId, cursor }) {
      setUsers((prev) =>
        prev.map((u) => (u.id === socketId ? { ...u, cursor } : u))
      );
    }

    function onComponentLocked({ componentId, lock }) {
      setLocks((prev) => ({ ...prev, [componentId]: lock }));
    }

    function onComponentUnlocked({ componentId }) {
      setLocks((prev) => {
        const updated = { ...prev };
        delete updated[componentId];
        return updated;
      });
    }

    function onComponentMoved({ id, x, y }) {
      setComponents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, x, y } : c))
      );
    }

    function onComponentRotated({ id, rotation }) {
      setComponents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, rotation } : c))
      );
    }

    function onCanvasSync(data) {
      if (data.components) setComponents(data.components);
      if (data.wires) setWires(data.wires);
    }

    function onComponentDeleted({ id }) {
      setComponents((prev) => prev.filter((c) => c.id !== id));
      setWires((prev) => prev.filter((w) => w.fromCompId !== id && w.toCompId !== id));
      setLocks((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setActiveCodeComponent((prev) => (prev?.id === id ? null : prev));
    }

    function onRoomUsers({ users: roomUsers }) {
      if (roomUsers) setUsers(roomUsers);
    }

    const onPinNetLabel = ({ compId, pinId, netLabel }) => {
      setComponents((prev) =>
        prev.map((c) => {
          if (c.id === compId) {
            const netLabels = { ...(c.netLabels || {}), [pinId]: netLabel };
            const pins = c.pins ? c.pins.map((p) => (p.id === pinId ? { ...p, netLabel } : p)) : [];
            return { ...c, netLabels, pins };
          }
          return c;
        })
      );
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('init:state', onInitState);
    socket.on('user:joined', onUserJoined);
    socket.on('user:left', onUserLeft);
    socket.on('cursor:updated', onCursorUpdated);
    socket.on('component:locked', onComponentLocked);
    socket.on('component:unlocked', onComponentUnlocked);
    socket.on('component:moved', onComponentMoved);
    socket.on('component:rotated', onComponentRotated);
    socket.on('canvas:sync', onCanvasSync);
    socket.on('component:deleted', onComponentDeleted);
    socket.on('room:users', onRoomUsers);
    socket.on('pin:netlabel', onPinNetLabel);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('init:state', onInitState);
      socket.off('user:joined', onUserJoined);
      socket.off('user:left', onUserLeft);
      socket.off('cursor:updated', onCursorUpdated);
      socket.off('component:locked', onComponentLocked);
      socket.off('component:unlocked', onComponentUnlocked);
      socket.off('component:moved', onComponentMoved);
      socket.off('component:rotated', onComponentRotated);
      socket.off('canvas:sync', onCanvasSync);
      socket.off('component:deleted', onComponentDeleted);
      socket.off('room:users', onRoomUsers);
      socket.off('pin:netlabel', onPinNetLabel);
    };
  }, [authUser]);

  // Sync authenticated user profile details to socket server
  useEffect(() => {
    if (socket.connected && authUser) {
      socket.emit('user:identify', {
        email: authUser.email,
        name: authUser.name || authUser.email?.split('@')[0],
        picture: authUser.picture || authUser.avatar
      });
    }
  }, [authUser, isConnected]);

  // Fetch user settings from SQLite database on auth
  useEffect(() => {
    const token = localStorage.getItem('syncarch_token');
    if (!token || !authUser) return;

    async function fetchSettings() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
            localStorage.setItem('syncarch_settings', JSON.stringify(data.settings));
          }
        }
      } catch (e) {
        console.warn('Error fetching user settings:', e.message);
      }
    }
    fetchSettings();
  }, [authUser]);

  const handleUpdateSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('syncarch_settings', JSON.stringify(newSettings));
    } catch (e) {}

    const token = localStorage.getItem('syncarch_token');
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: newSettings })
      });
    } catch (e) {
      console.warn('Error updating user settings:', e.message);
    }
  }, []);

  // 1. Restore local draft canvas on page refresh if canvas is empty
  useEffect(() => {
    try {
      const draft = localStorage.getItem('syncarch_draft_canvas');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.components && parsed.components.length > 0 && components.length === 0) {
          setComponents(parsed.components);
          setWires(parsed.wires || []);
          if (parsed.currentProjectId) {
            setCurrentProjectId(parsed.currentProjectId);
          }
          if (parsed.projectTitle) {
            setProjectTitle(parsed.projectTitle);
          }
        }
      }
    } catch (e) {
      console.warn('Error restoring draft canvas from localStorage:', e);
    }
  }, []);

  // 2. Debounced auto-save & immediate client-side draft backup
  useEffect(() => {
    const token = localStorage.getItem('syncarch_token');

    // Always update local draft backup instantly
    if (components.length > 0 || wires.length > 0 || currentProjectId) {
      try {
        localStorage.setItem('syncarch_draft_canvas', JSON.stringify({
          currentProjectId,
          projectTitle,
          components,
          wires
        }));
      } catch (e) {}
    }

    if (!token || !authUser) return;
    if (components.length === 0 && wires.length === 0 && !currentProjectId) return;

    // Silent background auto-save to backend database (1.5s debounce)
    const timer = setTimeout(async () => {
      try {
        const circuitPayload = { components, wires };
        if (currentProjectId) {
          await fetch(`${API_BASE_URL}/api/projects/${currentProjectId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: projectTitle,
              circuit_data: circuitPayload
            })
          });
        } else if (components.length > 0) {
          const res = await fetch(`${API_BASE_URL}/api/projects`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: projectTitle,
              circuit_data: circuitPayload
            })
          });
          const data = await res.json();
          if (data.projectId) {
            setCurrentProjectId(data.projectId);
          }
        }
      } catch (err) {
        console.warn('Auto-save sync warning:', err.message);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [components, wires, currentProjectId, projectTitle, authUser]);

  // Handlers for canvas operations
  const handleLock = useCallback((componentId) => {
    playComponentLockSound();
    socket.emit('component:lock', { componentId });
  }, []);

  const handleUnlock = useCallback((componentId) => {
    socket.emit('component:unlock', { componentId });
  }, []);

  const handleMoveComponent = useCallback((id, x, y) => {
    // Update local state instantly for zero-latency feedback
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x, y } : c))
    );
    socket.emit('component:move', { id, x, y });
  }, []);

  const handleRotateComponent = useCallback((id) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newRot = ((c.rotation || 0) + 90) % 360;
          socket.emit('component:rotate', { id, rotation: newRot });
          return { ...c, rotation: newRot };
        }
        return c;
      })
    );
  }, []);

  const handleDuplicateComponent = useCallback((id) => {
    setComponents((prev) => {
      const target = prev.find((c) => c.id === id);
      if (!target) return prev;

      const newId = `${target.type.toLowerCase()}-${Date.now()}`;
      const duplicated = {
        ...JSON.parse(JSON.stringify(target)),
        id: newId,
        label: `${target.label || target.type} (Copy)`,
        x: target.x + 48,
        y: target.y + 48,
        rotation: target.rotation || 0
      };

      socket.emit('component:add', duplicated);
      return [...prev, duplicated];
    });
  }, []);

  const handleToggleState = useCallback((id, statePayload) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, state: { ...c.state, ...statePayload } } : c))
    );
    socket.emit('component:toggle', { id, state: statePayload });
  }, []);

  const handleUpdatePinNetLabel = useCallback((compId, pinId, netLabel) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id === compId) {
          const netLabels = { ...(c.netLabels || {}), [pinId]: netLabel };
          const pins = c.pins ? c.pins.map((p) => (p.id === pinId ? { ...p, netLabel } : p)) : [];
          return { ...c, netLabels, pins };
        }
        return c;
      })
    );
    socket.emit('pin:netlabel', { compId, pinId, netLabel });
  }, []);

  const handleCreateSubcircuit = useCallback((selectedCompIds) => {
    if (!selectedCompIds || selectedCompIds.length < 2) return;

    const selectedComps = components.filter((c) => selectedCompIds.includes(c.id));
    if (selectedComps.length === 0) return;

    const internalWires = wires.filter(
      (w) => selectedCompIds.includes(w.fromCompId) && selectedCompIds.includes(w.toCompId)
    );

    const avgX = Math.round(selectedComps.reduce((acc, c) => acc + c.x, 0) / selectedComps.length / 24) * 24;
    const avgY = Math.round(selectedComps.reduce((acc, c) => acc + c.y, 0) / selectedComps.length / 24) * 24;

    const macroPins = [];
    let inCount = 1;
    let outCount = 1;

    selectedComps.forEach((c) => {
      (c.pins || []).forEach((p) => {
        if (p.direction === 'input') {
          const pinId = `in${inCount}`;
          macroPins.push({
            id: pinId,
            name: p.name ? `${c.label || c.type}:${p.name}` : `IN ${inCount}`,
            direction: 'input',
            type: 'digital',
            targetCompId: c.id,
            targetPin: p.id
          });
          inCount++;
        } else if (p.direction === 'output') {
          const pinId = `out${outCount}`;
          macroPins.push({
            id: pinId,
            name: p.name ? `${c.label || c.type}:${p.name}` : `OUT ${outCount}`,
            direction: 'output',
            type: 'digital',
            targetCompId: c.id,
            targetPin: p.id
          });
          outCount++;
        }
      });
    });

    const macroComp = {
      id: `macro-${Date.now().toString(36)}`,
      type: 'SUB_CIRCUIT',
      label: `Macro (${selectedComps.length} Comps)`,
      x: avgX,
      y: avgY,
      pins: macroPins.length > 0 ? macroPins : [
        { id: 'in1', name: 'IN 1', type: 'digital', direction: 'input' },
        { id: 'out1', name: 'OUT 1', type: 'digital', direction: 'output' }
      ],
      subcircuit: {
        components: selectedComps,
        wires: internalWires
      },
      state: {
        subcircuit: {
          components: selectedComps,
          wires: internalWires
        }
      }
    };

    setComponents((prev) => [...prev.filter((c) => !selectedCompIds.includes(c.id)), macroComp]);
    setWires((prev) => prev.filter((w) => !selectedCompIds.includes(w.fromCompId) || !selectedCompIds.includes(w.toCompId)));

    setToastMessage(`Encapsulated ${selectedComps.length} components into Sub-circuit Macro!`);
    setTimeout(() => setToastMessage(null), 3000);
  }, [components, wires]);

  const handleAddComponent = useCallback((componentTypeOrObj) => {
    const newComp = typeof componentTypeOrObj === 'string'
      ? createComponentInstance(componentTypeOrObj)
      : (componentTypeOrObj.type ? createComponentInstance(componentTypeOrObj.type) : componentTypeOrObj);

    setComponents((prev) => [...prev.filter((c) => c.id !== newComp.id), newComp]);
    socket.emit('component:add', newComp);
  }, []);

  const handleDeleteComponent = useCallback((id) => {
    socket.emit('component:delete', { id });
  }, []);

  const handleAddWire = useCallback((newWire) => {
    playWireSnapSound();
    socket.emit('wire:add', newWire);
  }, []);

  const handleDeleteWire = useCallback((id) => {
    socket.emit('wire:delete', { id });
  }, []);

  const handleClearWires = useCallback(() => {
    wires.forEach((w) => {
      socket.emit('wire:delete', { id: w.id });
    });
  }, [wires]);

  const handleSaveCode = useCallback((id, code) => {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, state: { ...c.state, code } } : c
      )
    );
    socket.emit('component:update', { id, state: { code } });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('syncarch_token');
    localStorage.removeItem('syncarch_user');
    localStorage.removeItem('syncarch_draft_canvas');
    setAuthUser(null);
    setCurrentProjectId(null);
    setProjectTitle('My ECE Lab Circuit');
    setUserProjects([]);
    setComponents([]);
    setWires([]);
    socket.emit('canvas:sync', { components: [], wires: [] });
    navigate('/');
    setToastMessage({ type: 'success', text: 'Logged out successfully. Access locked.' });
    setTimeout(() => setToastMessage(null), 3000);
  }, [navigate]);

  const handleAuthSuccess = useCallback((userData) => {
    setAuthUser(userData);
  }, []);

  const handleCursorMove = useCallback((coords) => {
    socket.emit('cursor:move', coords);
  }, []);

  const handleSaveCircuit = useCallback(async (overrideTitle, overrideTags) => {
    const token = localStorage.getItem('syncarch_token');
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    const titleToSave = typeof overrideTitle === 'string' && overrideTitle.trim() ? overrideTitle.trim() : projectTitle;

    setIsSaving(true);
    try {
      const thumbnailBase64 = generateCanvasThumbnailBase64(components, wires, titleToSave);
      const circuitPayload = { components, wires };
      const endpoint = currentProjectId ? `${API_BASE_URL}/api/projects/${currentProjectId}` : `${API_BASE_URL}/api/projects`;
      const method = currentProjectId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: titleToSave,
          circuit_data: circuitPayload,
          thumbnail: thumbnailBase64,
          tags: overrideTags || '#Sequential-Logic,#Logic-Gates'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save circuit');

      if (data.projectId) {
        setCurrentProjectId(data.projectId);
      }

      setToastMessage({ type: 'success', text: `⚡ Circuit "${titleToSave}" saved successfully with base64 thumbnail!` });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setToastMessage({ type: 'error', text: `⚠️ ${err.message}` });
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  }, [components, wires, currentProjectId, projectTitle]);

  const handleShareRoom = useCallback(() => {
    const roomId = `sync-${currentProjectId || 'lab-1'}`;
    const shareUrl = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setToastMessage({ type: 'success', text: `🔗 Room link copied: ${shareUrl}` });
        setTimeout(() => setToastMessage(null), 3500);
      })
      .catch((err) => {
        console.error('Clipboard copy error:', err);
        setToastMessage({ type: 'error', text: '⚠️ Failed to copy share link' });
        setTimeout(() => setToastMessage(null), 3000);
      });
  }, [currentProjectId]);

  const handleOpenMyCircuits = useCallback(async () => {
    const token = localStorage.getItem('syncarch_token');
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsProjectsModalOpen(true);
    setLoadingProjects(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load projects');
      setUserProjects(data.projects || []);
    } catch (err) {
      console.error('Fetch projects error:', err);
      setToastMessage({ type: 'error', text: `⚠️ ${err.message}` });
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const handleSelectProject = useCallback(async (id) => {
    const token = localStorage.getItem('syncarch_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load project details');

      const projectData = data.project;
      if (projectData) {
        if (projectData.title) {
          setProjectTitle(projectData.title);
        }
        if (projectData.circuit_data) {
          const parsed = typeof projectData.circuit_data === 'string' ? JSON.parse(projectData.circuit_data) : projectData.circuit_data;
          const loadedComps = parsed.components || [];
          const loadedWires = parsed.wires || [];

          setComponents(loadedComps);
          setWires(loadedWires);
          setCurrentProjectId(id);
          setIsProjectsModalOpen(false);

          // Sync loaded canvas to all connected users
          socket.emit('canvas:sync', { components: loadedComps, wires: loadedWires });

          setToastMessage({ type: 'success', text: `Loaded "${projectData.title}" onto canvas!` });
          setTimeout(() => setToastMessage(null), 3000);
        }
      }
    } catch (err) {
      console.error('Load project error:', err);
      setToastMessage({ type: 'error', text: `⚠️ ${err.message}` });
      setTimeout(() => setToastMessage(null), 3500);
    }
  }, []);

  const handlePublishCircuit = useCallback(async (overrideTitle, overrideTags) => {
    const token = localStorage.getItem('syncarch_token');
    if (!token) {
      setIsAuthModalOpen(true);
      setToastMessage({ type: 'error', text: '⚠️ Please sign in first to publish your circuit to the Marketplace.' });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const titleToPublish = typeof overrideTitle === 'string' && overrideTitle.trim() ? overrideTitle.trim() : projectTitle;
    const tagsToPublish = overrideTags || '#Sequential-Logic,#Logic-Gates';

    setIsSaving(true);
    try {
      const thumbnailBase64 = generateCanvasThumbnailBase64(components, wires, titleToPublish);
      const circuitPayload = { components, wires };

      const endpoint = currentProjectId ? `${API_BASE_URL}/api/projects/${currentProjectId}` : `${API_BASE_URL}/api/projects`;
      const method = currentProjectId ? 'PUT' : 'POST';

      const saveRes = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: titleToPublish,
          circuit_data: circuitPayload,
          thumbnail: thumbnailBase64,
          tags: tagsToPublish,
          is_public: true
        })
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || 'Failed to save circuit');

      const targetId = currentProjectId || saveData.projectId;
      if (saveData.projectId) {
        setCurrentProjectId(saveData.projectId);
      }

      // Explicitly set is_public: true in backend database via visibility endpoint
      if (targetId) {
        const visRes = await fetch(`${API_BASE_URL}/api/projects/${targetId}/visibility`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            is_public: true,
            tags: tagsToPublish,
            thumbnail: thumbnailBase64,
            description: `Open-source schematic: ${titleToPublish}`
          })
        });

        if (!visRes.ok) {
          const visData = await visRes.json();
          throw new Error(visData.error || 'Failed to update visibility');
        }
      }

      setIsProjectPublic(true);
      setProjectTitle(titleToPublish);

      setToastMessage({ type: 'success', text: '🌐 Circuit published to Marketplace!' });
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Publish error:', err);
      setToastMessage({ type: 'error', text: `⚠️ ${err.message}` });
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  }, [components, wires, currentProjectId, projectTitle]);

  const handleTogglePublish = useCallback(async () => {
    if (!currentProjectId) {
      setToastMessage({ type: 'error', text: '⚠️ Please save the project first before publishing to Community Marketplace.' });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const token = localStorage.getItem('syncarch_token');
    if (!token) return;

    const nextPublicState = !isProjectPublic;
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${currentProjectId}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_public: nextPublicState,
          description: `Open-source schematic: ${projectTitle}`
        })
      });

      if (res.ok) {
        setIsProjectPublic(nextPublicState);
        setToastMessage({
          type: 'success',
          text: nextPublicState
            ? '🌐 Circuit published to Marketplace!'
            : '🔒 Project visibility set to Private.'
        });
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Error toggling visibility:', err);
    }
  }, [currentProjectId, isProjectPublic, projectTitle]);

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
      {/* Global Top Navbar */}
      <Navbar
        authUser={authUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isConnected={isConnected}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2 animate-bounce ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
            : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* React Router View Switching with Framer-Motion Transitions */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Landing Page */}
          <Route 
            path="/" 
            element={
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full h-full"
              >
                <LandingPage 
                  authUser={authUser} 
                  onOpenAuth={() => setIsAuthModalOpen(true)} 
                />
              </motion.div>
            } 
          />

          {/* Protected User Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute authUser={authUser} onOpenAuth={() => setIsAuthModalOpen(true)}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="w-full h-full"
                >
                  <Dashboard 
                    authUser={authUser} 
                    onOpenAuth={() => setIsAuthModalOpen(true)} 
                    onSelectProject={handleSelectProject}
                  />
                </motion.div>
              </ProtectedRoute>
            } 
          />

          {/* Community Schematic Marketplace */}
          <Route 
            path="/community" 
            element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full h-full pt-16"
              >
                <CommunityPage authUser={authUser} onOpenAuth={() => setIsAuthModalOpen(true)} />
              </motion.div>
            } 
          />

          {/* Protected Core Circuit Simulator Lab */}
          {['/lab', '/lab/:projectId', '/room/:roomId', '/room/sync-:projectId'].map((path) => (
            <Route 
              key={path}
              path={path} 
              element={
                <ProtectedRoute authUser={authUser} onOpenAuth={() => setIsAuthModalOpen(true)}>
                  <LabView handleSelectProject={handleSelectProject} currentProjectId={currentProjectId}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.01 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="relative w-full h-full pt-14 overflow-hidden"
                    >
                      <UserPresence
                        users={users}
                        myUser={myUser}
                        isConnected={isConnected}
                        componentCount={components.length}
                        wireCount={wires.length}
                        authUser={authUser}
                        onOpenAuth={() => setIsAuthModalOpen(true)}
                        onLogout={handleLogout}
                        onSaveCircuit={handleSaveCircuit}
                        onOpenMyCircuits={handleOpenMyCircuits}
                        onShareRoom={handleShareRoom}
                        onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
                        onTogglePublish={handleTogglePublish}
                        onPublishCircuit={handlePublishCircuit}
                        isPublic={isProjectPublic}
                        isSaving={isSaving}
                        projectTitle={projectTitle}
                        onUpdateTitle={setProjectTitle}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        components={components}
                        wires={wires}
                        onToast={(msg) => {
                          setToastMessage(msg);
                          setTimeout(() => setToastMessage(null), 3500);
                        }}
                      />

                      <Canvas
                        components={components}
                        wires={wires}
                        users={users}
                        locks={locks}
                        myUser={myUser}
                        onLock={handleLock}
                        onUnlock={handleUnlock}
                        onMoveComponent={handleMoveComponent}
                        onRotateComponent={handleRotateComponent}
                        onDuplicateComponent={handleDuplicateComponent}
                        onToggleState={handleToggleState}
                        onDeleteComponent={handleDeleteComponent}
                        onAddWire={handleAddWire}
                        onDeleteWire={handleDeleteWire}
                        onCursorMove={handleCursorMove}
                        onOpenCodeEditor={(comp) => setActiveCodeComponent(comp)}
                        onUpdatePinNetLabel={handleUpdatePinNetLabel}
                        onCreateSubcircuit={handleCreateSubcircuit}
                        onOpenSubcircuit={(comp) => setActiveSubcircuitModalComp(comp)}
                        settings={settings}
                      />

                      <Sidebar
                        onAddComponent={handleAddComponent}
                        onClearWires={handleClearWires}
                      />

                      {activeCodeComponent && (
                        <CodeEditorPanel
                          component={activeCodeComponent}
                          onClose={() => setActiveCodeComponent(null)}
                          onSaveCode={handleSaveCode}
                          components={components}
                          wires={wires}
                          projectTitle={projectTitle}
                        />
                      )}

                      <AIAssistant settings={settings} />
                    </motion.div>
                  </LabView>
                </ProtectedRoute>
              } 
            />
          ))}
        </Routes>
      </AnimatePresence>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={userProjects}
        loading={loadingProjects}
        onSelectProject={handleSelectProject}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        authUser={authUser}
        onLogout={handleLogout}
      />

      <SubcircuitModal
        isOpen={!!activeSubcircuitModalComp}
        onClose={() => setActiveSubcircuitModalComp(null)}
        component={activeSubcircuitModalComp}
        settings={settings}
      />

      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        projectId={currentProjectId}
        projectTitle={projectTitle}
        components={components}
        wires={wires}
        onRestoreCanvas={(restoredComps, restoredWires) => {
          setComponents(restoredComps);
          setWires(restoredWires);
        }}
        onToast={(msg) => {
          setToastMessage({ type: 'success', text: msg });
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />
    </div>
  );
}

function ProtectedRoute({ authUser, onOpenAuth, children }) {
  const token = localStorage.getItem('syncarch_token');

  useEffect(() => {
    if (!authUser || !token) {
      onOpenAuth();
    }
  }, [authUser, token, onOpenAuth]);

  if (!authUser || !token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function LabView({ handleSelectProject, currentProjectId, children }) {
  const { projectId, roomId } = useParams();
  const targetRoomId = roomId || (projectId ? `sync-${projectId}` : 'default');

  useEffect(() => {
    if (socket.connected) {
      socket.emit('room:join', { roomId: targetRoomId });
    }
    function onConnect() {
      socket.emit('room:join', { roomId: targetRoomId });
    }
    socket.on('connect', onConnect);
    return () => {
      socket.off('connect', onConnect);
    };
  }, [targetRoomId]);

  useEffect(() => {
    const effectiveId = projectId || (roomId ? roomId.replace(/^sync-/, '') : null);
    if (effectiveId && !isNaN(Number(effectiveId)) && String(effectiveId) !== String(currentProjectId)) {
      handleSelectProject(effectiveId);
    }
  }, [projectId, roomId, currentProjectId, handleSelectProject]);

  return children;
}
