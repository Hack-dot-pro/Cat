import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const raj = { fontFamily: 'Rajdhani, sans-serif' };

const stateConfig = {
  idle: {
    color: '#00f5ff',
    glow: 'rgba(0, 245, 255, 0.5)',
    label: 'CHỜ LỆNH',
    subLabel: 'LÕI NƠ-RON CAT ĐANG TRỰC TUYẾN',
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
  const { aiState, setAiState, robotSpeaking } = useApp();
  const cfg = stateConfig[aiState];
  const [dataPoints, setDataPoints] = useState<{ x: number; y: number; val: string }[]>([]);

  useEffect(() => {
    const pts = Array(8)
      .fill(0)
      .map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 150;
        return {
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          val: `${(Math.random() * 100).toFixed(1)}%`,
        };
      });
    setDataPoints(pts);
    const interval = setInterval(() => {
      setDataPoints(prev =>
        prev.map(p => ({
          ...p,
          val: `${(Math.random() * 100).toFixed(1)}%`,
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleOrbClick = () => {
    sounds.playClick();
    const states: (keyof typeof stateConfig)[] = ['idle', 'listening', 'processing', 'responding'];
    const currentIdx = states.indexOf(aiState);
    const nextState = states[(currentIdx + 1) % states.length];
    setAiState(nextState);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 select-none relative">
      {/* Orb container */}
      <div
        className="relative flex items-center justify-center cursor-pointer"
        style={{ width: 340, height: 340 }}
        onClick={handleOrbClick}
      >
        {/* Outer Orbit Rings */}
        <Ring size={330} thickness={1} color="rgba(0,245,255,0.12)" duration={40} direction={1} dashed />
        <Ring size={300} thickness={1} color="rgba(168,85,247,0.18)" duration={28} direction={-1} dashed />
        <Ring size={270} thickness={1.5} color={cfg.ringColor} duration={18} direction={1} />
        <Ring size={240} thickness={1} color="rgba(0,245,255,0.25)" duration={12} direction={-1} dashed />
        <Ring size={210} thickness={1.5} color="rgba(168,85,247,0.3)" duration={8} direction={1} />

        {/* Orbit Data Nodes */}
        {dataPoints.map((pt, i) => (
          <motion.div
            key={i}
            className="absolute flex items-center gap-1 pointer-events-none"
            style={{
              left: `calc(50% + ${pt.x}px - 16px)`,
              top: `calc(50% + ${pt.y}px - 8px)`,
            }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}
            />
            <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '8px' }}>{pt.val}</span>
          </motion.div>
        ))}

        {/* Glowing Orb Background */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{ duration: cfg.pulseSpeed, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full"
          style={{
            width: 170,
            height: 170,
            background: `radial-gradient(circle, ${cfg.color}30 0%, ${cfg.color}08 60%, transparent 80%)`,
            filter: 'blur(8px)',
          }}
        />

        {/* Inner Reactor Sphere */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: 130,
            height: 130,
            background: `radial-gradient(circle, #020b18 40%, #001530 80%, ${cfg.color}40 100%)`,
            border: `2px solid ${cfg.color}`,
            boxShadow: `0 0 35px ${cfg.glow}, inset 0 0 25px ${cfg.glow}`,
          }}
        >
          {/* Inner Arc SVG */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 130 130">
            <circle
              cx="65"
              cy="65"
              r="52"
              fill="none"
              stroke={cfg.color}
              strokeWidth="1"
              strokeDasharray="4 8"
              opacity="0.6"
            />
            <circle
              cx="65"
              cy="65"
              r="40"
              fill="none"
              stroke={cfg.color}
              strokeWidth="1.5"
              strokeDasharray="20 15 5 15"
              opacity="0.8"
            />
          </svg>

          {/* Central Hologram Symbol */}
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: cfg.pulseSpeed * 0.8, repeat: Infinity }}
            className="flex flex-col items-center justify-center z-10 gap-0.5"
          >
            <motion.div
              animate={{ rotate: aiState === 'processing' ? 360 : 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="16" stroke={cfg.color} strokeWidth="1" opacity="0.5" />
                <circle cx="18" cy="18" r="10" stroke={cfg.color} strokeWidth="1.5" opacity="0.8" />
                <circle cx="18" cy="18" r="4" fill={cfg.color} />
                <line x1="18" y1="2" x2="18" y2="8" stroke={cfg.color} strokeWidth="1.5" />
                <line x1="18" y1="28" x2="18" y2="34" stroke={cfg.color} strokeWidth="1.5" />
                <line x1="2" y1="18" x2="8" y2="18" stroke={cfg.color} strokeWidth="1.5" />
                <line x1="28" y1="18" x2="34" y2="18" stroke={cfg.color} strokeWidth="1.5" />
              </svg>
            </motion.div>
            <span
              style={{
                ...orb,
                color: cfg.color,
                fontSize: '9px',
                letterSpacing: '0.12em',
                textAlign: 'center',
                opacity: 0.95,
              }}
            >
              CAT
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
                color: cfg.color,
                fontSize: '16px',
                letterSpacing: '0.25em',
                textShadow: `0 0 15px ${cfg.glow}`,
              }}
            >
              {cfg.label}
            </span>
            <span
              style={{
                ...mono,
                color: 'rgba(255,255,255,0.45)',
                fontSize: '10px',
                letterSpacing: '0.12em',
              }}
            >
              {cfg.subLabel}
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

        {/* Robot Speaking Hologram Wave */}
        {robotSpeaking ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full mt-1"
            style={{
              background: 'rgba(168,85,247,0.15)',
              border: '1px solid rgba(168,85,247,0.4)',
              boxShadow: '0 0 15px rgba(168,85,247,0.3)',
            }}
          >
            <div className="flex items-center gap-0.5 h-3">
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <motion.div
                  key={i}
                  animate={{ height: ['3px', '14px', '3px'] }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                  className="w-0.5 rounded-full"
                  style={{ background: '#a855f7' }}
                />
              ))}
            </div>
            <span style={{ ...mono, color: '#a855f7', fontSize: '9px', letterSpacing: '0.1em' }}>
              GIỌNG ROBOT TIẾNG VIỆT ĐANG PHÁT
            </span>
          </motion.div>
        ) : (
          /* Click hint */
          <motion.p
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ ...raj, color: 'rgba(0,245,255,0.5)', fontSize: '11px', marginTop: 4 }}
          >
            NHẤN VÀO LÕI ĐỂ THAY ĐỔI TRẠNG THÁI
          </motion.p>
        )}
      </div>
    </div>
  );
}
