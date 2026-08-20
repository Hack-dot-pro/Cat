import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Send, Trash2, Download, Sparkles, Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const raj = { fontFamily: 'Rajdhani, sans-serif' };

const SUGGESTIONS = ['scan', 'status', 'weather', 'deploy', 'analyze', 'help'];

export function CommandConsole() {
  const {
    messages,
    clearMessages,
    aiState,
    sendAIChat,
    aiConfig,
    setSettingsOpen,
    addNotification,
  } = useApp();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isProcessing = aiState === 'processing';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiState]);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;
    const text = input.trim();
    setInput('');
    await sendAIChat(text);
  };

  const handleExportChat = () => {
    const text = messages
      .map(
        m =>
          `[${m.timestamp.toISOString()}] ${m.type.toUpperCase()}: ${m.text}`
      )
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cat-console-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification({
      type: 'success',
      title: 'Console Exported',
      message: 'Chat history downloaded successfully.',
    });
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" style={{ color: '#00f5ff' }} />
          <span style={{ ...orb, color: '#00f5ff', fontSize: '11px', letterSpacing: '0.15em' }}>
            COMMAND CONSOLE
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Active Model Badge */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
            style={{
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.25)',
            }}
            title="Click to configure AI Model / API"
          >
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            <span style={{ ...mono, color: '#a855f7', fontSize: '8px' }}>
              {aiConfig.model.slice(0, 14)}
            </span>
          </button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleExportChat}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.12)' }}
            title="Download logs"
          >
            <Download className="w-3 h-3" style={{ color: 'rgba(0,245,255,0.5)' }} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearMessages}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.12)' }}
            title="Clear console"
          >
            <Trash2 className="w-3 h-3" style={{ color: 'rgba(0,245,255,0.5)' }} />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,245,255,0.2) transparent' }}
      >
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type === 'ai' && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: 'rgba(0,245,255,0.1)',
                    border: '1px solid rgba(0,245,255,0.3)',
                    boxShadow: '0 0 8px rgba(0,245,255,0.2)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00f5ff' }} />
                </div>
              )}

              <div
                className="max-w-[88%] rounded-2xl px-3.5 py-2.5"
                style={
                  msg.type === 'ai'
                    ? {
                        background: 'rgba(0, 245, 255, 0.05)',
                        border: '1px solid rgba(0,245,255,0.2)',
                        boxShadow: '0 0 12px rgba(0,245,255,0.05)',
                        borderRadius: '4px 16px 16px 16px',
                      }
                    : {
                        background: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        boxShadow: '0 0 12px rgba(168,85,247,0.08)',
                        borderRadius: '16px 4px 16px 16px',
                      }
                }
              >
                <p style={{ ...raj, color: msg.type === 'ai' ? 'rgba(220,240,255,0.95)' : 'rgba(220,200,255,0.95)', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {msg.text || (msg.isStreaming ? '...' : '')}
                  {msg.isStreaming && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      style={{ color: '#00f5ff', marginLeft: 2 }}
                    >
                      ▋
                    </motion.span>
                  )}
                </p>
                <div className="mt-1 flex justify-end">
                  <span style={{ ...mono, color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>
                    {msg.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>
              </div>

              {msg.type === 'user' && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: 'rgba(168,85,247,0.15)',
                    border: '1px solid rgba(168,85,247,0.4)',
                    boxShadow: '0 0 8px rgba(168,85,247,0.2)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a855f7' }} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Processing animation */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex gap-2 items-center"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00f5ff' }} />
              </div>
              <div
                className="px-3 py-2 rounded-2xl flex items-center gap-1.5"
                style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.15)' }}
              >
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#00f5ff' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5 flex-shrink-0">
        {SUGGESTIONS.map(s => (
          <motion.button
            key={s}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setInput(s); inputRef.current?.focus(); }}
            className="px-2.5 py-1 rounded-lg cursor-pointer"
            style={{
              background: 'rgba(0,245,255,0.04)',
              border: '1px solid rgba(0,245,255,0.15)',
            }}
          >
            <span style={{ ...mono, color: 'rgba(0,245,255,0.6)', fontSize: '9px' }}>{s}</span>
          </motion.button>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-shrink-0"
        style={{
          background: 'rgba(0,8,25,0.7)',
          border: '1px solid rgba(0,245,255,0.2)',
          boxShadow: '0 0 10px rgba(0,245,255,0.04)',
        }}
      >
        <span style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '12px' }}>{'>'}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Ask CAT or enter command..."
          className="flex-1 outline-none bg-transparent"
          style={{ ...raj, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
          style={{
            background: input.trim() && !isProcessing ? 'rgba(0,245,255,0.2)' : 'rgba(0,245,255,0.04)',
            border: `1px solid ${input.trim() && !isProcessing ? 'rgba(0,245,255,0.5)' : 'rgba(0,245,255,0.1)'}`,
          }}
        >
          <Send className="w-3.5 h-3.5" style={{ color: input.trim() && !isProcessing ? '#00f5ff' : 'rgba(0,245,255,0.3)' }} />
        </motion.button>
      </div>
    </div>
  );
}
