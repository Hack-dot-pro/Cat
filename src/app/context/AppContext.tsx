import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  AIConfig,
  getStoredAIConfig,
  saveStoredAIConfig,
  callOpenAIChatCompletion,
  ChatMessageParam,
} from '../services/openai';
import { sounds } from '../services/sound';

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

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'text' | 'json' | 'code' | 'csv';
  content: string;
  timestamp: Date;
  summary?: string;
  analysis?: string;
  tokenCount?: number;
  status: 'ready' | 'analyzing' | 'analyzed' | 'error';
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
  filesOpen: boolean;
  setFilesOpen: (v: boolean) => void;
  leftPanel: 'monitor' | 'memory';
  setLeftPanel: (v: 'monitor' | 'memory') => void;
  rightPanel: 'console' | 'search';
  setRightPanel: (v: 'console' | 'search') => void;
  memories: MemoryItem[];
  uploadedDocuments: UploadedDocument[];
  addUploadedDocument: (doc: UploadedDocument) => void;
  removeUploadedDocument: (id: string) => void;
  analyzeDocument: (id: string, mode: 'summary' | 'deep' | 'extract') => Promise<void>;
  aiConfig: AIConfig;
  updateAIConfig: (cfg: Partial<AIConfig>) => void;
  sendAIChat: (text: string) => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  soundVolume: number;
  setSoundVolume: (v: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const initialMessages: Message[] = [
  {
    id: '1',
    type: 'ai',
    text: 'Hệ điều hành CAT v3.7 đã khởi động thành công. Lõi nơ-ron trực tuyến. Toàn bộ hệ thống thứ cấp hoạt động bình thường. Nhận diện giọng nói đang kích hoạt. Tôi có thể hỗ trợ gì cho bạn hôm nay?',
    timestamp: new Date(Date.now() - 8000),
  },
  {
    id: '2',
    type: 'user',
    text: 'Kiểm tra chẩn đoán toàn bộ hệ thống.',
    timestamp: new Date(Date.now() - 5000),
  },
  {
    id: '3',
    type: 'ai',
    text: 'Chẩn đoán hoàn tất. CPU: 42% định mức. Bộ nhớ RAM: 6.2GB / 16GB. Mạng: Độ trễ 42ms. Bảo mật: Toàn bộ các lớp mã hóa AES-256 nguyên vẹn. Không phát hiện bất thường.',
    timestamp: new Date(Date.now() - 3000),
  },
];

const initialMemories: MemoryItem[] = [
  {
    id: '1',
    title: 'Cấu hình Hệ thống',
    content: 'Giao diện chính kết nối API chuẩn OpenAI Completions. Chế độ hiệu năng: Cực đại (Ultra). Độ nhạy nhận diện giọng nói: 0.92.',
    tags: ['hệ thống', 'cấu hình'],
    timestamp: new Date(Date.now() - 86400000 * 2),
    synced: true,
  },
  {
    id: '2',
    title: 'Lệnh Tắt Giọng Nói',
    content: 'Tạo shortcut: "Triển khai" = git push origin main && chạy lệnh deploy production lên Cloudflare.',
    tags: ['giọng nói', 'lập trình'],
    timestamp: new Date(Date.now() - 86400000),
    synced: true,
  },
  {
    id: '3',
    title: 'Nghiên cứu: Điện toán Lượng tử',
    content: 'Tổng hợp 14 bài báo khoa học về giảm kết hợp lượng tử và sửa lỗi. Kết luận: Mã bề mặt khả thi nhất cho triển khai thực tế.',
    tags: ['nghiên cứu', 'lượng tử'],
    timestamp: new Date(Date.now() - 3600000 * 5),
    synced: false,
  },
  {
    id: '4',
    title: 'Nhật ký Tích hợp API',
    content: 'Đã tích hợp API Xkiro (Gwen 3.8 max), OpenAI, OpenRouter. Khóa bảo mật được mã hóa trong kho lưu trữ an toàn.',
    tags: ['api', 'bảo mật'],
    timestamp: new Date(Date.now() - 3600000 * 2),
    synced: true,
  },
  {
    id: '5',
    title: 'Tùy chọn Người dùng',
    content: 'Giao diện Holographic Dark Mode. Độ chi tiết phản hồi: Chuyên sâu. Cảm biến cử chỉ không gian đã được hiệu chuẩn.',
    tags: ['tùy chọn', 'giao diện'],
    timestamp: new Date(Date.now() - 1800000),
    synced: true,
  },
];

const initialSampleDocuments: UploadedDocument[] = [
  {
    id: 'doc-1',
    name: 'Bao-Cao-Kien-Truc-CAT-AI.md',
    size: 4280,
    type: 'text',
    content: `# BÁO CÁO KIẾN TRÚC HỆ ĐIỀU HÀNH HOLOGRAPHIC CAT v3.7\n\n## 1. Tổng quan Hệ thống\nCAT AI OS là hệ điều hành Holographic trợ lý thông minh đa phương thức, kết hợp đồ họa 3D thời gian thực với mô hình ngôn ngữ lớn (LLM).\n\n## 2. Các Phân hệ Cốt lõi\n- **Lõi Nơ-ron (AICore)**: Điều phối trạng thái Standby, Listening, Processing, Responding.\n- **Mô hình AI**: Tích hợp chuẩn OpenAI Chat Completions với Xkiro API và model Gwen 3.8 max.\n- **Bảo mật**: Mã hóa AES-256-GCM và trao đổi khóa RSA-4096.\n- **Nhận diện giọng nói**: Web Speech API tiếng Việt độ chính xác 95.8%.\n- **Âm thanh Sci-Fi**: Bộ tổng hợp Web Audio API Synthesizer đa tần số.\n\n## 3. Mục tiêu Phát triển\nTối ưu hóa suy luận biên (Edge Inference), phân tích dữ liệu tệp tin và mở rộng tính năng điều khiển không gian 3D.`,
    timestamp: new Date(Date.now() - 3600000 * 4),
    tokenCount: 412,
    status: 'analyzed',
    analysis: `### 📋 Tóm Tắt & Phân Tích Chuyên Sâu (Bởi Gwen 3.8 max):\n\n1. **Điểm nổi bật của tài liệu**:\n   - Hệ điều hành Holographic thế hệ mới với giao diện 3D sci-fi và hỗ trợ giọng nói tiếng Việt.\n   - Đã chuẩn hóa kết nối OpenAI Completions API tương thích với Xkiro API.\n   - Tích hợp bảo mật cấp độ cao AES-256 + RSA-4096.\n\n2. **Đánh giá kiến trúc**:\n   - Thiết kế dạng module tách biệt giúp dễ dàng mở rộng.\n   - Bộ tổng hợp âm thanh Web Audio API hoạt động hoàn toàn offline không tốn băng thông.\n\n3. **Khuyến nghị tiếp theo**:\n   - Tiếp tục hoàn thiện tính năng phân tích tài liệu đa định dạng (PDF, DOCX, CSV).`,
  },
  {
    id: 'doc-2',
    name: 'Cau-Hinh-Xkiro-API.json',
    size: 1420,
    type: 'json',
    content: `{\n  "provider": "xkiro",\n  "baseUrl": "https://api.xkiro.com/v1",\n  "model": "Gwen 3.8 max",\n  "temperature": 0.7,\n  "maxTokens": 2048,\n  "streaming": true,\n  "features": [\n    "chat_completions",\n    "sse_streaming",\n    "edge_proxy_bypass_cors",\n    "vietnamese_natural_language"\n  ]\n}`,
    timestamp: new Date(Date.now() - 3600000 * 2),
    tokenCount: 160,
    status: 'ready',
  },
];

const BUILTIN_COMMAND_RESPONSES: Record<string, string> = {
  scan: 'Đang kích hoạt quét toàn diện môi trường và quang phổ. Màn hình Hologram 3D đang hiển thị...',
  status: 'Tất cả hệ thống ở mức tối ưu. CPU: 42% | RAM: 62% | Mạng: Trực tuyến | Bảo mật: AES-256 Đang chạy | Thời gian hoạt động: 4h 12m.',
  time: `Thời gian hiện tại: ${new Date().toLocaleTimeString('vi-VN')}. Đồng bộ hóa tham chiếu chuẩn UTC+7.`,
  hello: 'Xin chào! Hệ điều hành AI CAT đã sẵn sàng phục vụ. Toàn bộ mạng nơ-ron đang hoạt động.',
  help: 'Các lệnh khả dụng: quét (scan), tệp tin (files), trạng thái (status), thời gian (time), xin chào (hello), cài đặt (settings), ứng dụng (apps), cử chỉ (gesture), thời tiết (weather), bộ nhớ (memory), bảo mật (encrypt). Bạn cũng có thể trò chuyện trực tiếp với AI.',
  settings: 'Đang mở bảng cấu hình hệ thống và kho khóa API...',
  apps: 'Đang khởi chạy lưới ứng dụng Holographic...',
  gesture: 'Đang kích hoạt module nhận diện cử chỉ không gian...',
  files: 'Đang mở Trung tâm Phân tích Tệp tin & Tài liệu...',
  weather: 'Đang cập nhật dữ liệu khí quyển... Điều kiện: Trời quang, 28°C, Độ ẩm: 65%, Gió nhẹ. Chất lượng không khí: Tốt.',
  memory: 'Đã truy cập lõi bộ nhớ tri thức. 5 bản ghi sẵn sàng. Bộ nhớ cục bộ: Đã đồng bộ | Đám mây: Hoạt động | Git: Đã sao lưu.',
  encrypt: 'Đang chạy quy trình bảo mật... Xác thực mã hóa AES-256 hoàn tất. Khóa RSA-4096 đã thiết lập. Tất cả kênh được bảo vệ an toàn.',
  deploy: 'Bắt đầu quy trình triển khai... Đóng gói container... Đẩy lên hệ thống Cloudflare Pages. Triển khai thành công, không gián đoạn dịch vụ.',
  analyze: 'Đang thực hiện phân tích nơ-ron chuyên sâu... Nhận diện mẫu hoạt động... Không phát hiện bất thường. Độ tin cậy: 99.2%.',
  shutdown: 'Khởi động quy trình tắt an toàn. Đang lưu trạng thái phiên làm việc... Mã hóa bộ nhớ... Tự động tắt sau 30 giây. Gõ "hủy" để dừng.',
  cancel: 'Đã hủy lệnh tắt hệ thống. Toàn bộ tiến trình duy trì hoạt động.',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [aiState, setAiState] = useState<AIState>('idle');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scanningActive, setScanningActive] = useState(false);
  const [appGridOpen, setAppGridOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gestureOpen, setGestureOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [leftPanel, setLeftPanel] = useState<'monitor' | 'memory'>('monitor');
  const [rightPanel, setRightPanel] = useState<'console' | 'search'>('console');
  const [memories] = useState<MemoryItem[]>(initialMemories);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>(initialSampleDocuments);
  const [aiConfig, setAiConfig] = useState<AIConfig>(getStoredAIConfig);

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => sounds.isEnabled());
  const [soundVolume, setSoundVolumeState] = useState<number>(() => sounds.getVolume());

  const abortControllerRef = useRef<AbortController | null>(null);

  // Play startup sound on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      sounds.playStartup();
    }, 500);
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
    sounds.playClick();
    setMessages([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
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

  const addUploadedDocument = useCallback((doc: UploadedDocument) => {
    setUploadedDocuments(prev => [doc, ...prev]);
  }, []);

  const removeUploadedDocument = useCallback((id: string) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  const analyzeDocument = useCallback(async (docId: string, mode: 'summary' | 'deep' | 'extract') => {
    const doc = uploadedDocuments.find(d => d.id === docId);
    if (!doc) return;

    setUploadedDocuments(prev =>
      prev.map(d => (d.id === docId ? { ...d, status: 'analyzing' } : d))
    );

    let instruction = '';
    if (mode === 'summary') {
      instruction = 'Hãy tóm tắt ngắn gọn, súc tích và nêu bật các nội dung chính của tài liệu sau bằng tiếng Việt theo định dạng gạch đầu dòng rõ ràng:';
    } else if (mode === 'deep') {
      instruction = 'Hãy phân tích chuyên sâu tài liệu sau bằng tiếng Việt: 1. Mục đích & Điểm cốt lõi 2. Đánh giá ưu/nhược điểm hoặc tính khả thi 3. Kết luận & Đề xuất hành động tiếp theo:';
    } else {
      instruction = 'Hãy trích xuất toàn bộ dữ liệu quan trọng, số liệu, thông số kỹ thuật và các bảng biểu/cấu hình từ tài liệu sau bằng tiếng Việt:';
    }

    const hasApiKey = Boolean(aiConfig.apiKey && aiConfig.apiKey.trim());
    const isLocalOllama = aiConfig.provider === 'ollama';

    if (hasApiKey || isLocalOllama) {
      try {
        const promptMessages: ChatMessageParam[] = [
          { role: 'system', content: aiConfig.systemPrompt },
          {
            role: 'user',
            content: `${instruction}\n\n[Tên tệp: ${doc.name}]\n\`\`\`\n${doc.content.slice(0, 15000)}\n\`\`\``,
          },
        ];

        let result = '';
        await callOpenAIChatCompletion({
          messages: promptMessages,
          config: { ...aiConfig, streaming: false },
          onChunk: (_, accumulated) => {
            result = accumulated;
          },
        });

        const finalAnalysis = result || 'Phân tích hoàn tất.';
        setUploadedDocuments(prev =>
          prev.map(d => (d.id === docId ? { ...d, analysis: finalAnalysis, status: 'analyzed' } : d))
        );
        sounds.playSuccess();
        addNotification({
          type: 'success',
          title: 'Phân Tích Hoàn Tất',
          message: `Mô hình ${aiConfig.model} đã phân tích xong tệp "${doc.name}".`,
        });
      } catch (err: any) {
        sounds.playError();
        const fallbackErr = `Lỗi phân tích từ API: ${err.message || 'Không thể kết nối API'}`;
        setUploadedDocuments(prev =>
          prev.map(d => (d.id === docId ? { ...d, analysis: fallbackErr, status: 'error' } : d))
        );
        addNotification({
          type: 'error',
          title: 'Lỗi Phân Tích',
          message: err.message || 'Không thể phân tích tài liệu',
        });
      }
    } else {
      // Simulated smart analysis when no API key is provided
      setTimeout(() => {
        const simulated = `### 📊 Kết Quả Phân Tích Tự Động (${mode.toUpperCase()}):\n\n- **Tên tệp**: ${doc.name}\n- **Dung lượng**: ${(doc.size / 1024).toFixed(1)} KB (~${doc.tokenCount} tokens)\n- **Định dạng**: ${doc.type.toUpperCase()}\n- **Điểm chính trích xuất**:\n  1. Tài liệu chứa ${doc.content.split('\n').length} dòng văn bản với dữ liệu cấu trúc tốt.\n  2. Không phát hiện cú pháp bất thường hoặc lỗi định dạng.\n  3. Đã sẵn sàng để truy vấn và trò chuyện trực tiếp.\n\n*(Mẹo: Điền API Key Xkiro / OpenAI trong Cài Đặt để mô hình Gwen 3.8 max phân tích thời gian thực)*.`;
        setUploadedDocuments(prev =>
          prev.map(d => (d.id === docId ? { ...d, analysis: simulated, status: 'analyzed' } : d))
        );
        sounds.playSuccess();
        addNotification({
          type: 'info',
          title: 'Phân Tích Hoàn Tất (Giả Lập)',
          message: `Đã phân tích xong tệp "${doc.name}".`,
        });
      }, 1200);
    }
  }, [uploadedDocuments, aiConfig, addNotification]);

  const sendAIChat = useCallback(async (userText: string) => {
    const text = userText.trim();
    if (!text) return;

    sounds.playClick();
    const lower = text.toLowerCase();

    // Trigger system action shortcuts
    if ((lower.includes('quét') || lower.includes('scan')) && !lower.includes('như thế nào')) {
      sounds.playScan();
      setTimeout(() => setScanningActive(true), 800);
    } else if ((lower.includes('cài đặt') || lower.includes('settings')) && !lower.includes('như thế nào')) {
      setTimeout(() => setSettingsOpen(true), 800);
    } else if ((lower.includes('ứng dụng') || lower.includes('apps')) && !lower.includes('như thế nào')) {
      setTimeout(() => setAppGridOpen(true), 800);
    } else if ((lower.includes('cử chỉ') || lower.includes('gesture')) && !lower.includes('như thế nào')) {
      setTimeout(() => setGestureOpen(true), 800);
    } else if ((lower.includes('tệp') || lower.includes('file') || lower.includes('tài liệu')) && !lower.includes('như thế nào')) {
      setTimeout(() => setFilesOpen(true), 800);
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
      sounds.playMessage();

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

        updateMessage(aiMsgId, accumulatedText || 'Đã nhận phản hồi.', false);
        sounds.playSuccess();
        addNotification({
          type: 'success',
          title: `CAT (${aiConfig.model})`,
          message: 'Phản hồi từ mô hình AI đã hoàn tất.',
        });
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        console.error('Lỗi AI completion:', err);
        sounds.playError();
        const errMsg = `[Lỗi Kết Nối]: ${err.message || 'Không thể kết nối đến máy chủ API.'}\n\nĐang kích hoạt quy trình dự phòng nơ-ron nội bộ.`;
        updateMessage(aiMsgId, errMsg, false);
        addNotification({
          type: 'error',
          title: 'Lỗi API',
          message: err.message || 'Không thể kết nối đến API OpenAI Completions',
        });
      } finally {
        setTimeout(() => setAiState('idle'), 1200);
      }
    } else {
      // Fallback: Builtin simulated response when no API key is provided
      const matchedKey = Object.keys(BUILTIN_COMMAND_RESPONSES).find(k =>
        lower.includes(k) || (k === 'scan' && lower.includes('quét')) ||
        (k === 'status' && lower.includes('trạng thái')) ||
        (k === 'hello' && lower.includes('chào')) ||
        (k === 'help' && lower.includes('trợ giúp')) ||
        (k === 'weather' && lower.includes('thời tiết')) ||
        (k === 'settings' && lower.includes('cài đặt')) ||
        (k === 'files' && (lower.includes('tệp') || lower.includes('tài liệu')))
      );

      const simulatedReply = matchedKey
        ? BUILTIN_COMMAND_RESPONSES[matchedKey]
        : `Đã nhận lệnh: "${text}". Phân tích nơ-ron hoàn tất. (Mẹo: Nhập API Key Xkiro/OpenAI trong mục Cài Đặt để trò chuyện trực tiếp với mô hình AI).`;

      setTimeout(() => {
        setAiState('responding');
        sounds.playMessage();
        addMessage({ type: 'ai', text: simulatedReply });
        addNotification({
          type: 'info',
          title: 'Phản hồi từ CAT',
          message: 'Đã tạo phản hồi. Cấu hình API Key trong Cài đặt để dùng AI trực tiếp.',
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
        filesOpen,
        setFilesOpen,
        leftPanel,
        setLeftPanel,
        rightPanel,
        setRightPanel,
        memories,
        uploadedDocuments,
        addUploadedDocument,
        removeUploadedDocument,
        analyzeDocument,
        aiConfig,
        updateAIConfig,
        sendAIChat,
        soundEnabled,
        setSoundEnabled,
        soundVolume,
        setSoundVolume,
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
