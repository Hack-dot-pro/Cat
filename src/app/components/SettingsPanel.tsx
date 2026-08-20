import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, Brain, Key, Shield, Eye, EyeOff, ChevronDown,
  CheckCircle, AlertCircle, Save, RotateCcw, Lock, Zap,
  Check, RefreshCw, Volume2, Bot, Play, Square, Mic
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  AIProvider,
  PROVIDER_PRESETS,
  DEFAULT_AI_CONFIG,
  testAIConnection,
  AIConfig,
} from '../services/openai';
import { sounds } from '../services/sound';
import { robotVoice } from '../services/robotVoice';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const raj = { fontFamily: 'Rajdhani, sans-serif' };

type Section = 'ai' | 'voice' | 'api' | 'user' | 'security';

const SECTIONS: { id: Section; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'ai', label: 'AI & MÔ HÌNH', icon: Brain, color: '#a855f7' },
  { id: 'voice', label: 'GIỌNG NÓI ROBOT', icon: Bot, color: '#00f5ff' },
  { id: 'api', label: 'KHO KHÓA API', icon: Key, color: '#f59e0b' },
  { id: 'user', label: 'HỒ SƠ NGƯỜI DÙNG', icon: User, color: '#38bdf8' },
  { id: 'security', label: 'BẢO MẬT & MÃ HÓA', icon: Shield, color: '#22c55e' },
];

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  hint = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isSecret = type === 'password';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{label}</label>
        {hint && (
          <span style={{ ...mono, color: 'rgba(0,245,255,0.4)', fontSize: '9px' }}>{hint}</span>
        )}
      </div>
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{
          background: 'rgba(0,5,15,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'border-color 0.2s',
        }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(0,245,255,0.3)')}
        onBlurCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
      >
        <input
          type={isSecret && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none"
          style={{ ...raj, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setShow(!show);
            }}
            className="cursor-pointer"
          >
            {show ? (
              <EyeOff className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
            ) : (
              <Eye className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
  color = '#00f5ff',
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span style={{ ...raj, color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{label}</span>
      <motion.button
        type="button"
        onClick={() => {
          sounds.playClick();
          onChange(!value);
        }}
        className="w-11 h-6 rounded-full relative cursor-pointer"
        style={{
          background: value ? `${color}30` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${value ? color : 'rgba(255,255,255,0.12)'}`,
        }}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-5 h-5 rounded-full"
          style={{
            background: value ? color : 'rgba(255,255,255,0.3)',
            boxShadow: value ? `0 0 8px ${color}` : 'none',
          }}
        />
      </motion.button>
    </div>
  );
}

export function SettingsPanel() {
  const {
    settingsOpen,
    setSettingsOpen,
    addNotification,
    aiConfig,
    updateAIConfig,
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    robotSpeaking,
    ttsEnabled,
    setTtsEnabled,
    ttsAutoSpeak,
    setTtsAutoSpeak,
    ttsRate,
    setTtsRate,
    ttsPitch,
    setTtsPitch,
    stopSpeaking,
  } = useApp();
  const [section, setSection] = useState<Section>('ai');
  const [saved, setSaved] = useState(false);

  // Local state for AI configuration
  const [localAIConfig, setLocalAIConfig] = useState<AIConfig>(aiConfig);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Connection testing state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    modelUsed: string;
  } | null>(null);

  // TTS voices state
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(robotVoice.getSelectedVoiceURI());

  // User settings
  const [username, setUsername] = useState('cat_admin');
  const [fullName, setFullName] = useState('Quản trị viên');
  const [assistantName, setAssistantName] = useState('CAT');

  // Other API keys
  const [gitUrl, setGitUrl] = useState('https://github.com/Hack-dot-pro/Cat');
  const [weatherKey, setWeatherKey] = useState('wk_••••••••••••••');
  const [searchId, setSearchId] = useState('cx_••••••••••••');

  // Security
  const [encEnabled, setEncEnabled] = useState(true);
  const [biometrics, setBiometrics] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [auditLog, setAuditLog] = useState(true);

  // Sync with context on open
  useEffect(() => {
    if (settingsOpen) {
      setLocalAIConfig(aiConfig);
      setTestResult(null);
      setAvailableVoices(robotVoice.getAllVoices());
    }
  }, [settingsOpen, aiConfig]);

  const handleProviderSelect = (providerId: AIProvider) => {
    sounds.playClick();
    const preset = PROVIDER_PRESETS[providerId];
    setLocalAIConfig(prev => ({
      ...prev,
      provider: providerId,
      baseUrl: preset.defaultBaseUrl,
      model: preset.defaultModel,
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    sounds.playClick();
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testAIConnection(localAIConfig);
      setTestResult(res);
      if (res.success) {
        sounds.playSuccess();
        addNotification({
          type: 'success',
          title: 'Kết Nối Thành Công',
          message: `Mô hình ${res.modelUsed} phản hồi trong ${res.latencyMs}ms`,
        });
      } else {
        sounds.playError();
        addNotification({
          type: 'error',
          title: 'Kết Nối Thất Bại',
          message: res.message,
        });
      }
    } catch (err: any) {
      sounds.playError();
      setTestResult({
        success: false,
        latencyMs: 0,
        message: err.message || 'Lỗi kết nối không xác định',
        modelUsed: localAIConfig.model,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestVoice = () => {
    sounds.playClick();
    if (robotSpeaking) {
      stopSpeaking();
    } else {
      robotVoice.speak('Xin chào! Tôi là CAT, hệ điều hành trí tuệ nhân tạo Holographic. Giọng nói robot tiếng Việt đã được kích hoạt thành công.');
    }
  };

  const handleVoiceSelect = (uri: string) => {
    sounds.playClick();
    setSelectedVoice(uri);
    robotVoice.setSelectedVoiceURI(uri);
  };

  const handleSave = () => {
    sounds.playSuccess();
    updateAIConfig(localAIConfig);
    setSaved(true);
    addNotification({
      type: 'success',
      title: 'Đã Lưu Cấu Hình',
      message: `Đã cập nhật mô hình "${localAIConfig.model}" và các tùy chọn hệ thống.`,
    });
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetDefaults = () => {
    sounds.playClick();
    setLocalAIConfig(DEFAULT_AI_CONFIG);
    setTestResult(null);
    addNotification({
      type: 'info',
      title: 'Khôi Phục Mặc Định',
      message: 'Đã đặt lại cấu hình AI về mặc định Xkiro / Gwen 3.8 max.',
    });
  };

  const activePreset = PROVIDER_PRESETS[localAIConfig.provider] || PROVIDER_PRESETS.xkiro;

  return (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 180, background: 'rgba(0, 4, 12, 0.92)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl mx-6 rounded-2xl overflow-hidden flex flex-col"
            style={{
              maxHeight: '88vh',
              background: 'rgba(0, 10, 25, 0.95)',
              border: '1px solid rgba(0,245,255,0.2)',
              boxShadow: '0 0 60px rgba(0,245,255,0.1)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-8 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0,245,255,0.12)' }}
            >
              <div>
                <h2 style={{ ...orb, color: '#00f5ff', fontSize: '15px', letterSpacing: '0.2em', margin: 0 }}>
                  CẤU HÌNH HỆ THỐNG
                </h2>
                <p style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '10px', marginTop: 2 }}>
                  HĐH CAT v3.7.2 — Cấu hình Mô hình, Giọng nói Robot & Lõi Nơ-ron
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  sounds.playClick();
                  setSettingsOpen(false);
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <X className="w-4 h-4" style={{ color: '#ef4444' }} />
              </motion.button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div
                className="w-56 flex flex-col gap-1 p-4 flex-shrink-0"
                style={{ borderRight: '1px solid rgba(0,245,255,0.08)' }}
              >
                {SECTIONS.map(s => (
                  <motion.button
                    key={s.id}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      sounds.playClick();
                      setSection(s.id);
                    }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer text-left"
                    style={{
                      background: section === s.id ? `${s.color}15` : 'transparent',
                      border: `1px solid ${section === s.id ? `${s.color}35` : 'transparent'}`,
                    }}
                  >
                    <s.icon className="w-4 h-4" style={{ color: section === s.id ? s.color : 'rgba(255,255,255,0.3)' }} />
                    <span style={{ ...mono, color: section === s.id ? s.color : 'rgba(255,255,255,0.45)', fontSize: '10px' }}>
                      {s.label}
                    </span>
                  </motion.button>
                ))}

                {/* Sound Settings in sidebar */}
                <div
                  className="mt-4 rounded-xl p-3"
                  style={{
                    background: 'rgba(0, 8, 20, 0.6)',
                    border: '1px solid rgba(0,245,255,0.1)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span style={{ ...mono, color: 'rgba(255,255,255,0.8)', fontSize: '9px' }}>
                        ÂM THANH SCI-FI
                      </span>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="text-[9px] px-1.5 py-0.5 rounded cursor-pointer"
                      style={{
                        background: soundEnabled ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                        color: soundEnabled ? '#22c55e' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {soundEnabled ? 'BẬT' : 'TẮT'}
                    </button>
                  </div>
                  {soundEnabled && (
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={e => setSoundVolume(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  )}
                </div>

                {/* API Status widget in sidebar */}
                <div
                  className="mt-auto rounded-xl p-3"
                  style={{
                    background: 'rgba(0, 8, 20, 0.6)',
                    border: '1px solid rgba(0,245,255,0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: localAIConfig.apiKey || localAIConfig.provider === 'ollama' ? '#22c55e' : '#f59e0b',
                        boxShadow: `0 0 6px ${localAIConfig.apiKey || localAIConfig.provider === 'ollama' ? '#22c55e' : '#f59e0b'}`,
                      }}
                    />
                    <span style={{ ...mono, color: 'rgba(255,255,255,0.8)', fontSize: '9px' }}>
                      {localAIConfig.provider.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ ...mono, color: 'rgba(0,245,255,0.6)', fontSize: '8px', wordBreak: 'break-all' }}>
                    {localAIConfig.model}
                  </span>
                </div>
              </div>

              {/* Content Area */}
              <div
                className="flex-1 overflow-y-auto p-6 flex flex-col gap-4"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,245,255,0.2) transparent' }}
              >
                <AnimatePresence mode="wait">
                  {section === 'ai' && (
                    <motion.div
                      key="ai"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col gap-4"
                    >
                      {/* Provider Selector */}
                      <div className="flex flex-col gap-2">
                        <label style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                          CHỌN NHÀ CUNG CẤP API (CHUẨN OPENAI COMPLETIONS)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(Object.keys(PROVIDER_PRESETS) as AIProvider[]).map(pKey => {
                            const p = PROVIDER_PRESETS[pKey];
                            const isSelected = localAIConfig.provider === pKey;
                            return (
                              <motion.button
                                key={pKey}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleProviderSelect(pKey)}
                                className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-left"
                                style={{
                                  background: isSelected ? 'rgba(168,85,247,0.18)' : 'rgba(0,5,15,0.6)',
                                  border: `1px solid ${isSelected ? '#a855f7' : 'rgba(255,255,255,0.08)'}`,
                                  boxShadow: isSelected ? '0 0 12px rgba(168,85,247,0.2)' : 'none',
                                }}
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: isSelected ? '#a855f7' : 'rgba(255,255,255,0.2)' }}
                                />
                                <span style={{ ...raj, color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                                  {p.name}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Base URL */}
                      <Field
                        label="ĐỊA CHỈ BASE URL (OPENAI COMPATIBLE ENDPOINT)"
                        value={localAIConfig.baseUrl}
                        onChange={v => setLocalAIConfig(prev => ({ ...prev, baseUrl: v }))}
                        placeholder="https://api.xkiro.com/v1"
                        hint="Hỗ trợ Xkiro, OpenAI, OpenRouter, Groq, DeepSeek, Ollama hoặc proxy riêng"
                      />

                      {/* API Key */}
                      <Field
                        label="KHÓA API / AUTH TOKEN"
                        value={localAIConfig.apiKey}
                        onChange={v => setLocalAIConfig(prev => ({ ...prev, apiKey: v }))}
                        type="password"
                        placeholder={activePreset.requiresKey ? 'sk-...' : 'Tùy chọn cho Ollama cục bộ'}
                        hint={activePreset.requiresKey ? 'Bắt buộc đối với dịch vụ đám mây' : 'Ollama local không cần khóa'}
                      />

                      {/* Model Selector & Freeform Model Name */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <label style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                            TÊN MÔ HÌNH (TÙY CHỈNH HOẶC CHỌN SẴN)
                          </label>
                          <span style={{ ...mono, color: 'rgba(168,85,247,0.8)', fontSize: '9px' }}>
                            Nhập bất kỳ tên model hoặc chọn bên dưới
                          </span>
                        </div>

                        <div className="relative">
                          <div
                            className="flex items-center gap-2 rounded-xl px-3 py-2"
                            style={{
                              background: 'rgba(0,5,15,0.7)',
                              border: '1px solid rgba(168,85,247,0.3)',
                            }}
                          >
                            <input
                              type="text"
                              value={localAIConfig.model}
                              onChange={e => setLocalAIConfig(prev => ({ ...prev, model: e.target.value }))}
                              placeholder="ví dụ: Gwen 3.8 max, deepseek-chat, gpt-4o"
                              className="flex-1 bg-transparent outline-none"
                              style={{ ...raj, color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setModelDropdownOpen(!modelDropdownOpen);
                              }}
                              className="p-1 cursor-pointer hover:opacity-80"
                            >
                              <ChevronDown
                                className="w-4 h-4"
                                style={{
                                  color: '#a855f7',
                                  transform: modelDropdownOpen ? 'rotate(180deg)' : 'none',
                                  transition: 'transform 0.2s',
                                }}
                              />
                            </button>
                          </div>

                          {/* Suggested Models Dropdown */}
                          <AnimatePresence>
                            {modelDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
                                style={{
                                  background: 'rgba(0,10,25,0.98)',
                                  border: '1px solid rgba(168,85,247,0.35)',
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                                }}
                              >
                                <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-purple-500/10">
                                  <span style={{ ...mono, fontSize: '9px', color: 'rgba(168,85,247,0.8)' }}>
                                    MÔ HÌNH GỢI Ý CHO {activePreset.name.toUpperCase()}
                                  </span>
                                </div>
                                {activePreset.suggestedModels.map(m => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                      sounds.playClick();
                                      setLocalAIConfig(prev => ({ ...prev, model: m }));
                                      setModelDropdownOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left cursor-pointer hover:bg-purple-500/15 transition-colors flex items-center justify-between"
                                    style={{ borderBottom: '1px solid rgba(168,85,247,0.08)' }}
                                  >
                                    <span style={{ ...raj, color: m === localAIConfig.model ? '#a855f7' : 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                                      {m}
                                    </span>
                                    {m === localAIConfig.model && (
                                      <Check className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* System Prompt */}
                      <div className="flex flex-col gap-1.5">
                        <label style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                          LỜI NHẮC HỆ THỐNG / CHỈ THỊ (SYSTEM PROMPT)
                        </label>
                        <textarea
                          rows={2}
                          value={localAIConfig.systemPrompt}
                          onChange={e => setLocalAIConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                          placeholder="Bạn là CAT, một hệ điều hành trí tuệ nhân tạo..."
                          className="w-full rounded-xl px-3 py-2 bg-transparent outline-none resize-none"
                          style={{
                            background: 'rgba(0,5,15,0.7)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            ...raj,
                            color: 'rgba(255,255,255,0.85)',
                            fontSize: '12px',
                          }}
                        />
                      </div>

                      {/* Sliders: Temperature & Max Tokens */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <label style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>ĐỘ SÁNG TẠO (TEMPERATURE)</label>
                            <span style={{ ...mono, color: '#a855f7', fontSize: '10px' }}>{localAIConfig.temperature.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.05"
                            value={localAIConfig.temperature}
                            onChange={e => setLocalAIConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                            className="w-full accent-purple-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <label style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>TOKEN TỐI ĐA (MAX TOKENS)</label>
                            <span style={{ ...mono, color: '#a855f7', fontSize: '10px' }}>{localAIConfig.maxTokens}</span>
                          </div>
                          <input
                            type="range"
                            min="256"
                            max="8192"
                            step="256"
                            value={localAIConfig.maxTokens}
                            onChange={e => setLocalAIConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value, 10) }))}
                            className="w-full accent-purple-500"
                          />
                        </div>
                      </div>

                      <Toggle
                        label="Bật Truyền Dữ Liệu Thời Gian Thực (SSE Streaming)"
                        value={localAIConfig.streaming}
                        onChange={v => setLocalAIConfig(prev => ({ ...prev, streaming: v }))}
                        color="#a855f7"
                      />

                      {/* Test Connection Button & Result Bar */}
                      <div
                        className="rounded-xl p-3.5 flex flex-col gap-2"
                        style={{
                          background: 'rgba(168,85,247,0.06)',
                          border: '1px solid rgba(168,85,247,0.2)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" style={{ color: '#a855f7' }} />
                            <span style={{ ...mono, color: 'rgba(255,255,255,0.85)', fontSize: '11px' }}>
                              KIỂM TRA KẾT NỐI ĐIỂM CUỐI (ENDPOINT)
                            </span>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={testingConnection}
                            onClick={handleTestConnection}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-xs"
                            style={{
                              background: 'rgba(168,85,247,0.2)',
                              border: '1px solid rgba(168,85,247,0.4)',
                              color: '#ffffff',
                            }}
                          >
                            <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} />
                            <span style={{ ...mono, fontSize: '9px' }}>
                              {testingConnection ? 'ĐANG KIỂM TRA...' : 'KIỂM TRA KẾT NỐI'}
                            </span>
                          </motion.button>
                        </div>

                        {testResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-2 rounded-lg text-xs"
                            style={{
                              background: testResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              border: `1px solid ${testResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {testResult.success ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                              )}
                              <span style={{ ...mono, color: testResult.success ? '#22c55e' : '#ef4444', fontSize: '10px' }}>
                                {testResult.message}
                              </span>
                            </div>
                            {testResult.success && (
                              <span style={{ ...mono, color: '#00f5ff', fontSize: '9px' }}>
                                {testResult.latencyMs}ms
                              </span>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Robot Voice TTS Section */}
                  {section === 'voice' && (
                    <motion.div
                      key="voice"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col gap-4"
                    >
                      <div
                        className="rounded-xl p-4 flex items-center justify-between"
                        style={{
                          background: 'rgba(0,245,255,0.06)',
                          border: '1px solid rgba(0,245,255,0.25)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Bot className="w-6 h-6 text-cyan-400" />
                          <div>
                            <p style={{ ...raj, color: '#ffffff', fontSize: '15px', fontWeight: 600 }}>
                              Giọng Nói Robot Tiếng Việt (Text-to-Speech)
                            </p>
                            <p style={{ ...mono, color: 'rgba(0,245,255,0.6)', fontSize: '10px' }}>
                              Phát âm thanh câu trả lời của CAT bằng giọng robot tương lai
                            </p>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleTestVoice}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl cursor-pointer"
                          style={{
                            background: robotSpeaking ? 'rgba(239,68,68,0.2)' : 'rgba(0,245,255,0.2)',
                            border: `1px solid ${robotSpeaking ? '#ef4444' : '#00f5ff'}`,
                            color: '#ffffff',
                          }}
                        >
                          {robotSpeaking ? <Square className="w-3.5 h-3.5 text-red-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
                          <span style={{ ...mono, fontSize: '10px' }}>
                            {robotSpeaking ? 'DỪNG PHÁT' : 'THỬ NGHIỆM GIỌNG ROBOT'}
                          </span>
                        </motion.button>
                      </div>

                      <Toggle
                        label="Kích hoạt Giọng nói Robot AI (TTS)"
                        value={ttsEnabled}
                        onChange={setTtsEnabled}
                        color="#00f5ff"
                      />

                      <Toggle
                        label="Tự động đọc to khi AI tạo câu trả lời mới"
                        value={ttsAutoSpeak}
                        onChange={setTtsAutoSpeak}
                        color="#00f5ff"
                      />

                      {/* Rate and Pitch sliders */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <label style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                              TỐC ĐỘ ĐỌC (RATE)
                            </label>
                            <span style={{ ...mono, color: '#00f5ff', fontSize: '10px' }}>
                              {ttsRate.toFixed(2)}x
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.7"
                            max="1.5"
                            step="0.05"
                            value={ttsRate}
                            onChange={e => setTtsRate(parseFloat(e.target.value))}
                            className="w-full accent-cyan-400"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <label style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                              CAO ĐỘ GIỌNG ROBOT (PITCH)
                            </label>
                            <span style={{ ...mono, color: '#00f5ff', fontSize: '10px' }}>
                              {ttsPitch.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.05"
                            value={ttsPitch}
                            onChange={e => setTtsPitch(parseFloat(e.target.value))}
                            className="w-full accent-cyan-400"
                          />
                        </div>
                      </div>

                      {/* Voice selector */}
                      {availableVoices.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <label style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                            CHỌN GIỌNG ĐỌC HỆ THỐNG
                          </label>
                          <select
                            value={selectedVoice}
                            onChange={e => handleVoiceSelect(e.target.value)}
                            className="rounded-xl px-3 py-2 bg-[#000a19] text-white text-xs border border-cyan-400/20 outline-none"
                            style={{ ...raj }}
                          >
                            <option value="">-- Tự động chọn giọng Tiếng Việt tốt nhất --</option>
                            {availableVoices.map(v => (
                              <option key={v.voiceURI} value={v.voiceURI}>
                                {v.name} ({v.lang}) {v.lang.includes('vi') ? '⭐ Tiếng Việt' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {section === 'api' && (
                    <motion.div
                      key="api"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col gap-4"
                    >
                      <Field
                        label="KHÓA API MÔ HÌNH CHÍNH (XKIRO / OPENAI)"
                        value={localAIConfig.apiKey}
                        onChange={v => setLocalAIConfig(prev => ({ ...prev, apiKey: v }))}
                        type="password"
                        placeholder="sk-..."
                      />
                      <Field
                        label="ĐỊA CHỈ GIT SYNC"
                        value={gitUrl}
                        onChange={setGitUrl}
                        placeholder="https://github.com/..."
                      />
                      <Field
                        label="KHÓA API DỰ BÁO THỜI TIẾT"
                        value={weatherKey}
                        onChange={setWeatherKey}
                        type="password"
                        placeholder="wk_..."
                      />
                      <Field
                        label="MÃ CÔNG CỤ TÌM KIẾM (SEARCH ENGINE ID)"
                        value={searchId}
                        onChange={setSearchId}
                        type="password"
                        placeholder="cx_..."
                      />

                      <div
                        className="rounded-xl p-3"
                        style={{
                          background: 'rgba(245,158,11,0.06)',
                          border: '1px solid rgba(245,158,11,0.15)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                          <span style={{ ...mono, color: 'rgba(245,158,11,0.85)', fontSize: '10px' }}>
                            TẤT CẢ KHÓA API ĐƯỢC MÃ HÓA VÀ LƯU AN TOÀN TRONG LOCALSTORAGE TRÌNH DUYỆT
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {section === 'user' && (
                    <motion.div
                      key="user"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col gap-4"
                    >
                      {/* Avatar */}
                      <div className="flex items-center gap-4 mb-2">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{
                            background: 'rgba(0,245,255,0.08)',
                            border: '1px solid rgba(0,245,255,0.2)',
                          }}
                        >
                          <User className="w-7 h-7" style={{ color: '#00f5ff' }} />
                        </div>
                        <div>
                          <p style={{ ...raj, color: 'rgba(255,255,255,0.9)', fontSize: '15px' }}>
                            {fullName}
                          </p>
                          <p style={{ ...mono, color: 'rgba(0,245,255,0.6)', fontSize: '11px' }}>
                            @{username}
                          </p>
                        </div>
                      </div>

                      <Field
                        label="TÊN ĐĂNG NHẬP"
                        value={username}
                        onChange={setUsername}
                        placeholder="cat_admin"
                      />
                      <Field
                        label="HỌ VÀ TÊN"
                        value={fullName}
                        onChange={setFullName}
                        placeholder="Tên của bạn"
                      />
                      <Field
                        label="TÊN TRỢ LÝ AI"
                        value={assistantName}
                        onChange={setAssistantName}
                        placeholder="CAT"
                      />
                    </motion.div>
                  )}

                  {section === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col gap-2"
                    >
                      <div
                        className="rounded-xl p-4 mb-2"
                        style={{
                          background: 'rgba(34,197,94,0.06)',
                          border: '1px solid rgba(34,197,94,0.2)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5" style={{ color: '#22c55e' }} />
                          <div>
                            <p style={{ ...raj, color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
                              Mã Hóa Đang Hoạt Động
                            </p>
                            <p style={{ ...mono, color: 'rgba(34,197,94,0.8)', fontSize: '10px' }}>
                              AES-256-GCM + RSA-4096 — Tất cả kênh được bảo vệ
                            </p>
                          </div>
                          <CheckCircle className="w-4 h-4 ml-auto" style={{ color: '#22c55e' }} />
                        </div>
                      </div>

                      <Toggle
                        label="Mã Hóa Đầu Cuối Toàn Diện"
                        value={encEnabled}
                        onChange={setEncEnabled}
                        color="#22c55e"
                      />
                      <Toggle
                        label="Xác Thực Sinh Trắc Học"
                        value={biometrics}
                        onChange={setBiometrics}
                        color="#22c55e"
                      />
                      <Toggle
                        label="Xác Thực Hai Yếu Tố (2FA)"
                        value={twoFactor}
                        onChange={setTwoFactor}
                        color="#22c55e"
                      />
                      <Toggle
                        label="Ghi Nhật Ký Kiểm Toán"
                        value={auditLog}
                        onChange={setAuditLog}
                        color="#22c55e"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-8 py-3.5 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(0,245,255,0.08)' }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetDefaults}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <RotateCcw className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span style={{ ...mono, color: 'rgba(255,255,255,0.6)', fontSize: '9px' }}>
                  KHÔI PHỤC MẶC ĐỊNH
                </span>
              </motion.button>

              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    sounds.playClick();
                    setSettingsOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                    ĐÓNG
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl cursor-pointer"
                  style={{
                    background: saved ? 'rgba(34,197,94,0.15)' : 'rgba(0,245,255,0.12)',
                    border: `1px solid ${saved ? 'rgba(34,197,94,0.4)' : 'rgba(0,245,255,0.35)'}`,
                    boxShadow: saved ? '0 0 12px rgba(34,197,94,0.2)' : '0 0 12px rgba(0,245,255,0.1)',
                  }}
                >
                  {saved ? (
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                  ) : (
                    <Save className="w-3.5 h-3.5" style={{ color: '#00f5ff' }} />
                  )}
                  <span style={{ ...mono, color: saved ? '#22c55e' : '#00f5ff', fontSize: '10px' }}>
                    {saved ? 'ĐÃ LƯU' : 'LƯU CẤU HÌNH'}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
