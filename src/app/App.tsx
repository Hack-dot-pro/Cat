import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Terminal, Search, Activity } from 'lucide-react';

import { AppProvider, useApp } from './context/AppContext';
import { Background } from './components/Background';
import { TopBar } from './components/TopBar';
import { AICore } from './components/AICore';
import { SystemMonitor } from './components/SystemMonitor';
import { MemoryPanel } from './components/MemoryPanel';
import { CommandConsole } from './components/CommandConsole';
import { SearchPanel } from './components/SearchPanel';
import { VoiceBar } from './components/VoiceBar';
import { ScanningPanel } from './components/ScanningPanel';
import { AppGrid } from './components/AppGrid';
import { AppDock } from './components/AppDock';
import { SettingsPanel } from './components/SettingsPanel';
import { GesturePanel } from './components/GesturePanel';
import { NotificationSystem } from './components/NotificationSystem';
import { FilesPanel } from './components/FilesPanel';
import { MCPPanel } from './components/MCPPanel';
import { TerminalPanel } from './components/TerminalPanel';
import { sounds } from './services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

const glassPanel = (accent = '#00f5ff') => ({
  background: 'rgba(0, 10, 28, 0.7)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${accent}25`,
  borderRadius: '16px',
  boxShadow: `0 0 30px rgba(0,0,0,0.45), inset 0 0 20px rgba(0,0,0,0.3)`,
});

