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
    subLabel: 'TRỢ LÝ THƯ KÝ KIM TRỰC TUYẾN',
    pulseSpeed: 3,
    ringColor: 'rgba(0,245,255,0.4)',
  },
  listening: {
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.6)',
    label: 'ĐANG LẮNG NGHE',
    subLabel: 'GỌI "KIM" HOẶC NÓI LỆNH...',
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
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.6)',
    label: 'ĐANG PHẢN HỒI',
    subLabel: 'GIỌNG NỮ THƯ KÝ KIM ĐANG NÓI',
    pulseSpeed: 0.6,
    ringColor: 'rgba(236,72,153,0.5)',
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
        boxShadow: `0 0 10px ${color.replace('0.', '0.35')}`,
        transform: `rotateX(${tilt}deg)`,
        transformStyle: 'preserve-3d',
      }}
    />
  );
}

export function AICore() {
  const { aiState, setAiState, addNotification, isSpeaking, isListeningVoice, speechTranscript } = useApp();
  const cfg = stateConfig[aiState] || stateConfig.idle;
  const [dataPoints, setDataPoints] = useState<{ x: number; y: number; val: string }[]>([]);
  const [waveBars, setWaveBars] = useState<number[]>(() => Array(32).fill(0.2));

  // Initialize and update orbiting data points
  useEffect(() => {
    const pts = Array(8).fill(0).map((_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const r = 195; // increased radius for larger center
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

  // Animate soundwave visualizer
  useEffect(() => {
    const active = isSpeaking || aiState === 'responding' || aiState === 'listening' || isListeningVoice;
    const interval = setInterval(() => {
      setWaveBars(
        Array(32)
          .fill(0)
          .map((_, i) => {
            const center = 16;
            const dist = Math.abs(i - center) / center;
            if (isSpeaking || aiState === 'responding') {
              const t = Date.now() / 150;
              return 0.25 + 0.75 * Math.abs(Math.sin(t + i * 0.3)) * (1 - dist * 0.3);
            }
            if (aiState === 'listening' || isListeningVoice) {
              const activeBoost = speechTranscript ? 0.4 : 0.15;
              return 0.2 + (Math.random() * 0.65 + activeBoost) * (1 - dist * 0.35);
            }
            if (aiState === 'processing') {
              const t = Date.now() / 200;
              return 0.2 + 0.4 * Math.abs(Math.sin(t + i * 0.4));
            }
            // Idle breathing
            const t = Date.now() / 600;
            return 0.15 + 0.2 * Math.abs(Math.sin(t + i * 0.2)) * (1 - dist * 0.4);
          })
      );
    }, active ? 60 : 120);

    return () => clearInterval(interval);
  }, [aiState, isSpeaking, isListeningVoice, speechTranscript]);

  const handleClick = () => {
    sounds.playClick();
    const states: (typeof aiState)[] = ['idle', 'listening', 'processing', 'responding'];
    const next = states[(states.indexOf(aiState) + 1) % states.length];
    setAiState(next);
    if (next === 'listening') {
      sounds.playVoiceStart();
      addNotification({ type: 'success', title: 'Micro kích hoạt', message: 'Thư Ký Kim đang lắng nghe lệnh giọng nói...' });
    }
  };

  const activeColor = isSpeaking ? '#ec4899' : cfg.color;
  const activeGlow = isSpeaking ? 'rgba(236,72,153,0.7)' : cfg.glow;

  return (
    <div className="flex flex-col items-center justify-center gap-4 select-none" style={{ perspective: '700px' }}>
      {/* Outer Hologram Rings & Orbit (Enlarged to 480x480) */}
      <div className="relative flex-shrink-0" style={{ width: 480, height: 480 }}>
        {/* Data point markers */}
        {dataPoints.map((pt, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.25 }}
            className="absolute flex items-center gap-1 pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(${pt.x - 20}px, ${pt.y - 10}px)`,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: activeColor, boxShadow: `0 0 6px ${activeColor}` }} />
            <span style={{ ...mono, color: activeColor, fontSize: '9px', opacity: 0.75 }}>{pt.val}</span>
          </motion.div>
        ))}

        {/* 3D Gyroscope Holographic Rings */}
        <Ring size={470} thickness={1} color={cfg.ringColor} duration={35} direction={1} dashed tilt={60} />
        <Ring size={415} thickness={1} color={cfg.ringColor} duration={25} direction={-1} tilt={30} />
        <Ring size={355} thickness={1.5} color={cfg.ringColor} duration={18} direction={1} dashed tilt={-45} />
        <Ring size={295} thickness={1} color={activeColor} duration={12} direction={-1} tilt={70} />
        <Ring size={235} thickness={2} color={activeColor} duration={8} direction={1} dashed />
        <Ring size={180} thickness={1.5} color={cfg.ringColor} duration={5} direction={-1} />

        {/* Pulsing Core Sphere (Enlarged to 160x160) */}
        <motion.div
          onClick={handleClick}
          animate={{
            scale: [1, 1.08, 1],
            boxShadow: [
              `0 0 35px ${activeGlow}, inset 0 0 25px ${activeGlow}`,
              `0 0 70px ${activeGlow}, inset 0 0 45px ${activeGlow}`,
              `0 0 35px ${activeGlow}, inset 0 0 25px ${activeGlow}`,
            ],
          }}
          transition={{ duration: cfg.pulseSpeed, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full flex items-center justify-center cursor-pointer"
          style={{
            width: 160,
            height: 160,
            left: '50%',
            top: '50%',
            marginLeft: -80,
            marginTop: -80,
            background: 'radial-gradient(circle, rgba(0, 20, 45, 0.96) 0%, rgba(0, 5, 15, 0.99) 100%)',
            border: `2.5px solid ${activeColor}`,
          }}
        >
          {/* Inner glow core */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: cfg.pulseSpeed, repeat: Infinity }}
            className="rounded-full flex items-center justify-center flex-col gap-1.5"
            style={{
              width: 148,
              height: 148,
              background: `radial-gradient(circle, ${activeColor}30 0%, transparent 70%)`,
            }}
          >
            {/* Core logo icon */}
            <motion.div
              animate={{ rotate: aiState === 'processing' ? 360 : 0 }}
              transition={{ duration: 1.5, repeat: aiState === 'processing' ? Infinity : 0, ease: 'linear' }}
            >
              <svg width="46" height="46" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="16" stroke={activeColor} strokeWidth="1.2" opacity="0.5" />
                <circle cx="18" cy="18" r="10" stroke={activeColor} strokeWidth="1.8" opacity="0.85" />
                <circle cx="18" cy="18" r="4.5" fill={activeColor} />
                <line x1="18" y1="2" x2="18" y2="8" stroke={activeColor} strokeWidth="1.5" />
                <line x1="18" y1="28" x2="18" y2="34" stroke={activeColor} strokeWidth="1.5" />
                <line x1="2" y1="18" x2="8" y2="18" stroke={activeColor} strokeWidth="1.5" />
                <line x1="28" y1="18" x2="34" y2="18" stroke={activeColor} strokeWidth="1.5" />
              </svg>
            </motion.div>
            <span style={{ ...orb, color: activeColor, fontSize: '10px', letterSpacing: '0.18em', textAlign: 'center', opacity: 0.95, fontWeight: 700 }}>
              THƯ KÝ KIM
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* State label & Subsystems */}
      <div className="flex flex-col items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={aiState + (isSpeaking ? '_spk' : '')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-0.5"
          >
            <span
              style={{
                ...orb,
                color: activeColor,
                fontSize: '17px',
                letterSpacing: '0.25em',
                textShadow: `0 0 18px ${activeGlow}`,
              }}
            >
              {isSpeaking ? 'THƯ KÝ KIM ĐANG NÓI' : cfg.label}
            </span>
            <span style={{ ...mono, color: 'rgba(255,255,255,0.45)', fontSize: '11px', letterSpacing: '0.12em' }}>
              {isSpeaking ? 'ĐANG PHÁT ÂM THANH GIỌNG NỮ...' : cfg.subLabel}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Subsystem status bars */}
        <div className="flex items-center gap-3 mt-0.5">
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
                  style={{ background: activeColor, boxShadow: `0 0 4px ${activeColor}` }}
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
          animate={{ opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ ...aptos, color: 'rgba(0,245,255,0.7)', fontSize: '12px', marginTop: 2 }}
        >
          NHẤN VÀO LÕI ĐỂ CHUYỂN TRẠNG THÁI THƯ KÝ KIM
        </motion.p>

        {/* SOUNDWAVE AUDIO VISUALIZER - Positioned directly underneath Click Hint */}
        <div
          className="flex items-center justify-center gap-1 px-5 py-2.5 rounded-2xl mt-1"
          style={{
            background: 'rgba(0, 10, 25, 0.65)',
            border: `1px solid ${activeColor}30`,
            boxShadow: `0 0 20px ${activeColor}15, inset 0 0 10px rgba(0,0,0,0.5)`,
          }}
        >
          {waveBars.map((heightFactor, idx) => (
            <motion.div
              key={idx}
              className="w-1 rounded-full transition-all duration-75"
              style={{
                height: Math.max(4, Math.round(heightFactor * 32)),
                background: `linear-gradient(180deg, ${activeColor} 0%, ${activeColor}55 100%)`,
                boxShadow: isSpeaking || aiState === 'listening' ? `0 0 6px ${activeColor}` : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
