/**
 * Central API & Environment Configuration for SyncArch
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://syncarch-backend.onrender.com');
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'https://syncarch-backend.onrender.com');
