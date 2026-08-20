import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

const stateConfig = {
  idle: {
    color: '#00f5ff',
    glow: 'rgba(0, 245, 255, 0.5)',
    label: 'CHỜ LỆNH',
    subLabel: 'LÕI NƠ-RON CAT AI TRỰC TUYẾN',
    pulseSpeed: 3,
    ringColor: 'rgba(0,245,255,0.4)',
  },
  listening: {
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.6)',
    label: 'ĐANG LẮNG NGHE',
    subLabel: 'NHẬN DIỆN GIỌNG NÓI ĐANG KÍCH HOẠT',
    pulseSpeed: 0.8,
    ringColor: 'rgba(34,197,94,0.5)',
  },
  processing: {
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.6)',
    label: 'ĐANG XỬ LÝ',
    subLabel: 'PHÂN TÍCH NƠ-RON ĐANG TIẾN HÀNH',
    pulseSpeed: 0.4,
    ringColor: 'rgba(245,158,11,0.5)',
  },
  responding: {
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.6)',
    label: 'ĐANG PHẢN HỒI',
    subLabel: 'ĐANG TRUYỀN DỮ LIỆU ĐẦU RA',
    pulseSpeed: 0.6,
    ringColor: 'rgba(168,85,247,0.5)',
  },
};

function Ring({
  size,
  thickness,
  color,
  duration,
  direction = 1,
  dashed = false,
  tilt = 0,
}: {
  size: number;
  thickness: number;
  color: string;
  duration: number;
  direction?: number;
  dashed?: boolean;
  tilt?: number;
}) {
  return (
    <motion.div
      animate={{ rotate: direction * 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
        border: `${thickness}px ${dashed ? 'dashed' : 'solid'} ${color}`,
        boxShadow: `0 0 8px ${color.replace('0.', '0.3')}`,
        transform: `rotateX(${tilt}deg)`,
        transformStyle: 'preserve-3d',
      }}
    />
  );
}

