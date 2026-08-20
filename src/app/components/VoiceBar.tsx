import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Type, Volume2, Sparkles, Radio } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

const BAR_COUNT = 36;

export function VoiceBar() {
  const {
    aiState,
    isListeningVoice,
    speechTranscript,
    startVoiceRecognition,
    stopVoiceRecognition,
    handleExecuteVoiceCommand,
    isSpeaking,
    stopSpeaking,
  } = useApp();

  const [textMode, setTextMode] = useState(false);
  const [input, setInput] = useState('');
  const [bars, setBars] = useState(() => Array(BAR_COUNT).fill(0.15));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isListening = aiState === 'listening' || isListeningVoice;
  const isProcessing = aiState === 'processing';
  const isResponding = aiState === 'responding' || isSpeaking;

  // Animate waveform
  useEffect(() => {
    if (isListening) {
      intervalRef.current = setInterval(() => {
        setBars(
          Array(BAR_COUNT)
            .fill(0)
            .map((_, i) => {
              const center = BAR_COUNT / 2;
              const dist = Math.abs(i - center) / center;
              const activeBoost = speechTranscript ? 0.35 : 0.1;
              return 0.15 + (Math.random() * 0.7 + activeBoost) * (1 - dist * 0.4);
            })
        );
      }, 70);
    } else if (isProcessing || isResponding) {
      intervalRef.current = setInterval(() => {
        setBars(
          Array(BAR_COUNT)
            .fill(0)
            .map((_, i) => {
              const t = Date.now() / 180;
              return 0.2 + 0.5 * Math.abs(Math.sin(t + i * 0.25));
            })
        );
      }, 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setBars(Array(BAR_COUNT).fill(0.15));
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isListening, isProcessing, isResponding, speechTranscript]);

  const toggleListening = () => {
    sounds.playClick();
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (isListening) {
      stopVoiceRecognition();
    } else {
      const success = startVoiceRecognition(true);
      if (!success) {
        // Fallback simulate voice
        sounds.playVoiceStart();
      }
    }
  };

  const handleTextSubmit = () => {
    if (!input.trim()) return;
    sounds.playClick();
    const cmd = input.trim();
    setInput('');
    handleExecuteVoiceCommand(cmd);
  };

  const stateColor = isListening
    ? '#22c55e'
    : isProcessing
    ? '#f59e0b'
    : isResponding
    ? '#a855f7'
    : '#00f5ff';

  const stateLabel = isListening
    ? 'ĐANG LẮNG NGHE (GỌI "KIM" HOẶC "THƯ KÝ KIM")'
    : isProcessing
    ? 'THƯ KÝ KIM ĐANG SUY NGHĨ...'
    : isResponding
    ? 'GIỌNG NỮ THƯ KÝ KIM ĐANG NÓI'
    : 'SẴN SÀNG (GỌI "KIM" HOẶC BẤM MIC ĐỂ NÓI)';

  return (
    <div
      className="fixed left-0 right-0 flex items-center px-6 gap-4"
      style={{
        bottom: 72,
        height: 72,
        zIndex: 60,
        background: 'rgba(1, 8, 20, 0.88)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 245, 255, 0.12)',
        borderBottom: '1px solid rgba(0, 245, 255, 0.06)',
      }}
    >
      {/* Mode toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          sounds.playClick();
          setTextMode(!textMode);
        }}
        className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
        style={{
          background: textMode ? 'rgba(168,85,247,0.15)' : 'rgba(0,245,255,0.06)',
          border: `1px solid ${textMode ? 'rgba(168,85,247,0.4)' : 'rgba(0,245,255,0.2)'}`,
        }}
        title={textMode ? 'Chuyển sang chế độ giọng nói' : 'Chuyển sang chế độ nhập phím'}
      >
        {textMode ? (
          <Type className="w-4 h-4 text-purple-400" />
        ) : (
          <Volume2 className="w-4 h-4 text-cyan-400" />
        )}
      </motion.button>

      {/* Voice Control Bar / Status */}
      <AnimatePresence mode="wait">
        {!textMode ? (
          <motion.div
            key="voice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-between gap-4 min-w-0"
          >
            {/* Status & Mode Information */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse flex-shrink-0" />
                <span style={{ ...mono, color: stateColor, fontSize: '11px', letterSpacing: '0.08em' }} className="truncate">
                  {stateLabel}
                </span>
              </div>
            </div>

            {/* Live Transcript or Hint */}
            <div className="flex-1 max-w-xl flex items-center justify-end">
              {speechTranscript ? (
                <motion.div
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3.5 py-1.5 rounded-xl bg-black/70 border border-green-500/40 text-right max-w-full truncate shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                >
                  <span style={{ ...aptos, color: '#86efac', fontSize: '13px', fontWeight: 600 }}>
                    "{speechTranscript}"
                  </span>
                </motion.div>
              ) : (
                <span style={{ ...aptos, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                  Nói lệnh trực tiếp hoặc gọi "Kim" / "Thư Ký Kim" (Tự động nhận diện sau 1s ngắt giọng)
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center gap-2"
          >
            <div
              className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2"
              style={{ background: 'rgba(0,8,25,0.6)', border: '1px solid rgba(168,85,247,0.25)' }}
            >
              <span style={{ ...mono, color: 'rgba(168,85,247,0.6)', fontSize: '12px' }}>{'>'}</span>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                placeholder="Nhập yêu cầu hoặc câu hỏi cho Thư Ký Kim..."
                className="flex-1 outline-none bg-transparent"
                style={{ ...aptos, color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic Button */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <motion.button
          onClick={toggleListening}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: isListening
              ? 'rgba(34, 197, 94, 0.2)'
              : isProcessing
              ? 'rgba(245, 158, 11, 0.15)'
              : isResponding
              ? 'rgba(168, 85, 247, 0.2)'
              : 'rgba(0, 245, 255, 0.08)',
            border: `2px solid ${stateColor}`,
            boxShadow: `0 0 20px ${stateColor}40, 0 0 40px ${stateColor}15`,
          }}
          title={isListening ? 'Nhấn để tắt Micro' : 'Nhấn để bật Micro hoặc gọi "Kim" / "Thư Ký Kim"'}
        >
          {/* Animated pulse rings */}
          {isListening && (
            <>
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid rgba(34,197,94,0.6)` }}
              />
              <motion.div
                animate={{ scale: [1, 2.3, 1], opacity: [0.25, 0, 0.25] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                className="absolute inset-0 rounded-full"
                style={{ border: `1px solid rgba(34,197,94,0.4)` }}
              />
            </>
          )}

          {isListening ? (
            <Mic className="w-5 h-5 text-green-400" />
          ) : isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-amber-400 border-r-amber-400/40" />
            </motion.div>
          ) : isResponding ? (
            <Volume2 className="w-5 h-5 text-purple-400 animate-pulse" />
          ) : (
            <Mic className="w-5 h-5 text-cyan-400" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
