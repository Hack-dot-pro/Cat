import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  AIConfig,
  getStoredAIConfig,
  saveStoredAIConfig,
  callOpenAIChatCompletion,
  ChatMessageParam,
} from '../services/openai';

export type AIState = 'idle' | 'listening' | 'processing' | 'responding';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
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
  updateMessage: (id: string, text: string, isStreaming?: boolean) => void;
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
  leftPanel: 'monitor' | 'memory';
  setLeftPanel: (v: 'monitor' | 'memory') => void;
  rightPanel: 'console' | 'search';
  setRightPanel: (v: 'console' | 'search') => void;
  memories: MemoryItem[];
  aiConfig: AIConfig;
  updateAIConfig: (cfg: Partial<AIConfig>) => void;
  sendAIChat: (text: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const initialMessages: Message[] = [
  {
    id: '1',
    type: 'ai',
    text: 'CAT v3.7 initialized. Neural core online. All subsystems operational. Voice recognition active. How can I assist you today?',
    timestamp: new Date(Date.now() - 8000),
  },
  {
    id: '2',
    type: 'user',
    text: 'Run system diagnostics.',
    timestamp: new Date(Date.now() - 5000),
  },
  {
    id: '3',
    type: 'ai',
    text: 'Diagnostics complete. CPU: 42% nominal. Memory: 6.2GB/16GB. Network: 847ms latency. Security: All encryption layers intact. No anomalies detected.',
    timestamp: new Date(Date.now() - 3000),
  },
];

const initialMemories: MemoryItem[] = [
  {
    id: '1',
    title: 'System Configuration',
    content: 'Primary interface configured with OpenAI-compatible completions. Performance mode: Ultra. Voice recognition sensitivity: 0.92.',
    tags: ['system', 'config'],
    timestamp: new Date(Date.now() - 86400000 * 2),
    synced: true,
  },
  {
    id: '2',
    title: 'Voice Command Macro',
    content: 'Created shortcut: "Deploy" = git push origin main && run deploy --production',
    tags: ['voice', 'dev'],
    timestamp: new Date(Date.now() - 86400000),
    synced: true,
  },
  {
    id: '3',
    title: 'Research: Quantum Computing',
    content: 'Summarized 14 papers on quantum decoherence and error correction. Key finding: surface codes most viable for near-term QC implementation.',
    tags: ['research', 'quantum'],
    timestamp: new Date(Date.now() - 3600000 * 5),
    synced: false,
  },
  {
    id: '4',
    title: 'API Integration Log',
    content: 'OpenAI Completion API standard integrated. Custom Base URL & Model routing enabled. Secure vault configured.',
    tags: ['api', 'config'],
    timestamp: new Date(Date.now() - 3600000 * 2),
    synced: true,
  },
  {
    id: '5',
    title: 'User Preference Update',
    content: 'Dark mode holographic theme selected. Response verbosity: detailed. Gesture sensitivity calibrated to user profile.',
    tags: ['preferences', 'ui'],
    timestamp: new Date(Date.now() - 1800000),
    synced: true,
  },
];

const BUILTIN_COMMAND_RESPONSES: Record<string, string> = {
  scan: 'Initiating full-spectrum environmental scan. Holographic display activating...',
  status: 'All systems nominal. CPU: 42% | Memory: 62% | Network: Online | Security: AES-256 Active | Uptime: 4h 12m.',
  time: `Current time: ${new Date().toLocaleTimeString()}. Temporal reference synchronized with UTC+0.`,
  hello: 'Hello! CAT is fully operational and ready to assist. All neural pathways active.',
  help: 'Available commands: scan, status, time, hello, settings, apps, gesture, weather, memory, encrypt. You can also chat directly with the connected AI model.',
  settings: 'Opening system configuration panel. Initializing secure environment...',
  apps: 'Launching application grid interface. Holographic display ready.',
  gesture: 'Activating gesture recognition module. Camera feed initializing...',
  weather: 'Fetching atmospheric data... Conditions: Clear skies, 22°C, Humidity: 58%, Wind: 12 km/h NE. Air quality: Good.',
  memory: 'Memory core accessed. 5 records found. Local: Synced | Cloud: Active | Git: Pushed.',
  encrypt: 'Running encryption protocol... AES-256 verified. RSA-4096 key exchange complete. All channels secure.',
  deploy: 'Initiating deployment sequence. Building Docker container... Pushing to registry... Deployed to production. Zero downtime achieved.',
  analyze: 'Running deep neural analysis... Pattern recognition active... Anomaly detection: None found. Confidence: 98.7%.',
  shutdown: 'Shutdown sequence initiated. Saving session state... Encrypting memory... Graceful shutdown in 30 seconds. Say "cancel" to abort.',
  cancel: 'Shutdown sequence aborted. All systems remain active. Standing by for further commands.',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [aiState, setAiState] = useState<AIState>('idle');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scanningActive, setScanningActive] = useState(false);
  const [appGridOpen, setAppGridOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gestureOpen, setGestureOpen] = useState(false);
  const [leftPanel, setLeftPanel] = useState<'monitor' | 'memory'>('monitor');
  const [rightPanel, setRightPanel] = useState<'console' | 'search'>('console');
  const [memories] = useState<MemoryItem[]>(initialMemories);
  const [aiConfig, setAiConfig] = useState<AIConfig>(getStoredAIConfig);

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateAIConfig = useCallback((cfg: Partial<AIConfig>) => {
    setAiConfig(prev => {
      const updated = { ...prev, ...cfg };
      saveStoredAIConfig(updated);
      return updated;
    });
  }, []);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString() + Math.random().toString().slice(2, 6), timestamp: new Date() }]);
  }, []);

  const updateMessage = useCallback((id: string, text: string, isStreaming?: boolean) => {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, text, isStreaming: isStreaming ?? m.isStreaming } : m))
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setNotifications(prev => [...prev, { ...n, id }]);
    setTimeout(() => removeNotification(id), 6000);
  }, [removeNotification]);

  const sendAIChat = useCallback(async (userText: string) => {
    const text = userText.trim();
    if (!text) return;

    const lower = text.toLowerCase();

    // Trigger system action shortcuts
    if (lower.includes('scan') && !lower.includes('how') && !lower.includes('what')) {
      setTimeout(() => setScanningActive(true), 800);
    } else if (lower.includes('settings') && !lower.includes('how')) {
      setTimeout(() => setSettingsOpen(true), 800);
    } else if (lower.includes('apps') && !lower.includes('how')) {
      setTimeout(() => setAppGridOpen(true), 800);
    } else if (lower.includes('gesture') && !lower.includes('how')) {
      setTimeout(() => setGestureOpen(true), 800);
    }

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, type: 'user', text, timestamp: new Date() }]);
    setAiState('processing');

    const hasApiKey = Boolean(aiConfig.apiKey && aiConfig.apiKey.trim());
    const isLocalOllama = aiConfig.provider === 'ollama';

    // If configured with real API / Ollama, call OpenAI completion
    if (hasApiKey || isLocalOllama) {
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev,
        { id: aiMsgId, type: 'ai', text: '', timestamp: new Date(), isStreaming: true },
      ]);
      setAiState('responding');

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const conversationHistory: ChatMessageParam[] = [
          { role: 'system', content: aiConfig.systemPrompt },
          ...messages.slice(-8).map(m => ({
            role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.text,
          })),
          { role: 'user', content: text },
        ];

        let accumulatedText = '';
        await callOpenAIChatCompletion({
          messages: conversationHistory,
          config: aiConfig,
          signal: controller.signal,
          onChunk: (_, accumulated) => {
            accumulatedText = accumulated;
            updateMessage(aiMsgId, accumulated, true);
          },
        });

        updateMessage(aiMsgId, accumulatedText || 'Response received.', false);
        addNotification({
          type: 'success',
          title: `CAT (${aiConfig.model})`,
          message: 'AI response completed successfully.',
        });
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        console.error('AI completion error:', err);
        const errMsg = `[Connection Error]: ${err.message || 'Failed to reach API endpoint.'}\n\nFalling back to neural standby protocol.`;
        updateMessage(aiMsgId, errMsg, false);
        addNotification({
          type: 'error',
          title: 'API Error',
          message: err.message || 'Failed to communicate with OpenAI completions API',
        });
      } finally {
        setTimeout(() => setAiState('idle'), 1200);
      }
    } else {
      // Fallback: Builtin simulated response when no API key is provided
      const matchedKey = Object.keys(BUILTIN_COMMAND_RESPONSES).find(k => lower.includes(k));
      const simulatedReply = matchedKey
        ? BUILTIN_COMMAND_RESPONSES[matchedKey]
        : `Command received: "${text}". Neural analysis complete. (Tip: Enter your OpenAI/OpenRouter/Groq API key in Settings for live LLM completions).`;

      setTimeout(() => {
        setAiState('responding');
        addMessage({ type: 'ai', text: simulatedReply });
        addNotification({
          type: 'info',
          title: 'CAT Response',
          message: 'Simulated response generated. Set API key in Settings for live LLM.',
        });
        setTimeout(() => setAiState('idle'), 1500);
      }, 1000);
    }
  }, [aiConfig, messages, updateMessage, addMessage, addNotification]);

  return (
    <AppContext.Provider
      value={{
        aiState,
        setAiState,
        messages,
        addMessage,
        updateMessage,
        clearMessages,
        notifications,
        addNotification,
        removeNotification,
        scanningActive,
        setScanningActive,
        appGridOpen,
        setAppGridOpen,
        settingsOpen,
        setSettingsOpen,
        gestureOpen,
        setGestureOpen,
        leftPanel,
        setLeftPanel,
        rightPanel,
        setRightPanel,
        memories,
        aiConfig,
        updateAIConfig,
        sendAIChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
