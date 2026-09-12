import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, Minimize2, Maximize2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { API_BASE_URL } from '../config';

export default function AIAssistant({ isOpen: propIsOpen, onClose, components, wires, settings }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Initial fetch of persistent chat history from SQLite backend
    async function loadChatHistory() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/history`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not load persistent chat history:', e.message);
      }

      // Default welcome message if history is empty
      setMessages([
        {
          id: 1,
          role: 'ai',
          text: 'Hello! I am **Gemini 3.6 Flash**, your ECE Circuit AI Copilot. How can I assist with your logic design, pinouts, or code today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    loadChatHistory();
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (settings?.customApiKey) {
        headers['X-Custom-Api-Key'] = settings.customApiKey;
      }

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: trimmed })
      });

      const data = await response.json();
      const aiResponseText = data.response || data.reply || 'No response received from AI model.';

      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Failed to communicate with backend AI API:', err);
      const errorMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: `⚠️ Network Error: Unable to reach SyncArch AI server at ${API_BASE_URL}/api/chat. Please make sure the backend server is running!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Floating Toggle Button (Visible when closed or minimized) */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-full shadow-2xl shadow-cyan-500/20 border border-cyan-400/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
          title="Open AI Circuit Assistant"
        >
          <Sparkles className="w-6 h-6 animate-pulse text-cyan-200" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border-2 border-slate-900"></span>
          </span>
        </button>
      )}

      {/* Main Chat Panel */}
      {isOpen && (
        <div
          className={`pointer-events-auto transition-all duration-300 ease-in-out flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden ${
            isMinimized ? 'w-80 h-14' : 'w-96 h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-cyan-400/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-100">
                  <span>Circuit AI Copilot</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Online
                  </span>
                </div>
                {!isMinimized && (
                  <p className="text-[11px] text-slate-400">SyncArch Real-Time Logic & MCU Engine</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          {!isMinimized && (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700 bg-slate-950/40">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-cyan-400 border border-slate-700'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                      }`}
                    >
                      <div className="prose prose-invert prose-sm max-w-none break-words text-xs leading-relaxed overflow-x-auto">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            table: ({ node, ...props }) => (
                              <div className="overflow-x-auto my-2 rounded-lg border border-slate-700/80 bg-slate-950/60">
                                <table className="min-w-full divide-y divide-slate-700 text-xs border-collapse" {...props} />
                              </div>
                            ),
                            thead: ({ node, ...props }) => <thead className="bg-slate-900 text-cyan-400 font-semibold" {...props} />,
                            tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-800" {...props} />,
                            tr: ({ node, ...props }) => <tr className="hover:bg-slate-800/40 transition" {...props} />,
                            th: ({ node, ...props }) => <th className="px-2.5 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider border-b border-slate-700" {...props} />,
                            td: ({ node, ...props }) => <td className="px-2.5 py-1.5 text-xs whitespace-nowrap text-slate-300" {...props} />,
                            code: ({ node, inline, className, children, ...props }) => {
                              return inline ? (
                                <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px] border border-slate-800" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 overflow-x-auto my-2 text-[11px] font-mono text-cyan-200">
                                  <code {...props}>{children}</code>
                                </pre>
                              );
                            }
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                      <span
                        className={`block text-[10px] mt-1 text-right ${
                          msg.role === 'user' ? 'text-indigo-200/70' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {/* AI Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1.5 text-slate-400">
                      <span className="text-[11px] font-medium text-slate-300">AI is thinking</span>
                      <div className="flex items-center gap-1 ml-1">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI about circuit logic or code..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="absolute right-1.5 p-1.5 text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition shadow-md"
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
