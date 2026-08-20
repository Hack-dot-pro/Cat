import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Wifi, Shield, Cpu, Settings, Grid, Hand, Bell,
  Activity, Volume2, VolumeX, FileText, Wrench, User, Bot
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

export function TopBar() {
  const [time, setTime] = useState(new Date());
  const {
    setSettingsOpen,
    setAppGridOpen,
    setGestureOpen,
    setFilesOpen,
    setMcpOpen,
    aiState,
    addNotification,
    soundEnabled,
    setSoundEnabled,
    userFullName,
    userName,
    isSpeaking,
    stopSpeaking,
    voiceAutoSpeak,
    setVoiceAutoSpeak,
  } = useApp();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fmtTime = (d: Date) => d.toLocaleTimeString('vi-VN', { hour12: false });
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric', year: 'numeric' });

  const stateColor = {
    idle: '#00f5ff',
    listening: '#22c55e',
    processing: '#f59e0b',
    responding: '#a855f7',
  }[aiState];

  const stateLabel = {
    idle: 'CHỜ LỆNH',
    listening: 'LẮNG NGHE',
    processing: 'ĐANG XỬ LÝ',
    responding: 'PHẢN HỒI',
  }[aiState];

  return (
    <div
      className="fixed top-0 left-0 right-0 h-14 flex items-center px-5 gap-4"
      style={{
        zIndex: 100,
        background: 'rgba(1, 11, 26, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 245, 255, 0.15)',
        boxShadow: '0 0 30px rgba(0, 245, 255, 0.05), 0 1px 0 rgba(0,245,255,0.08)',
      }}
    >
      {/* Logo CAT AI */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 rounded-full flex items-center justify-center relative"
          style={{
            border: '1.5px solid rgba(0,245,255,0.6)',
            boxShadow: '0 0 12px rgba(0,245,255,0.4), inset 0 0 8px rgba(0,245,255,0.1)',
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: '#00f5ff', boxShadow: '0 0 8px rgba(0,245,255,0.9)' }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: '1px dashed rgba(0,245,255,0.2)' }}
          />
        </motion.div>
        <div>
          <div style={{ ...orb, color: '#00f5ff', fontSize: '13px', letterSpacing: '0.18em', textShadow: '0 0 10px rgba(0,245,255,0.6)' }}>
            CAT AI
          </div>
          <div style={{ ...mono, color: 'rgba(0,245,255,0.45)', fontSize: '10px' }}>
            HOLOGRAPHIC OS v3.8
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 flex-shrink-0" style={{ background: 'rgba(0,245,255,0.12)' }} />

      {/* AI State */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <motion.div
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: aiState === 'idle' ? 3 : 0.6, repeat: Infinity }}
          className="w-2 h-2 rounded-full"
          style={{ background: stateColor, boxShadow: `0 0 8px ${stateColor}` }}
        />
        <span style={{ ...mono, color: stateColor, fontSize: '11px', letterSpacing: '0.12em' }}>
          {stateLabel}
        </span>
      </div>

      {/* User Badge: Vinh (Vinh_Admin) */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full flex-shrink-0"
        style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}
      >
        <User className="w-3 h-3 text-purple-400" />
        <span style={{ ...aptos, color: '#e9d5ff', fontSize: '11px', fontWeight: 600 }}>
          {userFullName}
        </span>
        <span style={{ ...mono, color: 'rgba(168,85,247,0.7)', fontSize: '9px' }}>
          ({userName})
        </span>
      </div>

      {/* Center status row */}
      <div className="flex-1 flex items-center justify-center gap-6">
        {[
          { icon: Wifi, label: 'GATEWAY', val: 'XKIRO V1', color: '#22c55e' },
          { icon: Shield, label: 'BẢO MẬT', val: 'AES-256', color: '#00f5ff' },
          { icon: Cpu, label: 'MODEL', val: 'GWEN 3.8', color: '#a855f7' },
          { icon: Activity, label: 'MCP', val: '6 TOOLS', color: '#0ea5e9' },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className="w-3 h-3" style={{ color }} />
            <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{label}</span>
            <span style={{ ...mono, color: 'rgba(255,255,255,0.85)', fontSize: '10px' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Time */}
      <div className="text-right flex-shrink-0">
        <div style={{ ...orb, color: '#00f5ff', fontSize: '15px', textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>
          {fmtTime(time)}
        </div>
        <div style={{ ...aptos, color: 'rgba(0,245,255,0.5)', fontSize: '11px' }}>{fmtDate(time)}</div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 flex-shrink-0" style={{ background: 'rgba(0,245,255,0.12)' }} />

      {/* Quick action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Sound Toggle */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            addNotification({
              type: 'info',
              title: 'Âm thanh hệ thống',
              message: !soundEnabled ? 'Đã bật hiệu ứng âm thanh Sci-Fi.' : 'Đã tắt tiếng.',
            });
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{
            background: soundEnabled ? 'rgba(0,245,255,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${soundEnabled ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
          }}
          title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-gray-400" />
          )}
        </motion.button>

        {/* Deep Male Voice Auto-Speak Toggle */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            sounds.playClick();
            if (isSpeaking) {
              stopSpeaking();
            } else {
              setVoiceAutoSpeak(!voiceAutoSpeak);
              addNotification({
                type: 'info',
                title: 'Giọng đọc Nam Trầm CAT AI',
                message: !voiceAutoSpeak ? 'Đã bật tự động đọc phản hồi (Giọng Nam Trầm).' : 'Đã tắt tự động đọc.',
              });
            }
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer relative"
          style={{
            background: isSpeaking ? 'rgba(168,85,247,0.25)' : voiceAutoSpeak ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isSpeaking ? '#a855f7' : voiceAutoSpeak ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.15)'}`,
            boxShadow: isSpeaking ? '0 0 15px rgba(168,85,247,0.5)' : 'none',
          }}
          title={isSpeaking ? 'Nhấn để dừng đọc' : voiceAutoSpeak ? 'Tắt tự động đọc giọng nam' : 'Bật tự động đọc giọng nam'}
        >
          {isSpeaking ? (
            <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
              <Volume2 className="w-4 h-4 text-purple-300" />
            </motion.div>
          ) : (
            <Bot className={`w-4 h-4 ${voiceAutoSpeak ? 'text-purple-400' : 'text-gray-400'}`} />
          )}
          {isSpeaking && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          )}
        </motion.button>

        {/* Files Systemizer Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            sounds.playClick();
            setFilesOpen(true);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.2)' }}
          title="Hệ thống hóa Tài liệu"
        >
          <FileText className="w-4 h-4 text-cyan-400" />
        </motion.button>

        {/* MCP Tools Hub Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            sounds.playClick();
            setMcpOpen(true);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)' }}
          title="Công cụ MCP (Model Context Protocol)"
        >
          <Wrench className="w-4 h-4 text-purple-400" />
        </motion.button>

        {[
          {
            icon: Bell,
            action: () => {
              sounds.playClick();
              addNotification({ type: 'info', title: 'Thông báo CAT AI', message: 'Tất cả các dịch vụ đang hoạt động bình thường.' });
            },
            color: '#f59e0b',
            title: 'Thông báo',
          },
          {
            icon: Hand,
            action: () => {
              sounds.playClick();
              setGestureOpen(true);
            },
            color: '#00f5ff',
            title: 'Điều khiển Cử chỉ',
          },
          {
            icon: Grid,
            action: () => {
              sounds.playClick();
              setAppGridOpen(true);
            },
            color: '#00f5ff',
            title: 'Tất cả ứng dụng',
          },
          {
            icon: Settings,
            action: () => {
              sounds.playClick();
              setSettingsOpen(true);
            },
            color: '#00f5ff',
            title: 'Cài đặt hệ thống',
          },
        ].map(({ icon: Icon, action, color, title }, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={action}
            title={title}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{
              background: 'rgba(0,245,255,0.04)',
              border: '1px solid rgba(0,245,255,0.15)',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${color}40`;
              (e.currentTarget as HTMLElement).style.borderColor = `${color}60`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.15)';
            }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