export function AICore() {
  const { aiState, setAiState, addNotification, isSpeaking } = useApp();
  const cfg = stateConfig[aiState];
  const [dataPoints, setDataPoints] = useState<{ x: number; y: number; val: string }[]>([]);

  useEffect(() => {
    const pts = Array(8).fill(0).map((_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const r = 165; // increased radius for larger center
      return {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        val: `${(Math.random() * 100).toFixed(1)}%`,
      };
    });
    setDataPoints(pts);
    const interval = setInterval(() => {
      setDataPoints(prev =>
        prev.map(p => ({ ...p, val: `${(Math.random() * 100).toFixed(1)}%` }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    sounds.playClick();
    const states: (typeof aiState)[] = ['idle', 'listening', 'processing', 'responding'];
    const next = states[(states.indexOf(aiState) + 1) % states.length];
    setAiState(next);
    if (next === 'listening') {
      sounds.playVoiceStart();
      addNotification({ type: 'success', title: 'Micro kích hoạt', message: 'CAT AI đang lắng nghe lệnh giọng nói...' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 select-none" style={{ perspective: '600px' }}>
      {/* Outer data ring indicators (Increased by 10% from 380 to 420) */}
      <div className="relative" style={{ width: 420, height: 420 }}>
        {/* Data point markers */}
        {dataPoints.map((pt, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.25 }}
            className="absolute flex items-center gap-1"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(${pt.x - 20}px, ${pt.y - 10}px)`,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.color}` }} />
            <span style={{ ...mono, color: cfg.color, fontSize: '9px', opacity: 0.7 }}>{pt.val}</span>
          </motion.div>
        ))}

        {/* 3D Gyroscope Rings */}
        <Ring size={410} thickness={1} color={cfg.ringColor} duration={35} direction={1} dashed tilt={60} />
        <Ring size={360} thickness={1} color={cfg.ringColor} duration={25} direction={-1} tilt={30} />
        <Ring size={310} thickness={1.5} color={cfg.ringColor} duration={18} direction={1} dashed tilt={-45} />
        <Ring size={260} thickness={1} color={cfg.color} duration={12} direction={-1} tilt={70} />
        <Ring size={210} thickness={2} color={cfg.color} duration={8} direction={1} dashed />
        <Ring size={160} thickness={1.5} color={cfg.ringColor} duration={5} direction={-1} />

        {/* Pulsing Core Sphere */}
        <motion.div
          onClick={handleClick}
          animate={{
            scale: [1, 1.08, 1],
            boxShadow: [
              `0 0 30px ${cfg.glow}, inset 0 0 20px ${cfg.glow}`,
              `0 0 60px ${cfg.glow}, inset 0 0 40px ${cfg.glow}`,
              `0 0 30px ${cfg.glow}, inset 0 0 20px ${cfg.glow}`,
            ],
          }}
          transition={{ duration: cfg.pulseSpeed, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full flex items-center justify-center cursor-pointer"
          style={{
            width: 140,
            height: 140,
            left: '50%',
            top: '50%',
            marginLeft: -70,
            marginTop: -70,
            background: 'radial-gradient(circle, rgba(0, 15, 35, 0.95) 0%, rgba(0, 5, 15, 0.98) 100%)',
            border: `2px solid ${cfg.color}`,
          }}
        >
          {/* Inner glow core */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: cfg.pulseSpeed, repeat: Infinity }}
            className="rounded-full flex items-center justify-center flex-col gap-1"
            style={{
              width: 130,
              height: 130,
              background: `radial-gradient(circle, ${cfg.color}25 0%, transparent 70%)`,
            }}
          >
            {/* Core logo */}
            <motion.div
              animate={{ rotate: aiState === 'processing' ? 360 : 0 }}
              transition={{ duration: 1.5, repeat: aiState === 'processing' ? Infinity : 0, ease: 'linear' }}
            >
              <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="16" stroke={cfg.color} strokeWidth="1" opacity="0.5" />
                <circle cx="18" cy="18" r="10" stroke={cfg.color} strokeWidth="1.5" opacity="0.8" />
                <circle cx="18" cy="18" r="4" fill={cfg.color} />
                <line x1="18" y1="2" x2="18" y2="8" stroke={cfg.color} strokeWidth="1.5" />
                <line x1="18" y1="28" x2="18" y2="34" stroke={cfg.color} strokeWidth="1.5" />
                <line x1="2" y1="18" x2="8" y2="18" stroke={cfg.color} strokeWidth="1.5" />
                <line x1="28" y1="18" x2="34" y2="18" stroke={cfg.color} strokeWidth="1.5" />
              </svg>
            </motion.div>
            <span style={{ ...orb, color: cfg.color, fontSize: '9px', letterSpacing: '0.15em', textAlign: 'center', opacity: 0.95, fontWeight: 700 }}>
              CAT AI
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* State label */}
      <div className="flex flex-col items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={aiState}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-1"
          >
            <span
              style={{
                ...orb,
                color: isSpeaking ? '#a855f7' : cfg.color,
                fontSize: '16px',
                letterSpacing: '0.25em',
                textShadow: `0 0 15px ${isSpeaking ? 'rgba(168,85,247,0.7)' : cfg.glow}`,
              }}
            >
              {isSpeaking ? 'GIỌNG NAM TRẦM' : cfg.label}
            </span>
            <span style={{ ...mono, color: 'rgba(255,255,255,0.45)', fontSize: '10px', letterSpacing: '0.12em' }}>
              {isSpeaking ? 'ĐANG TỰ ĐỘNG ĐỌC PHẢN HỒI...' : cfg.subLabel}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Subsystem status bars */}
        <div className="flex items-center gap-3 mt-1">
          {['NƠ-RON', 'GIỌNG NÓI', 'BỘ NHỚ', 'MẠNG LƯỚI'].map((item, i) => (
            <div key={item} className="flex flex-col items-center gap-1">
              <div
                className="w-12 h-0.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: [`${50 + i * 10}%`, `${70 + i * 5}%`, `${50 + i * 10}%`] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity }}
                  style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.color}` }}
                />
              </div>
              <span style={{ ...mono, color: 'rgba(255,255,255,0.35)', fontSize: '8px' }}>
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Click hint */}
        <motion.p
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ ...aptos, color: 'rgba(0,245,255,0.6)', fontSize: '12px', marginTop: 4 }}
        >
          NHẤN VÀO LÕI ĐỂ CHUYỂN TRẠNG THÁI CAT AI
        </motion.p>
      </div>
    </div>
  );
}