function PanelTab({
  id, label, icon: Icon, active, color, onClick,
}: {
  id: string; label: string; icon: React.ElementType;
  active: boolean; color: string; onClick: () => void;
}) {
  const handleClick = () => {
    sounds.playClick();
    onClick();
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
      style={{
        background: active ? `${color}15` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? `${color}40` : 'rgba(255,255,255,0.06)'}`,
        transition: 'all 0.2s',
      }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color: active ? color : 'rgba(255,255,255,0.3)' }} />
      <span style={{ ...mono, color: active ? color : 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </motion.button>
  );
}

function MainLayout() {
  const { leftPanel, setLeftPanel, rightPanel, setRightPanel } = useApp();

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" }}
    >
      <Background />

      {/* Top Bar */}
      <TopBar />

      {/* Main 3-column layout (Right panel +10% wider, Center column enlarged) */}
      <div
        className="flex flex-1 gap-4 px-4 overflow-hidden"
        style={{ marginTop: 56, marginBottom: 144 }}
      >
        {/* LEFT PANEL */}
        <div
          className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-hidden pt-4 pb-2"
        >
          {/* Panel tabs */}
          <div className="flex gap-2 flex-shrink-0">
            <PanelTab
              id="monitor" label="MONITOR" icon={Activity}
              active={leftPanel === 'monitor'} color="#00f5ff"
              onClick={() => setLeftPanel('monitor')}
            />
            <PanelTab
              id="memory" label="MEMORY" icon={Brain}
              active={leftPanel === 'memory'} color="#a855f7"
              onClick={() => setLeftPanel('memory')}
            />
          </div>

          {/* Panel content */}
          <div
            className="flex-1 p-4 overflow-hidden"
            style={glassPanel(leftPanel === 'monitor' ? '#00f5ff' : '#a855f7')}
          >
            <AnimatePresence mode="wait">
              {leftPanel === 'monitor' ? (
                <motion.div key="monitor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <SystemMonitor />
                </motion.div>
              ) : (
                <motion.div key="memory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <MemoryPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CENTER COLUMN: Enlarged Holographic Core (+10% size) */}
        <div className="flex-1 flex flex-col items-center justify-between py-2 overflow-hidden min-w-0">
          {/* Header text */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center flex-shrink-0"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full mb-1"
              style={{
                background: 'rgba(0, 245, 255, 0.08)',
                border: '1px solid rgba(0, 245, 255, 0.25)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
              <span style={{ ...mono, color: '#00f5ff', fontSize: '10px', letterSpacing: '0.15em' }}>
                THƯ KÝ KIM — HOLOGRAPHIC AI ASSISTANT
              </span>
            </div>
          </motion.div>

          {/* Holographic 3D Core with 10% scale up */}
          <div className="flex-1 flex items-center justify-center w-full min-h-0 scale-105">
            <AICore />
          </div>

          {/* Bottom quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md flex flex-col gap-2 flex-shrink-0"
          >
            <div className="flex items-center justify-center gap-3">
              {[
                { label: 'QUÉT NƠ-RON', color: '#00f5ff', action: 'scan' },
                { label: 'PHÂN TÍCH TÀI LIỆU', color: '#a855f7', action: 'files' },
                { label: 'CÔNG CỤ MCP', color: '#22c55e', action: 'mcp' },
                { label: 'BẢO MẬT AES', color: '#f59e0b', action: 'encrypt' },
              ].map(({ label, color, action }) => (
                <QuickActionButton key={label} label={label} color={color} action={action} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT PANEL (Increased by 10% from 288px to 325px) */}
        <div
          className="w-[325px] flex-shrink-0 flex flex-col gap-3 overflow-hidden pt-4 pb-2"
        >
          {/* Panel tabs */}
          <div className="flex gap-2 flex-shrink-0">
            <PanelTab
              id="console" label="CONSOLE" icon={Terminal}
              active={rightPanel === 'console'} color="#00f5ff"
              onClick={() => setRightPanel('console')}
            />
            <PanelTab
              id="search" label="SEARCH" icon={Search}
              active={rightPanel === 'search'} color="#0ea5e9"
              onClick={() => setRightPanel('search')}
            />
          </div>

          {/* Panel content */}
          <div
            className="flex-1 p-4 overflow-hidden"
            style={glassPanel(rightPanel === 'console' ? '#00f5ff' : '#0ea5e9')}
          >
            <AnimatePresence mode="wait">
              {rightPanel === 'console' ? (
                <motion.div key="console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <CommandConsole />
                </motion.div>
              ) : (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <SearchPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Voice Bar */}
      <VoiceBar />

      {/* App Dock */}
      <AppDock />

      {/* Overlays */}
      <ScanningPanel />
      <AppGrid />
      <SettingsPanel />
      <GesturePanel />
      <FilesPanel />
      <MCPPanel />
      <TerminalPanel />

      {/* Notifications */}
      <NotificationSystem />
    </div>
  );
}

function QuickActionButton({ label, color, action }: { label: string; color: string; action: string }) {
  const { addMessage, setAiState, setScanningActive, setFilesOpen, setMcpOpen, addNotification } = useApp();

  const handleClick = () => {
    sounds.playClick();
    if (action === 'files') {
      setFilesOpen(true);
      return;
    }
    if (action === 'mcp') {
      setMcpOpen(true);
      return;
    }
    if (action === 'scan') {
      sounds.playScan();
      addMessage({ type: 'user', text: 'Kích hoạt quét môi trường' });
      setAiState('processing');
      setTimeout(() => {
        setScanningActive(true);
        setAiState('responding');
        addMessage({ type: 'ai', text: 'Đã kích hoạt quét toàn phổ nơ-ron. Giao diện Hologram đang hiển thị...' });
        setTimeout(() => setAiState('idle'), 2000);
      }, 600);
    } else {
      addMessage({ type: 'user', text: 'Kích hoạt giao thức bảo mật' });
      setAiState('processing');
      setTimeout(() => {
        setAiState('responding');
        const resp = 'Giao thức bảo mật AES-256 + RSA-4096 đã được kích hoạt. Toàn bộ các kênh nơ-ron và máy chủ MCP đã được mã hóa an toàn.';
        addMessage({ type: 'ai', text: resp });
        addNotification({ type: 'success', title: 'Bảo mật kích hoạt', message: 'Tất cả các luồng dữ liệu đã được bảo vệ.' });
        setTimeout(() => setAiState('idle'), 2000);
      }, 1000);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="px-3.5 py-2 rounded-xl cursor-pointer"
      style={{
        background: `${color}0c`,
        border: `1px solid ${color}35`,
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${color}30`}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
    >
      <span style={{ ...mono, color, fontSize: '10px', letterSpacing: '0.08em' }}>{label}</span>
    </motion.button>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}