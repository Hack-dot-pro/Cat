import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, Brain, Key, Shield, Eye, EyeOff, ChevronDown,
  CheckCircle, AlertCircle, Save, RotateCcw, Lock, Volume2,
  Cpu, Wrench, RefreshCw, Play, Globe, Zap, Bot, VolumeX, Plus, Trash2, ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';
import { deepVoice } from '../services/deepVoice';
import {
  openAIService,
  PROVIDER_PRESETS,
  AIProvider,
  AISettings,
  FallbackEndpoint
} from '../services/openai';
import { mcpService } from '../services/mcp';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

type Section = 'user' | 'ai' | 'fallback' | 'web' | 'mcp' | 'sound' | 'security';

const SECTIONS: { id: Section; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'user', label: 'HỒ SƠ NGƯỜI DÙNG', icon: User, color: '#00f5ff' },
  { id: 'ai', label: 'CẤU HÌNH AI & GATEWAY', icon: Brain, color: '#a855f7' },
  { id: 'fallback', label: 'CỔNG API DỰ PHÒNG (FAILOVER)', icon: Zap, color: '#f59e0b' },
  { id: 'web', label: 'DUYỆT WEB & TÀI LIỆU', icon: Globe, color: '#0ea5e9' },
  { id: 'mcp', label: 'GIAO THỨC MCP', icon: Wrench, color: '#22c55e' },
  { id: 'sound', label: 'ÂM THANH & GIỌNG ĐỌC', icon: Volume2, color: '#ec4899' },
  { id: 'security', label: 'BẢO MẬT & MÃ HÓA', icon: Shield, color: '#64748b' },
];

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  description = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  description?: string;
}) {
  const [show, setShow] = useState(false);
  const isSecret = type === 'password';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label style={{ ...mono, color: 'rgba(0,245,255,0.7)', fontSize: '10px' }}>{label}</label>
        {description && (
          <span style={{ ...aptos, color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{description}</span>
        )}
      </div>
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{
          background: 'rgba(0,5,15,0.75)',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'border-color 0.2s',
        }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(0,245,255,0.4)')}
        onBlurCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
      >
        <input
          type={isSecret && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none"
          style={{ ...aptos, color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}
        />
        {isSecret && (
          <button
            onClick={() => {
              sounds.playClick();
              setShow(!show);
            }}
            className="text-gray-400 hover:text-cyan-400 p-1 cursor-pointer"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
      <span style={{ ...aptos, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>{label}</span>
      <motion.button
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
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    aiSettings,
    updateAiSettings,
    userFullName,
    setUserFullName,
    userName,
    setUserName,
    voiceEnabled,
    setVoiceEnabled,
    voiceAutoSpeak,
    setVoiceAutoSpeak,
    voicePitch,
    setVoicePitch,
    voiceRate,
    setVoiceRate,
    isSpeaking,
    stopSpeaking,
  } = useApp();

  const [section, setSection] = useState<Section>('ai');
  const [saved, setSaved] = useState(false);

  // User profile
  const [localFullName, setLocalFullName] = useState(userFullName);
  const [localUserName, setLocalUserName] = useState(userName);
  const [assistantName, setAssistantName] = useState('Thư Ký Kim');

  // AI settings
  const [provider, setProvider] = useState<AIProvider>(aiSettings.provider || 'xkiro');
  const [baseUrl, setBaseUrl] = useState(aiSettings.baseUrl || 'https://api.xkiro.com/v1');
  const [apiKey, setApiKey] = useState(aiSettings.apiKey || '');
  const [model, setModel] = useState(aiSettings.model || 'Gwen 3.8 max');
  const [temperature, setTemperature] = useState(aiSettings.temperature ?? 0.7);
  const [topP, setTopP] = useState(aiSettings.topP ?? 0.95);
  const [contextWindow, setContextWindow] = useState(aiSettings.contextWindow ?? 8192);
  const [inferenceSpeed, setInferenceSpeed] = useState(aiSettings.inferenceSpeed ?? 1.0);
  const [systemPrompt, setSystemPrompt] = useState(aiSettings.systemPrompt || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);

  // Multi-API Fallback States
  const [autoFallbackEnabled, setAutoFallbackEnabled] = useState<boolean>(aiSettings.autoFallbackEnabled ?? true);
  const [fallbackEndpoints, setFallbackEndpoints] = useState<FallbackEndpoint[]>(aiSettings.fallbackEndpoints || []);
  const [testingFallbackId, setTestingFallbackId] = useState<string | null>(null);

  // New Fallback Form
  const [newFbName, setNewFbName] = useState('');
  const [newFbProvider, setNewFbProvider] = useState<AIProvider>('openrouter');
  const [newFbBaseUrl, setNewFbBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [newFbApiKey, setNewFbApiKey] = useState('');
  const [newFbModel, setNewFbModel] = useState('deepseek/deepseek-r1');
  const [showAddFbForm, setShowAddFbForm] = useState(false);

  // Web Browsing & Online Research State
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(aiSettings.webSearchEnabled ?? true);

  // Security
  const [encEnabled, setEncEnabled] = useState(true);
  const [biometrics, setBiometrics] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [auditLog, setAuditLog] = useState(true);

  const handleProviderChange = (newProvider: AIProvider) => {
    sounds.playClick();
    setProvider(newProvider);
    const preset = PROVIDER_PRESETS[newProvider];
    if (preset) {
      setBaseUrl(preset.defaultBaseUrl);
      setModel(preset.defaultModel);
    }
  };

  const handleTestConnection = async () => {
    sounds.playScan();
    setTestingConnection(true);
    setTestResult(null);

    // Save temporary settings to test
    openAIService.saveSettings({
      provider,
      baseUrl,
      apiKey,
      model,
      temperature,
      contextWindow,
    });

    const result = await openAIService.testConnection();
    setTestingConnection(false);
    setTestResult(result);

    if (result.success) {
      sounds.playSuccess();
      addNotification({
        type: 'success',
        title: 'Kết nối API chính thành công',
        message: `${result.message} (${result.latencyMs}ms)`,
      });
    } else {
      sounds.playError();
      addNotification({
        type: 'error',
        title: 'Kết nối thất bại',
        message: result.message,
      });
    }
  };

  const handleTestFallbackEndpoint = async (ep: FallbackEndpoint) => {
    sounds.playScan();
    setTestingFallbackId(ep.id);

    const result = await openAIService.testEndpoint({
      baseUrl: ep.baseUrl,
      apiKey: ep.apiKey,
      model: ep.model,
      name: ep.name,
    });

    setTestingFallbackId(null);

    setFallbackEndpoints(prev =>
      prev.map(item =>
        item.id === ep.id
          ? {
              ...item,
              lastLatencyMs: result.latencyMs,
              lastTestedAt: new Date().toLocaleTimeString('vi-VN'),
              lastStatus: result.success ? 'connected' : 'error',
            }
          : item
      )
    );

    if (result.success) {
      sounds.playSuccess();
      addNotification({
        type: 'success',
        title: `Cổng ${ep.name} trực tuyến`,
        message: `Độ trễ: ${result.latencyMs}ms`,
      });
    } else {
      sounds.playError();
      addNotification({
        type: 'error',
        title: `Cổng ${ep.name} không kết nối được`,
        message: result.message,
      });
    }
  };

  const handleAddFallbackEndpoint = () => {
    if (!newFbBaseUrl.trim()) return;
    sounds.playSuccess();

    const newEndpoint: FallbackEndpoint = {
      id: 'custom_fb_' + Date.now(),
      name: newFbName.trim() || `${newFbProvider.toUpperCase()} Gateway`,
      provider: newFbProvider,
      baseUrl: newFbBaseUrl.trim(),
      apiKey: newFbApiKey.trim(),
      model: newFbModel.trim() || 'default',
      enabled: true,
      priority: fallbackEndpoints.length + 1,
      lastStatus: 'idle',
    };

    setFallbackEndpoints(prev => [...prev, newEndpoint]);
    setNewFbName('');
    setNewFbApiKey('');
    setShowAddFbForm(false);

    addNotification({
      type: 'success',
      title: 'Đã thêm cổng API dự phòng',
      message: `Cổng ${newEndpoint.name} đã sẵn sàng trong danh sách failover.`,
    });
  };

  const handleDeleteFallback = (id: string) => {
    sounds.playClick();
    setFallbackEndpoints(prev => prev.filter(ep => ep.id !== id));
  };

  const handleToggleFallback = (id: string, enabled: boolean) => {
    sounds.playClick();
    setFallbackEndpoints(prev =>
      prev.map(ep => (ep.id === id ? { ...ep, enabled } : ep))
    );
  };

  const handleSave = () => {
    sounds.playSuccess();
    setSaved(true);

    // Save user profile
    setUserFullName(localFullName);
    setUserName(localUserName);
    localStorage.setItem('kim_user_fullname', localFullName);
    localStorage.setItem('kim_user_name', localUserName);

    // Save AI settings
    updateAiSettings({
      provider,
      baseUrl,
      apiKey,
      model,
      temperature,
      topP,
      contextWindow,
      inferenceSpeed,
      systemPrompt,
      autoFallbackEnabled,
      fallbackEndpoints,
      webSearchEnabled,
    });

    addNotification({
      type: 'success',
      title: 'Cài đặt đã lưu',
      message: 'Toàn bộ cấu hình hệ thống Thư Ký Kim và API Fallback đã được áp dụng.',
    });

    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
          style={{ zIndex: 180, background: 'rgba(0, 4, 12, 0.92)', backdropFilter: 'blur(16px)' }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col"
            style={{
              maxHeight: '90vh',
              background: 'rgba(0, 10, 25, 0.96)',
              border: '1px solid rgba(0,245,255,0.25)',
              boxShadow: '0 0 50px rgba(0,245,255,0.12), inset 0 0 30px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-8 py-5 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0,245,255,0.15)' }}
            >
              <div>
                <h2 style={{ ...orb, color: '#00f5ff', fontSize: '16px', letterSpacing: '0.2em', margin: 0 }}>
                  CẤU HÌNH HỆ THỐNG THƯ KÝ KIM
                </h2>
                <p style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '10px', marginTop: 4 }}>
                  THƯ KÝ KIM NEURAL ASSISTANT v3.8 — OPENAI COMPLETIONS & MULTI-API FAILOVER
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  sounds.playClick();
                  setSettingsOpen(false);
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <X className="w-5 h-5" style={{ color: '#ef4444' }} />
              </motion.button>
            </div>

            <div className="flex flex-1 overflow-hidden" style={{ minHeight: 460 }}>
              {/* Sidebar */}
              <div
                className="w-64 flex flex-col gap-1 p-4 flex-shrink-0"
                style={{ borderRight: '1px solid rgba(0,245,255,0.1)' }}
              >
                {SECTIONS.map(s => (
                  <motion.button
                    key={s.id}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      sounds.playClick();
                      setSection(s.id);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-left transition-all"
                    style={{
                      background: section === s.id ? `${s.color}15` : 'transparent',
                      border: `1px solid ${section === s.id ? `${s.color}35` : 'transparent'}`,
                    }}
                  >
                    <s.icon className="w-4 h-4 flex-shrink-0" style={{ color: section === s.id ? s.color : 'rgba(255,255,255,0.35)' }} />
                    <span style={{ ...mono, color: section === s.id ? s.color : 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                      {s.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-8" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,245,255,0.2) transparent' }}>
                <AnimatePresence mode="wait">
                  {/* USER PROFILE SECTION */}
                  {section === 'user' && (
                    <motion.div key="user" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-4">
                      <h3 style={{ ...orb, color: '#00f5ff', fontSize: '13px' }}>THÔNG TIN NGƯỜI DÙNG QUẢN TRỊ (ANH VINH)</h3>
                      <Field label="FULL NAME (HỌ VÀ TÊN)" value={localFullName} onChange={setLocalFullName} placeholder="Vinh" />
                      <Field label="USERNAME (TÊN ĐĂNG NHẬP)" value={localUserName} onChange={setLocalUserName} placeholder="Vinh_Admin" />
                      <Field label="TÊN TRỢ LÝ AI" value={assistantName} onChange={setAssistantName} placeholder="Thư Ký Kim" />
                    </motion.div>
                  )}

                  {/* AI MODEL & GATEWAY SECTION */}
                  {section === 'ai' && (
                    <motion.div key="ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <h3 style={{ ...orb, color: '#a855f7', fontSize: '13px' }}>CỔNG KẾT NỐI CHÍNH (PRIMARY GATEWAY)</h3>
                        <span style={{ ...mono, color: '#22c55e', fontSize: '10px' }}>TƯƠNG THÍCH OPENAI COMPLETIONS</span>
                      </div>

                      {/* Provider Select Grid */}
                      <div className="flex flex-col gap-2">
                        <label style={{ ...mono, color: 'rgba(168,85,247,0.8)', fontSize: '10px' }}>CHỌN NỀN TẢNG CUNG CẤP (AI PROVIDER)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(Object.keys(PROVIDER_PRESETS) as AIProvider[]).map(p => {
                            const isSelected = provider === p;
                            return (
                              <button
                                key={p}
                                onClick={() => handleProviderChange(p)}
                                className="p-3 rounded-xl flex flex-col items-start gap-1 cursor-pointer transition-all text-left"
                                style={{
                                  background: isSelected ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${isSelected ? '#a855f7' : 'rgba(255,255,255,0.08)'}`,
                                }}
                              >
                                <span style={{ ...orb, color: isSelected ? '#a855f7' : 'rgba(255,255,255,0.8)', fontSize: '11px' }}>
                                  {PROVIDER_PRESETS[p].name}
                                </span>
                                <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '8px' }}>
                                  {PROVIDER_PRESETS[p].defaultModel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Field
                        label="BASE URL (ĐỊA CHỈ API GATEWAY)"
                        value={baseUrl}
                        onChange={setBaseUrl}
                        placeholder="https://api.xkiro.com/v1"
                        description="Ví dụ: https://api.xkiro.com/v1 hoặc https://api.openai.com/v1"
                      />

                      <Field
                        label="API KEY (KHÓA XÁC THỰC)"
                        value={apiKey}
                        onChange={setApiKey}
                        type="password"
                        placeholder="Nhập khóa API Key bí mật..."
                        description="API Key được lưu trữ cục bộ trên trình duyệt."
                      />

                      <Field
                        label="TÊN MÔ HÌNH (MODEL NAME)"
                        value={model}
                        onChange={setModel}
                        placeholder="Gwen 3.8 max"
                        description="Ví dụ: Gwen 3.8 max, deepseek-r1, gpt-4o, claude-3.5-sonnet"
                      />

                      {/* Connection Test Button */}
                      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.15)' }}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleTestConnection}
                          disabled={testingConnection}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                          {testingConnection ? 'ĐANG KIỂM TRA...' : 'TEST KẾT NỐI API CHÍNH'}
                        </motion.button>
                        {testResult && (
                          <div className="flex items-center gap-2">
                            {testResult.success ? (
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                            <span style={{ ...aptos, color: testResult.success ? '#4ade80' : '#f87171', fontSize: '12px' }}>
                              {testResult.message} ({testResult.latencyMs}ms)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Parameters Sliders */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-black/40 border border-white/10">
                          <div className="flex justify-between items-center">
                            <span style={{ ...mono, color: 'rgba(0,245,255,0.8)', fontSize: '10px' }}>CONTEXT WINDOW (MAX TOKENS):</span>
                            <span style={{ ...mono, color: '#00f5ff', fontSize: '11px' }}>{contextWindow} tokens</span>
                          </div>
                          <input type="range" min={512} max={32768} step={512} value={contextWindow} onChange={e => setContextWindow(parseInt(e.target.value, 10))} className="w-full" />
                        </div>
                        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-black/40 border border-white/10">
                          <div className="flex justify-between items-center">
                            <span style={{ ...mono, color: 'rgba(0,245,255,0.8)', fontSize: '10px' }}>NHIỆT ĐỘ SÁNG TẠO (TEMPERATURE):</span>
                            <span style={{ ...mono, color: '#00f5ff', fontSize: '11px' }}>{temperature.toFixed(2)}</span>
                          </div>
                          <input type="range" min={0.1} max={1.5} step={0.05} value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* MULTI-API FALLBACK POOL SECTION */}
                  {section === 'fallback' && (
                    <motion.div key="fallback" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <h3 style={{ ...orb, color: '#f59e0b', fontSize: '13px', margin: 0 }}>
                            HỆ THỐNG CỔNG API DỰ PHÒNG (MULTI-API FAILOVER POOL)
                          </h3>
                        </div>
                        <span style={{ ...mono, color: '#22c55e', fontSize: '10px' }}>
                          {fallbackEndpoints.filter(f => f.enabled).length}/{fallbackEndpoints.length} CỔNG ĐANG BẬT
                        </span>
                      </div>

                      <p style={{ ...aptos, color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
                        Khi cổng API chính gặp sự cố (hết quota, rate limit 429, nghẽn mạng 502/503), Thư Ký Kim sẽ <strong>tự động chuyển tiếp tức thì</strong> sang các cổng dự phòng theo thứ tự ưu tiên bên dưới mà không làm gián đoạn cuộc trò chuyện của anh.
                      </p>

                      <Toggle
                        label="Bật chế độ tự động chuyển sang API dự phòng khi API chính lỗi (Auto-Failover)"
                        value={autoFallbackEnabled}
                        onChange={setAutoFallbackEnabled}
                        color="#f59e0b"
                      />

                      {/* Fallback Endpoints List */}
                      <div className="flex flex-col gap-3">
                        {fallbackEndpoints.map((ep, index) => (
                          <div
                            key={ep.id}
                            className="p-4 rounded-xl flex flex-col gap-3"
                            style={{
                              background: ep.enabled ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${ep.enabled ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Ưu tiên #{index + 1}
                                </span>
                                <h4 style={{ ...orb, color: ep.enabled ? '#f59e0b' : 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>
                                  {ep.name}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2">
                                <Toggle
                                  label=""
                                  value={ep.enabled}
                                  onChange={v => handleToggleFallback(ep.id, v)}
                                  color="#f59e0b"
                                />
                                <button
                                  onClick={() => handleDeleteFallback(ep.id)}
                                  className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                  title="Xóa cổng dự phòng này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="p-2 rounded bg-black/40 border border-white/5 truncate">
                                <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>BASE URL: </span>
                                <span style={{ ...aptos, color: 'rgba(255,255,255,0.85)' }}>{ep.baseUrl}</span>
                              </div>
                              <div className="p-2 rounded bg-black/40 border border-white/5 truncate">
                                <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>MODEL: </span>
                                <span style={{ ...mono, color: '#00f5ff' }}>{ep.model}</span>
                              </div>
                              <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                                <div className="truncate">
                                  <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>API KEY: </span>
                                  <span style={{ ...mono, color: ep.apiKey ? '#4ade80' : '#f87171' }}>
                                    {ep.apiKey ? '••••••••' + ep.apiKey.slice(-4) : 'Chưa nhập key'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <input
                                type="password"
                                placeholder={`Nhập API Key cho ${ep.name}...`}
                                value={ep.apiKey}
                                onChange={e => {
                                  const val = e.target.value;
                                  setFallbackEndpoints(prev =>
                                    prev.map(item => (item.id === ep.id ? { ...item, apiKey: val } : item))
                                  );
                                }}
                                className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white outline-none flex-1 max-w-sm"
                              />

                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleTestFallbackEndpoint(ep)}
                                disabled={testingFallbackId === ep.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw className={`w-3 h-3 ${testingFallbackId === ep.id ? 'animate-spin' : ''}`} />
                                {testingFallbackId === ep.id ? 'Đang test...' : 'Test Cổng'}
                                {ep.lastLatencyMs !== undefined && ` (${ep.lastLatencyMs}ms)`}
                              </motion.button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add New Fallback Button / Form */}
                      {!showAddFbForm ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            sounds.playClick();
                            setShowAddFbForm(true);
                          }}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-amber-500/40 text-amber-300 font-mono text-xs cursor-pointer hover:bg-amber-500/10"
                        >
                          <Plus className="w-4 h-4" />
                          THÊM CỔNG API DỰ PHÒNG MỚI (CUSTOM FALLBACK GATEWAY)
                        </motion.button>
                      ) : (
                        <div className="p-4 rounded-xl bg-black/60 border border-amber-500/40 flex flex-col gap-3">
                          <h4 style={{ ...orb, color: '#f59e0b', fontSize: '12px' }}>THÊM CỔNG API DỰ PHÒNG MỚI</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="TÊN GỢI NHỚ" value={newFbName} onChange={setNewFbName} placeholder="Ví dụ: Groq Mixtral Backup" />
                            <Field label="BASE URL" value={newFbBaseUrl} onChange={setNewFbBaseUrl} placeholder="https://api.groq.com/openai/v1" />
                            <Field label="API KEY" value={newFbApiKey} onChange={setNewFbApiKey} type="password" placeholder="Nhập API Key..." />
                            <Field label="MODEL NAME" value={newFbModel} onChange={setNewFbModel} placeholder="llama-3.3-70b-versatile" />
                          </div>
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => setShowAddFbForm(false)}
                              className="px-3 py-1.5 rounded-lg border border-white/20 text-white/70 text-xs font-mono cursor-pointer"
                            >
                              HỦY
                            </button>
                            <button
                              onClick={handleAddFallbackEndpoint}
                              className="px-4 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-xs font-mono cursor-pointer"
                            >
                              LƯU VÀO DANH SÁCH DỰ PHÒNG
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* WEB BROWSING & LIVE RESEARCH SECTION */}
                  {section === 'web' && (
                    <motion.div key="web" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          <h3 style={{ ...orb, color: '#00f5ff', fontSize: '13px', margin: 0 }}>
                            DUYỆT WEB & THAM KHẢO TÀI LIỆU TRỰC TUYẾN
                          </h3>
                        </div>
                        <span style={{ ...mono, color: '#22c55e', fontSize: '10px' }}>LIVE WEB INTELLIGENCE</span>
                      </div>

                      <p style={{ ...aptos, color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
                        Cho phép Thư Ký Kim tự động tìm kiếm thông tin thời sự, tin tức mới nhất, tài liệu kỹ thuật, GitHub, Wikipedia và đọc trích xuất nội dung từ bất kỳ đường link URL nào anh cung cấp để phản hồi chính xác và đầy đủ nhất.
                      </p>

                      <Toggle
                        label="Kích hoạt tự động tìm kiếm Web & Đọc link URL khi anh hỏi (Web Browsing MCP)"
                        value={webSearchEnabled}
                        onChange={setWebSearchEnabled}
                        color="#00f5ff"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col gap-1.5">
                          <span style={{ ...orb, color: '#00f5ff', fontSize: '11px' }}>🌐 kim_web_search</span>
                          <span style={{ ...aptos, color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                            Tìm kiếm trực tiếp trên DuckDuckGo & Google News & Wikipedia để thu thập dữ liệu thời gian thực.
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col gap-1.5">
                          <span style={{ ...orb, color: '#00f5ff', fontSize: '11px' }}>📄 kim_web_browse</span>
                          <span style={{ ...aptos, color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                            Trích xuất toàn bộ văn bản và cấu trúc bài báo, tài liệu học thuật từ đường dẫn URL.
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col gap-1.5">
                          <span style={{ ...orb, color: '#00f5ff', fontSize: '11px' }}>📚 kim_wikipedia_search</span>
                          <span style={{ ...aptos, color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                            Tra cứu bách khoa toàn thư Wikipedia Tiếng Việt và Quốc Tế.
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col gap-1.5">
                          <span style={{ ...orb, color: '#00f5ff', fontSize: '11px' }}>💻 kim_online_doc_reference</span>
                          <span style={{ ...aptos, color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                            Tra cứu đặc tả kỹ thuật framework, thư viện lập trình (React, Python, Node, v.v.).
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* MCP PROTOCOL SECTION */}
                  {section === 'mcp' && (
                    <motion.div key="mcp" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <h3 style={{ ...orb, color: '#22c55e', fontSize: '13px' }}>GIAO THỨC MODEL CONTEXT PROTOCOL (MCP)</h3>
                        <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
                          {mcpService.getTools().length} CÔNG CỤ ĐÃ SẴN SÀNG
                        </span>
                      </div>

                      <p style={{ ...aptos, color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
                        Giao thức MCP cho phép Thư Ký Kim kết nối và thực thi các công cụ bên ngoài (duyệt web, máy tính toán học, trích xuất dữ liệu, quét hệ thống, máy chủ API nội bộ) tự động trong quá trình xử lý câu hỏi.
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        {mcpService.getTools().map(t => (
                          <div
                            key={t.name}
                            className="p-3 rounded-xl flex items-center justify-between"
                            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
                          >
                            <div className="flex flex-col">
                              <span style={{ ...mono, color: '#22c55e', fontSize: '11px' }}>{t.name}</span>
                              <span style={{ ...aptos, color: 'rgba(255,255,255,0.6)', fontSize: '11px', lineHeight: 1.3 }}>
                                {t.description.slice(0, 55)}...
                              </span>
                            </div>
                            <Toggle
                              label=""
                              value={t.enabled}
                              onChange={v => mcpService.toggleTool(t.name, v)}
                              color="#22c55e"
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* SOUND & VOICE SETTINGS SECTION */}
                  {section === 'sound' && (
                    <motion.div key="sound" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-5">
                      {/* Cute Female Voice Engine Section */}
                      <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.3)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-pink-400" />
                            <h3 style={{ ...orb, color: '#ec4899', fontSize: '13px', margin: 0 }}>
                              GIỌNG ĐỌC NỮ DỄ THƯƠNG (THƯ KÝ KIM)
                            </h3>
                          </div>
                          <span style={{ ...mono, color: '#22c55e', fontSize: '9px' }}>
                            {deepVoice.getSelectedVoiceName()}
                          </span>
                        </div>

                        <p style={{ ...aptos, color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>
                          Động cơ tổng hợp giọng đọc Web Speech API với độ trễ 0ms, sử dụng tông nữ thanh thoát, dễ thương, ngọt ngào và tự động phát âm thanh khi có phản hồi mới từ Thư Ký Kim.
                        </p>

                        <Toggle
                          label="Kích hoạt động cơ Giọng đọc Nữ Dễ Thương"
                          value={voiceEnabled}
                          onChange={setVoiceEnabled}
                          color="#ec4899"
                        />

                        <Toggle
                          label="Tự động đọc to khi Thư Ký Kim phản hồi (Auto-Speak)"
                          value={voiceAutoSpeak}
                          onChange={setVoiceAutoSpeak}
                          color="#ec4899"
                        />

                        {/* Sliders: Pitch & Rate */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                          {/* Pitch */}
                          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-black/40 border border-pink-500/20">
                            <div className="flex justify-between items-center">
                              <span style={{ ...mono, color: 'rgba(244,114,182,0.9)', fontSize: '10px' }}>
                                ĐỘ THANH / DỄ THƯƠNG (PITCH):
                              </span>
                              <span style={{ ...mono, color: '#ec4899', fontSize: '11px' }}>{voicePitch.toFixed(2)}</span>
                            </div>
                            <input
                              type="range"
                              min={0.8}
                              max={1.6}
                              step={0.02}
                              value={voicePitch}
                              onChange={e => setVoicePitch(parseFloat(e.target.value))}
                              className="w-full"
                            />
                            <span style={{ ...aptos, color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>
                              1.18 = Giọng nữ trong trẻo, ngọt ngào, dễ thương
                            </span>
                          </div>

                          {/* Rate */}
                          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-black/40 border border-pink-500/20">
                            <div className="flex justify-between items-center">
                              <span style={{ ...mono, color: 'rgba(244,114,182,0.9)', fontSize: '10px' }}>
                                TỐC ĐỘ NÓI TỰ NHIÊN (RATE):
                              </span>
                              <span style={{ ...mono, color: '#ec4899', fontSize: '11px' }}>{voiceRate.toFixed(2)}x</span>
                            </div>
                            <input
                              type="range"
                              min={0.8}
                              max={1.4}
                              step={0.02}
                              value={voiceRate}
                              onChange={e => setVoiceRate(parseFloat(e.target.value))}
                              className="w-full"
                            />
                            <span style={{ ...aptos, color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>
                              1.02 = Tốc độ tươi tắn, nhã nhặn, tự nhiên
                            </span>
                          </div>
                        </div>

                        {/* Test voice button */}
                        <div className="flex items-center gap-3 mt-1">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              sounds.playClick();
                              if (isSpeaking) {
                                stopSpeaking();
                              } else {
                                deepVoice.testVoice();
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600/20 border border-pink-500/40 text-pink-200 text-xs font-mono cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4 text-pink-400" />
                            <span>{isSpeaking ? 'DỪNG ĐỌC' : 'THỬ NGHIỆM GIỌNG NỮ THƯ KÝ KIM'}</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Sci-Fi Web Audio SFX Section */}
                      <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.15)' }}>
                        <h3 style={{ ...orb, color: '#0ea5e9', fontSize: '13px', margin: 0 }}>
                          HIỆU ỨNG ÂM THANH TỔNG HỢP SCI-FI (WEB AUDIO)
                        </h3>

                        <Toggle
                          label="Bật hiệu ứng âm thanh tổng hợp Web Audio"
                          value={soundEnabled}
                          onChange={setSoundEnabled}
                          color="#0ea5e9"
                        />

                        <div className="flex flex-col gap-2 p-3 rounded-lg bg-black/40 border border-white/10">
                          <div className="flex justify-between items-center">
                            <span style={{ ...mono, color: 'rgba(0,245,255,0.8)', fontSize: '10px' }}>ÂM LƯỢNG HỆ THỐNG:</span>
                            <span style={{ ...mono, color: '#0ea5e9', fontSize: '11px' }}>{Math.round(soundVolume * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={soundVolume}
                            onChange={e => setSoundVolume(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SECURITY SECTION */}
                  {section === 'security' && (
                    <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-4">
                      <h3 style={{ ...orb, color: '#f59e0b', fontSize: '13px' }}>BẢO MẬT & MÃ HÓA HỆ THỐNG</h3>
                      <Toggle label="Mã hóa bộ nhớ đệm chuẩn AES-256" value={encEnabled} onChange={setEncEnabled} color="#f59e0b" />
                      <Toggle label="Xác thực sinh trắc học / Giọng nói" value={biometrics} onChange={setBiometrics} color="#f59e0b" />
                      <Toggle label="Xác thực hai lớp (2FA)" value={twoFactor} onChange={setTwoFactor} color="#f59e0b" />
                      <Toggle label="Ghi nhật ký kiểm toán hệ thống (Audit Log)" value={auditLog} onChange={setAuditLog} color="#f59e0b" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Buttons */}
            <div
              className="flex items-center justify-between px-8 py-4 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(0,245,255,0.15)', background: 'rgba(0,5,15,0.8)' }}
            >
              <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
                HỆ ĐIỀU HÀNH THƯ KÝ KIM v3.8
              </span>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
                >
                  ĐÓNG
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono cursor-pointer"
                  style={{
                    background: saved ? 'rgba(34,197,94,0.3)' : 'rgba(0,245,255,0.2)',
                    border: `1px solid ${saved ? '#22c55e' : '#00f5ff'}`,
                    color: saved ? '#4ade80' : '#00f5ff',
                  }}
                >
                  <Save className="w-3.5 h-3.5" />
                  {saved ? 'ĐÃ LƯU THÀNH CÔNG!' : 'LƯU TẤT CẢ CẤU HÌNH'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
