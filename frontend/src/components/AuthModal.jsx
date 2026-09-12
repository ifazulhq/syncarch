import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { X, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

import { API_BASE_URL } from '../config';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse || !credentialResponse.credential) {
      setError('Failed to obtain Google authentication credential.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken: credentialResponse.credential })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google Authentication failed on server');
      }

      // Save JWT & User payload to localStorage
      if (data.token) {
        localStorage.setItem('syncarch_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('syncarch_user', JSON.stringify(data.user));
      }

      if (onSuccess) {
        onSuccess(data.user);
      }

      onClose();
    } catch (err) {
      console.error('Google OAuth Error:', err.message);
      setError(err.message || 'Authentication error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In prompt failed. Please try again.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Sign in to SyncArch</h3>
              <p className="text-xs text-slate-400">Collaborative Real-Time Electronics Lab</p>
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

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200">Secure Single Sign-On</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Authenticate instantly with your Google account to save logic circuits and collaborate in real-time.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading ? (
            <div className="py-4 flex flex-col items-center space-y-2">
              <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-medium">Verifying Google ID Token...</p>
            </div>
          ) : (
            <div className="pt-2 flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                shape="pill"
                size="large"
                text="continue_with"
                width="320"
              />
            </div>
          )}

          <p className="text-[11px] text-slate-500 pt-2">
            Protected by Google OAuth 2.0 & JWT Encrypted Sessions
          </p>
        </div>
      </motion.div>
    </div>
  );
}
