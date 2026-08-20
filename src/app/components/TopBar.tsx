import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wifi, Shield, Cpu, Settings, Grid, Hand, Bell, Activity, Volume2, VolumeX, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const raj = { fontFamily: 'Rajdhani, sans-serif' };

export function TopBar() {
  const [time, setTime] = useState(new Date());
  const {
    setSettingsOpen,
    setAppGridOpen,
    setGestureOpen,
    aiState,
    addNotification,
    soundEnabled,
    setSoundEnabled,
    robotSpeaking,
    ttsEnabled,
    setTtsEnabled,
    stopSpeaking,
  } = useApp();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fmtTime = (d: Date) => d.toLocaleTimeString('vi-VN', { hour12: false });
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

  const stateColor = {
    idle: '#00f5ff',
    listening: '#22c55e',
    processing: '#f59e0b',
    responding: '#a855f7',
  }[aiState];

  const stateLabel = {
    idle: 'CHỜ LỆNH',
    listening: 'ĐANG LẮNG NGHE',
    processing: 'ĐANG XỬ LÝ',
    responding: 'ĐANG PHẢN HỒI',
  }[aiState];

  return (
    <div
      className="fixed top-0 left-0 right-0 h-14 flex items-center px-5 gap-4"
      style={{
        zIndex: 100,
        background: 'rgba(1, 11, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 245, 255, 0.15)',
        boxShadow: '0 0 30px rgba(0, 245, 255, 0.04), 0 1px 0 rgba(0,245,255,0.08)',
      }}
    >
      {/* Logo */}
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
          <div style={{ ...orb, color: '#00f5ff', fontSize: '13px', letterSpacing: '0.15em', textShadow: '0 0 10px rgba(0,245,255,0.6)' }}>
            CAT
          </div>
          <div style={{ ...mono, color: 'rgba(0,245,255,0.45)', fontSize: '10px' }}>HĐH v3.7.2 — ALPHA</div>
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

      {/* Center status row */}
      <div className="flex-1 flex items-center justify-center gap-6">
        {[
          { icon: Wifi, label: 'TRỰC TUYẾN', val: '99.9%', color: '#22c55e' },
          { icon: Shield, label: 'BẢO MẬT', val: 'AES-256', color: '#00f5ff' },
          { icon: Cpu, label: 'TẢI CPU', val: '42%', color: '#a855f7' },
          { icon: Activity, label: 'BĂNG THÔNG', val: '1.2GB/s', color: '#0ea5e9' },
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
        <div style={{ ...raj, color: 'rgba(0,245,255,0.5)', fontSize: '10px' }}>{fmtDate(time)}</div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 flex-shrink-0" style={{ background: 'rgba(0,245,255,0.12)' }} />

      {/* Quick actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Sound Toggle */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            addNotification({
               type: 'info',
              title: 'Âm thanh Hệ thống',
              message: !soundEnabled ? 'Đã bật hiệu ứng âm thanh Sci-Fi.' : 'Đã tắt âm thanh.',
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

        {/* Robot Voice TTS Toggle */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (robotSpeaking) {
              stopSpeaking();
            } else {
              setTtsEnabled(!ttsEnabled);
              addNotification({
                type: 'info',
                title: 'Giọng nói Robot Tiếng Việt',
                message: !ttsEnabled ? 'Đã kích hoạt giọng đọc Robot AI.' : 'Đã tắt giọng nói Robot.',
              });
            }
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer relative"
          style={{
            background: robotSpeaking
              ? 'rgba(168,85,247,0.25)'
              : ttsEnabled
              ? 'rgba(168,85,247,0.12)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${robotSpeaking ? '#a855f7' : ttsEnabled ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.15)'}`,
            boxShadow: robotSpeaking ? '0 0 12px rgba(168,85,247,0.5)' : 'none',
          }}
          title={robotSpeaking ? 'Đang phát giọng nói (Nhấn để dừng)' : ttsEnabled ? 'Tắt giọng nói Robot' : 'Bật giọng nói Robot Tiếng Việt'}
        >
          <Bot className="w-4 h-4" style={{ color: robotSpeaking ? '#ffffff' : ttsEnabled ? '#a855f7' : '#6b7280' }} />
          {robotSpeaking && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-lg border border-purple-400"
            />
          )}
        </motion.button>

        {[
          {
            icon: Bell,
            action: () => {
              sounds.playClick();
              addNotification({
                type: 'info',
                title: 'Cảnh báo Hệ thống',
                message: 'Tất cả hệ thống ở trạng thái tối ưu. Không phát hiện bất thường.',
              });
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
            title: 'Cử chỉ không gian',
          },
          {
            icon: Grid,
            action: () => {
              sounds.playClick();
              setAppGridOpen(true);
            },
            color: '#00f5ff',
            title: 'Lưới ứng dụng',
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
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{
              background: 'rgba(0,245,255,0.04)',
              border: '1px solid rgba(0,245,255,0.15)',
              transition: 'box-shadow 0.2s',
            }}
            title={title}
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
