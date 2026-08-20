import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { sounds } from '../services/sound';
import { openAIService, AISettings, DEFAULT_AI_SETTINGS } from '../services/openai';
import { deepVoice } from '../services/deepVoice';
import { UploadedDocument } from '../components/FilesPanel';

export type AIState = 'idle' | 'listening' | 'processing' | 'responding';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  attachedFile?: { name: string; size: number };
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
}

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  timestamp: Date;
  synced: boolean;
}

interface AppContextType {
  aiState: AIState;
  setAiState: (s: AIState) => void;
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  scanningActive: boolean;
  setScanningActive: (v: boolean) => void;
  appGridOpen: boolean;
  setAppGridOpen: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  gestureOpen: boolean;
  setGestureOpen: (v: boolean) => void;
  filesOpen: boolean;
  setFilesOpen: (v: boolean) => void;
  mcpOpen: boolean;
  setMcpOpen: (v: boolean) => void;
  leftPanel: 'monitor' | 'memory';
  setLeftPanel: (v: 'monitor' | 'memory') => void;
  rightPanel: 'console' | 'search';
  setRightPanel: (v: 'console' | 'search') => void;
  memories: MemoryItem[];
  uploadedFiles: UploadedDocument[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedDocument[]>>;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  soundVolume: number;
  setSoundVolume: (v: number) => void;
  aiSettings: AISettings;
  updateAiSettings: (settings: Partial<AISettings>) => void;
  userFullName: string;
  setUserFullName: (name: string) => void;
  userName: string;
  setUserName: (name: string) => void;

  // Deep Voice TTS States
  isSpeaking: boolean;
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => void;
  voiceAutoSpeak: boolean;
  setVoiceAutoSpeak: (v: boolean) => void;
  voicePitch: number;
  setVoicePitch: (p: number) => void;
  voiceRate: number;
  setVoiceRate: (r: number) => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const initialMessages: Message[] = [
  {
    id: '1',
    type: 'ai',
    text: 'Hệ điều hành **CAT AI v3.8** đã khởi tạo thành công. Lõi nơ-ron đa tầng trực tuyến. Chào mừng **Vinh_Admin** (Vinh)! Giọng đọc nam trầm chậm rãi và chuẩn kết nối OpenAI Completions đã sẵn sàng phục vụ.',
    timestamp: new Date(Date.now() - 8000),
  },
  {
    id: '2',
    type: 'user',
    text: 'Kiểm tra trạng thái hệ thống và tài nguyên nơ-ron.',
    timestamp: new Date(Date.now() - 5000),
  },
  {
    id: '3',
    type: 'ai',
    text: 'Chẩn đoán hoàn tất: CPU: 38% định mức. Bộ nhớ: 6.2GB/16GB. Độ trễ Gateway: 18ms. Giao thức bảo mật: AES-256 kích hoạt. Toàn bộ 6 công cụ MCP lõi đang trực tuyến.',
    timestamp: new Date(Date.now() - 3000),
  },
];

const initialMemories: MemoryItem[] = [
  {
    id: '1',
    title: 'Cấu hình CAT AI & Gateway Xkiro',
    content: 'Cấu hình hoàn tất chuẩn OpenAI Completions với base URL https://api.xkiro.com/v1 và mô hình Gwen 3.8 max. Độ trễ 18ms.',
    tags: ['cấu hình', 'gateway', 'xkiro'],
    timestamp: new Date(Date.now() - 86400000 * 2),
    synced: true,
  },
  {
    id: '2',
    title: 'Giao thức MCP (Model Context Protocol)',
    content: 'Tích hợp 6 công cụ lõi: Máy tính khoa học, Hệ thống hóa tài liệu, Giám sát hệ thống, Mã hóa SHA-256, Thời gian thực và Trình đọc Web.',
    tags: ['mcp', 'tools', 'giao thức'],
    timestamp: new Date(Date.now() - 86400000),
    synced: true,
  },
  {
    id: '3',
    title: 'Hệ thống hóa Tài liệu AI',
    content: 'Module Document Systemizer phân tích cấu trúc, trích xuất số liệu và tóm tắt điều hành cấp cao từ file tài liệu tải lên.',
    tags: ['tài liệu', 'ai', 'phân tích'],
    timestamp: new Date(Date.now() - 3600000 * 5),
    synced: false,
  },
  {
    id: '4',
    title: 'Thông tin Quản trị viên',
    content: 'Người dùng: Vinh | Username: Vinh_Admin | Quyền hạn: Toàn quyền truy cập hệ thống CAT AI.',
    tags: ['admin', 'vinh', 'profile'],
    timestamp: new Date(Date.now() - 3600000 * 2),
    synced: true,
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [aiState, setAiState] = useState<AIState>('idle');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scanningActive, setScanningActive] = useState(false);
  const [appGridOpen, setAppGridOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gestureOpen, setGestureOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [leftPanel, setLeftPanel] = useState<'monitor' | 'memory'>('monitor');
  const [rightPanel, setRightPanel] = useState<'console' | 'search'>('console');
  const [memories] = useState<MemoryItem[]>(initialMemories);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);

  // User Profile
  const [userFullName, setUserFullName] = useState<string>(() => {
    return localStorage.getItem('cat_user_fullname') || import.meta.env.VITE_USER_FULL_NAME || 'Vinh';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('cat_user_name') || import.meta.env.VITE_USER_NAME || 'Vinh_Admin';
  });

  // AI Settings
  const [aiSettings, setAiSettings] = useState<AISettings>(() => openAIService.getSettings());

  const updateAiSettings = useCallback((newSettings: Partial<AISettings>) => {
    openAIService.saveSettings(newSettings);
    setAiSettings(openAIService.getSettings());
  }, []);

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => sounds.isEnabled());
  const [soundVolume, setSoundVolumeState] = useState<number>(() => sounds.getVolume());

  // Deep Voice TTS States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(() => deepVoice.isEnabled());
  const [voiceAutoSpeak, setVoiceAutoSpeakState] = useState<boolean>(() => deepVoice.isAutoSpeak());
  const [voicePitch, setVoicePitchState] = useState<number>(() => deepVoice.getPitch());
  const [voiceRate, setVoiceRateState] = useState<number>(() => deepVoice.getRate());

  // Subscribe to voice speaking state
  useEffect(() => {
    return deepVoice.subscribe(speaking => {
      setIsSpeaking(speaking);
    });
  }, []);

  const setVoiceEnabled = useCallback((v: boolean) => {
    deepVoice.setEnabled(v);
    setVoiceEnabledState(v);
  }, []);

  const setVoiceAutoSpeak = useCallback((v: boolean) => {
    deepVoice.setAutoSpeak(v);
    setVoiceAutoSpeakState(v);
  }, []);

  const setVoicePitch = useCallback((p: number) => {
    deepVoice.setPitch(p);
    setVoicePitchState(p);
  }, []);

  const setVoiceRate = useCallback((r: number) => {
    deepVoice.setRate(r);
    setVoiceRateState(r);
  }, []);

  const speakText = useCallback((text: string) => {
    deepVoice.speak(text);
  }, []);

  const stopSpeaking = useCallback(() => {
    deepVoice.stop();
  }, []);

  // Play startup sound on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      sounds.playStartup();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const setSoundEnabled = useCallback((v: boolean) => {
    sounds.setEnabled(v);
    setSoundEnabledState(v);
    if (v) sounds.playSuccess();
  }, []);

  const setSoundVolume = useCallback((v: number) => {
    sounds.setVolume(v);
    setSoundVolumeState(v);
  }, []);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString(), timestamp: new Date() }]);
    sounds.playMessage();

    // Auto speak if it's an AI message and autoSpeak is active
    if (msg.type === 'ai' && deepVoice.isEnabled() && deepVoice.isAutoSpeak()) {
      deepVoice.speak(msg.text);
    }
  }, []);

  const clearMessages = useCallback(() => {
    deepVoice.stop();
    sounds.playClick();
    setMessages([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...n, id }]);

    if (n.type === 'error') {
      sounds.playError();
    } else if (n.type === 'success') {
      sounds.playSuccess();
    } else {
      sounds.playMessage();
    }

    setTimeout(() => removeNotification(id), 6000);
  }, [removeNotification]);

  return (
    <AppContext.Provider value={{
      aiState, setAiState,
      messages, addMessage, clearMessages,
      notifications, addNotification, removeNotification,
      scanningActive, setScanningActive,
      appGridOpen, setAppGridOpen,
      settingsOpen, setSettingsOpen,
      gestureOpen, setGestureOpen,
      filesOpen, setFilesOpen,
      mcpOpen, setMcpOpen,
      leftPanel, setLeftPanel,
      rightPanel, setRightPanel,
      memories,
      uploadedFiles, setUploadedFiles,
      soundEnabled, setSoundEnabled,
      soundVolume, setSoundVolume,
      aiSettings, updateAiSettings,
      userFullName, setUserFullName,
      userName, setUserName,
      isSpeaking, voiceEnabled, setVoiceEnabled,
      voiceAutoSpeak, setVoiceAutoSpeak,
      voicePitch, setVoicePitch,
      voiceRate, setVoiceRate,
      speakText, stopSpeaking,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
