import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, Brain, Key, Shield, Eye, EyeOff, ChevronDown,
  CheckCircle, AlertCircle, Save, RotateCcw, Lock, Volume2,
  Cpu, Wrench, RefreshCw, Play, Globe, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';
import {
  openAIService,
  PROVIDER_PRESETS,
  AIProvider,
  AISettings
} from '../services/openai';
import { mcpService } from '../services/mcp';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

type Section = 'user' | 'ai' | 'mcp' | 'sound' | 'security';

const SECTIONS: { id: Section; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'user', label: 'HỒ SƠ NGƯỜI DÙNG', icon: User, color: '#00f5ff' },
  { id: 'ai', label: 'CẤU HÌNH AI & GATEWAY', icon: Brain, color: '#a855f7' },
  { id: 'mcp', label: 'GIAO THỨC MCP', icon: Wrench, color: '#22c55e' },
  { id: 'sound', label: 'ÂM THANH SCI-FI', icon: Volume2, color: '#0ea5e9' },
  { id: 'security', label: 'BẢO MẬT & MÃ HÓA', icon: Shield, color: '#f59e0b' },
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
            className="cursor-pointer p-1"
          >
            {show ? (
              <EyeOff className="w-4 h-4 text-cyan-400" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400" />
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
      <span style={{ ...aptos, color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{label}</span>
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
  } = useApp();

  const [section, setSection] = useState<Section>('ai');
  const [saved, setSaved] = useState(false);

  // User profile
  const [localFullName, setLocalFullName] = useState(userFullName);
  const [localUserName, setLocalUserName] = useState(userName);
  const [assistantName, setAssistantName] = useState('CAT AI');

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
        title: 'Kết nối API thành công',
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

  const handleSave = () => {
    sounds.playSuccess();
    setSaved(true);

    // Save user profile
    setUserFullName(localFullName);
    setUserName(localUserName);
    localStorage.setItem('cat_user_fullname', localFullName);
    localStorage.setItem('cat_user_name', localUserName);

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
    });

    addNotification({
      type: 'success',
      title: 'Cài đặt đã lưu',
      message: 'Toàn bộ cấu hình hệ thống CAT AI đã được áp dụng.',
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
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col"
            style={{
              maxHeight: '90vh',
              background: 'rgba(0, 10, 25, 0.96)',
              border: '1px solid rgba(0,245,255,0.25)',
              boxShadow: '0 0 60px rgba(0,245,255,0.12), inset 0 0 30px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-8 py-5 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0,245,255,0.15)' }}
            >
              <div>
                <h2 style={{ ...orb, color: '#00f5ff', fontSize: '16px', letterSpacing: '0.2em', margin: 0 }}>
                  CẤU HÌNH HỆ THỐNG CAT AI
                </h2>
                <p style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '10px', marginTop: 4 }}>
                  CAT AI NEURAL OS v3.8 — OPENAI COMPLETIONS & MCP GATEWAY
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
                className="w-60 flex flex-col gap-1 p-4 flex-shrink-0"
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
                      <h3 style={{ ...orb, color: '#00f5ff', fontSize: '13px' }}>THÔNG TIN NGƯỜI DÙNG QUẢN TRỊ</h3>
                      <Field label="FULL NAME (HỌ VÀ TÊN)" value={localFullName} onChange={setLocalFullName} placeholder="Vinh" />
                      <Field label="USERNAME (TÊN ĐĂNG NHẬP)" value={localUserName} onChange={setLocalUserName} placeholder="Vinh_Admin" />
                      <Field label="TÊN TRỢ LÝ AI" value={assistantName} onChange={setAssistantName} placeholder="CAT AI" />
                    </motion.div>
                  )}

                  {/* AI MODEL & GATEWAY SECTION */}
                  {section === 'ai' && (
                    <motion.div key="ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <h3 style={{ ...orb, color: '#a855f7', fontSize: '13px' }}>CHUẨN KẾT NỐI OPENAI COMPLETIONS</h3>
                        <span style={{ ...mono, color: '#22c55e', fontSize: '10px' }}>TƯƠNG THÍCH ĐA NỀN TẢNG</span>
                      </div>

                      {/* Provider selector grid */}
                      <div className="flex flex-col gap-1.5">
                        <label style={{ ...mono, color: 'rgba(0,245,255,0.7)', fontSize: '10px' }}>NHÀ CUNG CẤP API (PROVIDER):</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(Object.keys(PROVIDER_PRESETS) as AIProvider[]).map(pKey => {
                            const preset = PROVIDER_PRESETS[pKey];
                            const isSelected = provider === pKey;

                            return (
                              <button
                                key={pKey}
                                onClick={() => handleProviderChange(pKey)}
                                className="p-2.5 rounded-xl flex flex-col items-start gap-1 text-left cursor-pointer transition-all"
                                style={{
                                  background: isSelected ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${isSelected ? '#a855f7' : 'rgba(255,255,255,0.08)'}`,
                                }}
                              >
                                <span style={{ ...mono, color: isSelected ? '#a855f7' : '#fff', fontSize: '11px', fontWeight: 600 }}>
                                  {preset.name}
                                </span>
                                <span style={{ ...aptos, color: 'rgba(255,255,255,0.4)', fontSize: '9px' }} className="line-clamp-1">
                                  {preset.defaultModel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Base URL & API Key */}
                      <Field
                        label="BASE URL (ĐỊA CHỈ GATEWAY)"
                        value={baseUrl}
                        onChange={setBaseUrl}
                        placeholder="https://api.xkiro.com/v1"
                        description="Hỗ trợ https://api.xkiro.com/v1 hoặc bất kỳ endpoint OpenAI nào"
                      />

                      <Field
                        label="API KEY"
                        value={apiKey}
                        onChange={setApiKey}
                        type="password"
                        placeholder="sk-... hoặc API Key từ nhà cung cấp"
                      />

                      <Field
                        label="MODEL NAME (TÊN MÔ HÌNH)"
                        value={model}
                        onChange={setModel}
                        placeholder="Gwen 3.8 max"
                        description="Gwen 3.8 max, qwen-3.8-max, gpt-4o, deepseek-chat..."
                      />

                      {/* Sliders: Context Window, Inference Speed, Temperature */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: 'rgba(0,5,15,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {/* Context Window */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span style={{ ...mono, color: 'rgba(0,245,255,0.8)', fontSize: '10px' }}>CONTEXT WINDOW / MAX TOKENS:</span>
                            <span style={{ ...mono, color: '#00f5ff', fontSize: '11px' }}>{contextWindow.toLocaleString()} tokens</span>
                          </div>
                          <input
                            type="range"
                            min={512}
                            max={65536}
                            step={512}
                            value={contextWindow}
                            onChange={e => setContextWindow(parseInt(e.target.value, 10))}
                            className="w-full"
                          />
                          <span style={{ ...aptos, color: 'rgba(255,255,255,0.35)', fontSize: '9px' }}>
                            Tăng/giảm độ dài ngữ cảnh và câu trả lời tối đa
                          </span>
                        </div>

                        {/* Inference Speed */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span style={{ ...mono, color: 'rgba(168,85,247,0.8)', fontSize: '10px' }}>TỐC ĐỘ SUY LUẬN (INFERENCE SPEED):</span>
                            <span style={{ ...mono, color: '#a855f7', fontSize: '11px' }}>{inferenceSpeed.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min={0.5}
                            max={3.0}
                            step={0.1}
                            value={inferenceSpeed}
                            onChange={e => setInferenceSpeed(parseFloat(e.target.value))}
                            className="w-full"
                          />
                          <span style={{ ...aptos, color: 'rgba(255,255,255,0.35)', fontSize: '9px' }}>
                            Điều chỉnh tốc độ truyền và nhịp phát trực tiếp
                          </span>
                        </div>

                        {/* Temperature */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span style={{ ...mono, color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>ĐỘ SÁNG TẠO (TEMPERATURE):</span>
                            <span style={{ ...mono, color: '#fff', fontSize: '11px' }}>{temperature.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min={0.0}
                            max={2.0}
                            step={0.05}
                            value={temperature}
                            onChange={e => setTemperature(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        {/* Top P */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span style={{ ...mono, color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>LỌC TẦN XUẤT (TOP P):</span>
                            <span style={{ ...mono, color: '#fff', fontSize: '11px' }}>{topP.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min={0.1}
                            max={1.0}
                            step={0.05}
                            value={topP}
                            onChange={e => setTopP(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Test Connection Button */}
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          disabled={testingConnection}
                          onClick={handleTestConnection}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
                          style={{
                            background: 'rgba(34,197,94,0.15)',
                            border: '1px solid rgba(34,197,94,0.4)',
                          }}
                        >
                          {testingConnection ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-green-400" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-green-400" />
                          )}
                          <span style={{ ...mono, color: '#22c55e', fontSize: '10px' }}>
                            {testingConnection ? 'ĐANG KIỂM TRA...' : 'TEST CONNECTION (KIỂM TRA KẾT NỐI)'}
                          </span>
                        </motion.button>

                        {testResult && (
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            {testResult.success ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            )}
                            <span style={{ color: testResult.success ? '#86efac' : '#fca5a5' }}>
                              {testResult.message} ({testResult.latencyMs}ms)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* System Prompt */}
                      <div className="flex flex-col gap-1.5">
                        <label style={{ ...mono, color: 'rgba(0,245,255,0.7)', fontSize: '10px' }}>CÂU LỆNH HỆ THỐNG (SYSTEM PROMPT):</label>
                        <textarea
                          value={systemPrompt}
                          onChange={e => setSystemPrompt(e.target.value)}
                          rows={3}
                          className="p-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs outline-none focus:border-cyan-400"
                          style={{ ...aptos }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* MCP PROTOCOL SECTION */}
                  {section === 'mcp' && (
                    <motion.div key="mcp" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 style={{ ...orb, color: '#22c55e', fontSize: '13px' }}>GIAO THỨC MODEL CONTEXT PROTOCOL (MCP)</h3>
                        <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
                          {mcpService.getTools().length} CÔNG CỤ ĐÃ SẴN SÀNG
                        </span>
                      </div>

                      <p style={{ ...aptos, color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
                        Giao thức MCP cho phép CAT AI kết nối và thực thi các công cụ bên ngoài (máy tính toán học, trích xuất dữ liệu, quét hệ thống, máy chủ API nội bộ) tự động trong quá trình xử lý câu hỏi.
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        {mcpService.getTools().map(t => (
                          <div
                            key={t.name}
                            className="p-3 rounded-xl flex items-center justify-between"
                            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span style={{ ...mono, color: '#22c55e', fontSize: '11px' }} className="truncate">
                                {t.name}
                              </span>
                              <span style={{ ...aptos, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }} className="truncate">
                                {t.description}
                              </span>
                            </div>
                            <span
                              className="px-2 py-0.5 rounded text-[8px] font-mono"
                              style={{
                                background: t.enabled ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                                color: t.enabled ? '#22c55e' : 'rgba(255,255,255,0.3)',
                              }}
                            >
                              {t.enabled ? 'BẬT' : 'TẮT'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* SOUND SETTINGS SECTION */}
                  {section === 'sound' && (
                    <motion.div key="sound" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-4">
                      <h3 style={{ ...orb, color: '#0ea5e9', fontSize: '13px' }}>HIỆU ỨNG ÂM THANH SCI-FI</h3>

                      <Toggle
                        label="Bật hiệu ứng âm thanh tổng hợp Web Audio"
                        value={soundEnabled}
                        onChange={setSoundEnabled}
                        color="#0ea5e9"
                      />

                      <div className="flex flex-col gap-2 p-4 rounded-xl" style={{ background: 'rgba(0,5,15,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
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

                      <div className="flex gap-2">
                        <button
                          onClick={() => sounds.playStartup()}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono cursor-pointer"
                        >
                          Âm Khởi động
                        </button>
                        <button
                          onClick={() => sounds.playScan()}
                          className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono cursor-pointer"
                        >
                          Âm Quét Nơ-ron
                        </button>
                        <button
                          onClick={() => sounds.playSuccess()}
                          className="px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-mono cursor-pointer"
                        >
                          Âm Hoàn thành
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* SECURITY SECTION */}
                  {section === 'security' && (
                    <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-4">
                      <h3 style={{ ...orb, color: '#f59e0b', fontSize: '13px' }}>BẢO MẬT & MÃ HÓA HỆ THỐNG</h3>
                      <Toggle label="Mã hóa đầu-cuối AES-256 + RSA-4096" value={encEnabled} onChange={setEncEnabled} color="#f59e0b" />
                      <Toggle label="Xác thực sinh trắc học ảo" value={biometrics} onChange={setBiometrics} color="#f59e0b" />
                      <Toggle label="Xác thực hai yếu tố (2FA)" value={twoFactor} onChange={setTwoFactor} color="#f59e0b" />
                      <Toggle label="Ghi nhật ký kiểm toán (Audit Logging)" value={auditLog} onChange={setAuditLog} color="#f59e0b" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 px-8 py-4 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(0,245,255,0.1)' }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  sounds.playClick();
                  setSettingsOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                <span style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>HỦY BỎ</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-xl cursor-pointer"
                style={{
                  background: saved ? 'rgba(34,197,94,0.2)' : 'rgba(0,245,255,0.15)',
                  border: `1px solid ${saved ? '#22c55e' : 'rgba(0,245,255,0.4)'}`,
                  boxShadow: saved ? '0 0 15px rgba(34,197,94,0.3)' : '0 0 15px rgba(0,245,255,0.15)',
                }}
              >
                {saved ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span style={{ ...mono, color: saved ? '#22c55e' : '#00f5ff', fontSize: '10px' }}>
                  {saved ? 'ĐÃ LƯU THÀNH CÔNG' : 'LƯU CẤU HÌNH'}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
