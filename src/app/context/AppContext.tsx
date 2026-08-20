import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { sounds } from '../services/sound';
import { openAIService, AISettings, DEFAULT_AI_SETTINGS } from '../services/openai';
import { deepVoice } from '../services/deepVoice';
import { speechEngine, SpeechRecognitionResultPayload } from '../services/speechRecognition';
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

  // Speech Recognition & Wake Word ("CAT") States
  isListeningVoice: boolean;
  speechTranscript: string;
  startVoiceRecognition: (continuous?: boolean) => boolean;
  stopVoiceRecognition: () => void;
  wakeWordEnabled: boolean;
  setWakeWordEnabled: (v: boolean) => void;
  silenceDurationMs: number;
  setSilenceDurationMs: (ms: number) => void;
  handleExecuteVoiceCommand: (cmd: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const initialMessages: Message[] = [
  {
    id: '1',
    type: 'ai',
    text: 'Hệ điều hành **CAT AI v3.8** đã khởi tạo thành công. Lõi nơ-ron đa tầng trực tuyến. Chào mừng **Vinh_Admin** (Vinh)! Giọng đọc nam trầm và nhận diện lệnh gọi **"CAT"** (tự động duyệt sau 1s ngắt quãng) đã sẵn sàng phục vụ.',
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
    title: 'Nhận diện Giọng nói & Wake Word "CAT"',
    content: 'Kích hoạt từ khóa "CAT", "CAT AI", "Cát ơi" và tự động gửi lệnh sau 1 giây im lặng (Silence 1s).',
    tags: ['voice', 'wake_word', 'cat'],
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

  // Speech Recognition & Wake Word ("CAT") States
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(true);
  const [silenceDurationMs, setSilenceDurationMsState] = useState<number>(1000);

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

  const setSilenceDurationMs = useCallback((ms: number) => {
    speechEngine.setSilenceDuration(ms);
    setSilenceDurationMsState(ms);
  }, []);

  // Handle voice command execution
  const handleExecuteVoiceCommand = useCallback(async (cmdText: string) => {
    const raw = cmdText.trim();
    if (!raw) return;

    sounds.playVoiceEnd();
    setAiState('processing');

    // Add user message
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text: raw, timestamp: new Date() }]);

    const lower = raw.toLowerCase();
    if (lower.includes('quét') || lower.includes('scan')) {
      setTimeout(() => setScanningActive(true), 600);
    } else if (lower.includes('cài đặt') || lower.includes('settings')) {
      setTimeout(() => setSettingsOpen(true), 600);
    } else if (lower.includes('ứng dụng') || lower.includes('app')) {
      setTimeout(() => setAppGridOpen(true), 600);
    } else if (lower.includes('tài liệu') || lower.includes('file')) {
      setTimeout(() => setFilesOpen(true), 600);
    } else if (lower.includes('mcp') || lower.includes('tool')) {
      setTimeout(() => setMcpOpen(true), 600);
    }

    try {
      const response = await openAIService.chatCompletion({
        messages: [{ role: 'user', content: raw }],
      });

      setAiState('responding');
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'ai', text: response, timestamp: new Date() }]);

      if (deepVoice.isEnabled() && deepVoice.isAutoSpeak()) {
        deepVoice.speak(response);
      }

      setTimeout(() => setAiState('idle'), 2000);
    } catch (err) {
      const fallback = `Tôi đã nhận lệnh bằng giọng nói: "${raw}". Lõi nơ-ron CAT AI đang xử lý theo yêu cầu của ${userName}.`;
      setAiState('responding');
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'ai', text: fallback, timestamp: new Date() }]);

      if (deepVoice.isEnabled() && deepVoice.isAutoSpeak()) {
        deepVoice.speak(fallback);
      }

      setTimeout(() => setAiState('idle'), 2000);
    }
  }, [userName]);

  // Setup Speech Recognition Listeners
  useEffect(() => {
    speechEngine.onStateChange(listening => {
      setIsListeningVoice(listening);
      if (listening) {
        setAiState('listening');
      } else if (aiState === 'listening') {
        setAiState('idle');
      }
    });

    speechEngine.onWakeWord(() => {
      sounds.playVoiceStart();
      setAiState('listening');
    });

    speechEngine.onInterim(text => {
      setSpeechTranscript(text);
    });

    speechEngine.onCommandFinalized((payload: SpeechRecognitionResultPayload) => {
      setSpeechTranscript('');
      handleExecuteVoiceCommand(payload.command);
    });
  }, [aiState, handleExecuteVoiceCommand]);

  const startVoiceRecognition = useCallback((continuous: boolean = false) => {
    sounds.playVoiceStart();
    setAiState('listening');
    setSpeechTranscript('');
    return speechEngine.startListening(continuous);
  }, []);

  const stopVoiceRecognition = useCallback(() => {
    sounds.playVoiceEnd();
    speechEngine.stopListening();
    setSpeechTranscript('');
    setAiState('idle');
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
      isListeningVoice, speechTranscript,
      startVoiceRecognition, stopVoiceRecognition,
      wakeWordEnabled, setWakeWordEnabled,
      silenceDurationMs, setSilenceDurationMs,
      handleExecuteVoiceCommand,
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
