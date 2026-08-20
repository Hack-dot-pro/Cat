import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal, Send, Trash2, Download, Paperclip, FileText,
  X, Sparkles, RefreshCw, Layers, Cpu, CheckCircle, Volume2, Square, Package
} from 'lucide-react';
import { useApp, Message } from '../context/AppContext';
import { sounds } from '../services/sound';
import { openAIService } from '../services/openai';
import { mcpService } from '../services/mcp';
import { terminalService } from '../services/terminal';
import { UploadedDocument } from './FilesPanel';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

const SUGGESTIONS = [
  'Thư Ký Kim kiểm tra lịch trình',
  'Hệ thống hóa tài liệu giúp anh',
  'Chẩn đoán hệ thống Thư Ký Kim',
  'Giao thức công cụ MCP',
  'Kiểm tra Gateway Xkiro',
  'Bảo mật và mã hóa AES',
];

export function CommandConsole() {
  const {
    messages,
    addMessage,
    clearMessages,
    setAiState,
    setScanningActive,
    setSettingsOpen,
    setAppGridOpen,
    setGestureOpen,
    setFilesOpen,
    setMcpOpen,
    setTerminalOpen,
    addNotification,
    uploadedFiles,
    setUploadedFiles,
    userName,
    userFullName,
    isSpeaking,
    speakText,
    stopSpeaking,
  } = useApp();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [attachedFile, setAttachedFile] = useState<UploadedDocument | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, streamingText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    sounds.playClick();

    const reader = new FileReader();
    reader.onload = event => {
      const content = (event.target?.result as string) || '';
      const doc: UploadedDocument = {
        id: `doc_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content,
        uploadedAt: new Date(),
        status: 'ready',
      };
      setUploadedFiles(prev => [doc, ...prev]);
      setAttachedFile(doc);
      sounds.playSuccess();
      addNotification({
        type: 'success',
        title: 'Đã đính kèm file',
        message: `Tài liệu "${file.name}" đã được đính kèm vào lượt chat.`,
      });
    };
    reader.readAsText(file);
  };

  const handleProcessMessage = async (userText: string) => {
    const lower = userText.toLowerCase().trim();

    // Local command triggers
    if (lower.includes('scan') || lower.includes('quét')) {
      sounds.playScan();
      setTimeout(() => setScanningActive(true), 800);
    } else if (lower.includes('terminal') || lower.includes('dòng lệnh') || lower.includes('cmd') || lower.includes('cli')) {
      setTimeout(() => setTerminalOpen(true), 800);
    } else if (lower.includes('cài đặt') || lower.includes('settings')) {
      setTimeout(() => setSettingsOpen(true), 800);
    } else if (lower.includes('ứng dụng') || lower.includes('app')) {
      setTimeout(() => setAppGridOpen(true), 800);
    } else if (lower.includes('cử chỉ') || lower.includes('gesture')) {
      setTimeout(() => setGestureOpen(true), 800);
    } else if (lower.includes('tài liệu') || lower.includes('file')) {
      setTimeout(() => setFilesOpen(true), 800);
    } else if (lower.includes('mcp') || lower.includes('tool')) {
      setTimeout(() => setMcpOpen(true), 800);
    }

    // 1. Detect if Web Browsing or Live Search is needed
    const urlMatch = userText.match(/https?:\/\/[^\s]+/i);
    const isSearchIntent =
      lower.includes('tìm') ||
      lower.includes('tra cứu') ||
      lower.includes('tin tức') ||
      lower.includes('thời sự') ||
      lower.includes('thời tiết') ||
      lower.includes('giá vàng') ||
      lower.includes('chứng khoán') ||
      lower.includes('mới nhất') ||
      lower.includes('hôm nay') ||
      lower.includes('wikipedia') ||
      lower.includes('trên mạng') ||
      lower.includes('trên internet') ||
      lower.includes('trang web') ||
      lower.includes('github') ||
      lower.includes('báo');

    let webContext = '';

    if (urlMatch) {
      const url = urlMatch[0];
      setStreamingText(`🌐 Thư Ký Kim đang đọc tài liệu web từ: ${url}...`);
      try {
        const browseRes = await mcpService.executeTool('kim_web_browse', { url });
        if (browseRes.success && browseRes.result?.content) {
          webContext = `\n\n[DỮ LIỆU TÀI LIỆU WEB TRÍCH XUẤT TỪ: ${url}]\nTiêu đề: ${browseRes.result.title}\nNội dung:\n${browseRes.result.content}\n`;
        }
      } catch {
        // Continue
      }
    } else if (isSearchIntent) {
      setStreamingText(`🔍 Thư Ký Kim đang tìm kiếm dữ liệu trên Internet cho anh...`);
      try {
        const cleanQuery = userText
          .replace(/^(kim|thư ký kim|em kim|kim ơi)[,\s]*/i, '')
          .replace(/^(tìm|tra cứu|xem|kiểm tra|tìm kiếm|cho em biết|cho anh biết)[,\s]*/i, '')
          .trim();
        const searchRes = await mcpService.executeTool('kim_web_search', { query: cleanQuery || userText });
        if (searchRes.success && searchRes.result?.results?.length > 0) {
          const formattedResults = searchRes.result.results
            .map((r: any, idx: number) => `[Nguồn ${idx + 1}: ${r.title}] (${r.url})\n${r.snippet}`)
            .join('\n\n');
          webContext = `\n\n[KẾT QUẢ TRA CỨU WEB THỜI GIAN THỰC]\n${formattedResults}\n(Hãy sử dụng dữ liệu trên để tổng hợp, phân tích và phản hồi đầy đủ, chính xác, kèm trích dẫn đường link cho anh Vinh.)\n`;
        }
      } catch {
        // Continue
      }
    }

    // 2. Detect if Package Installation or Terminal Command is requested
    const isInstallIntent =
      lower.includes('cài đặt thư viện') ||
      lower.includes('cài thư viện') ||
      lower.includes('tải thư viện') ||
      lower.includes('cài gói') ||
      lower.includes('tải gói') ||
      lower.includes('npm install') ||
      lower.includes('npm i ') ||
      lower.includes('pip install') ||
      lower.includes('yarn add') ||
      lower.includes('pnpm add') ||
      lower.includes('git clone');

    let packageContext = '';

    if (isInstallIntent) {
      setStreamingText('📦 Thư Ký Kim đang tải và cài đặt thư viện vào hệ thống...');
      let manager: 'npm' | 'pip' | 'cdn' | 'git' = 'npm';
      if (lower.includes('pip') || lower.includes('python')) {
        manager = 'pip';
      } else if (lower.includes('git clone')) {
        manager = 'git';
      } else if (lower.includes('cdn')) {
        manager = 'cdn';
      }

      const cleanPkg = userText
        .replace(/^(kim|thư ký kim|em kim|kim ơi)[,\s]*/i, '')
        .replace(/^(cài đặt thư viện|cài thư viện|tải thư viện|cài gói|tải gói|cài|tải|npm i|npm install|pip install|yarn add|pnpm add)[,\s]*/i, '')
        .replace(/(giúp anh|cho anh|vào hệ thống|nhé|nha|về|ạ)$/i, '')
        .trim();

      if (cleanPkg) {
        try {
          const installRes = await terminalService.installPackage(cleanPkg, manager, 'latest');
          packageContext = `\n\n[KẾT QUẢ CÀI ĐẶT THƯ VIỆN QUA TERMINAL]\nTrạng thái: ${installRes.success ? 'Thành công' : 'Thất bại'}\nThông điệp: ${installRes.message}\nThông tin gói: ${JSON.stringify(installRes.package || {})}\n(Hãy thông báo kết quả cài đặt và hướng dẫn chi tiết cách import / sử dụng thư viện này cho anh Vinh nhé.)\n`;
        } catch (e: any) {
          packageContext = `\n\n[LỖI CÀI ĐẶT THƯ VIỆN]: ${e.message}\n`;
        }
      }
    }

    // Prepare message history for OpenAI chat completions
    let promptContent = userText + webContext + packageContext;
    if (attachedFile) {
      promptContent = `[Tài liệu đính kèm: "${attachedFile.name}" (${(attachedFile.size / 1024).toFixed(1)} KB)]\n--- NỘI DUNG TÀI LIỆU ---\n${attachedFile.content.slice(0, 10000)}\n\n--- YÊU CẦU CỦA ${userName} (${userFullName}) ---\n${userText}${webContext}`;
    }

    const historyPayload = messages.slice(-8).map(m => ({
      role: m.type === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));

    historyPayload.push({ role: 'user', content: promptContent });

    // Check if tools can be provided
    const mcpTools = mcpService.formatToolsForOpenAI();

    try {
      let accumulated = '';
      setStreamingText('');

      const result = await openAIService.chatCompletion({
        messages: historyPayload,
        tools: mcpTools.length > 0 ? mcpTools : undefined,
        onChunk: (chunk, full) => {
          accumulated = full;
          setStreamingText(full);
        },
        onFallbackTriggered: (fallbackName, originalError) => {
          addNotification({
            type: 'warning',
            title: 'Tự động kích hoạt API dự phòng',
            message: `Cổng chính bận, Thư Ký Kim đang chuyển sang: ${fallbackName}`,
          });
        },
      });

      setStreamingText('');
      setIsTyping(false);
      setAiState('responding');
      addMessage({ type: 'ai', text: result || accumulated });
      setTimeout(() => setAiState('idle'), 2000);
    } catch (err: any) {
      console.warn('API Completion failed, using offline neural fallback:', err);
      // Offline fallback
      let fallbackResponse = `Dạ anh ${userName}! Em đã tiếp nhận yêu cầu của anh rồi ạ. `;
      if (attachedFile) {
        fallbackResponse += `Em đã kiểm tra tài liệu **${attachedFile.name}** (~${Math.ceil(attachedFile.content.length / 3.2)} tokens). `;
      }
      fallbackResponse += `Thư Ký Kim đang kết nối qua Gateway Xkiro (https://api.xkiro.com/v1) cùng hệ thống API dự phòng. Anh có thể kiểm tra hoặc thêm API Key dự phòng ở Cài đặt ạ!`;

      setStreamingText('');
      setIsTyping(false);
      setAiState('responding');
      addMessage({ type: 'ai', text: fallbackResponse });
      setTimeout(() => setAiState('idle'), 2000);
    }
  };

  const handleSubmit = () => {
    if ((!input.trim() && !attachedFile) || isTyping) return;
    sounds.playClick();
    const text = input.trim() || `Phân tích và hệ thống hóa tài liệu [${attachedFile?.name}]`;
    const currentAttachment = attachedFile;

    setInput('');
    setAttachedFile(null);

    addMessage({
      type: 'user',
      text,
      attachedFile: currentAttachment ? { name: currentAttachment.name, size: currentAttachment.size } : undefined,
    });

    setAiState('processing');
    setIsTyping(true);

    handleProcessMessage(text);
  };

  const handleExport = () => {
    sounds.playClick();
    const text = messages.map(m => `[${m.timestamp.toISOString()}] ${m.type.toUpperCase()}: ${m.text}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cat-ai-console-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification({ type: 'success', title: 'Đã xuất nhật ký', message: 'Lịch sử trò chuyện đã được tải về.' });
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden" style={{ fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" style={{ color: '#00f5ff' }} />
          <span style={{ ...orb, color: '#00f5ff', fontSize: '11px', letterSpacing: '0.15em' }}>
            DÒNG LỆNH THƯ KÝ KIM
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              sounds.playClick();
              setTerminalOpen(true);
            }}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.25)' }}
            title="Mở Holographic Terminal & Trình tải Gói"
          >
            <Package className="w-3.5 h-3.5 text-cyan-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              sounds.playClick();
              setFilesOpen(true);
            }}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.15)' }}
            title="Mở Trung tâm Tài liệu"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleExport}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.12)' }}
            title="Xuất file nhật ký"
          >
            <Download className="w-3.5 h-3.5" style={{ color: 'rgba(0,245,255,0.5)' }} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearMessages}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.12)' }}
            title="Xóa console"
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: 'rgba(0,245,255,0.5)' }} />
          </motion.button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,245,255,0.2) transparent' }}
      >
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type === 'ai' && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: 'rgba(0,245,255,0.1)',
                    border: '1px solid rgba(0,245,255,0.3)',
                    boxShadow: '0 0 8px rgba(0,245,255,0.2)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00f5ff' }} />
                </div>
              )}

              <div
                className="max-w-[88%] rounded-2xl px-3.5 py-2.5"
                style={
                  msg.type === 'ai'
                    ? {
                        background: 'rgba(0, 245, 255, 0.05)',
                        border: '1px solid rgba(0,245,255,0.2)',
                        boxShadow: '0 0 12px rgba(0,245,255,0.05)',
                        borderRadius: '4px 16px 16px 16px',
                      }
                    : {
                        background: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168,85,247,0.35)',
                        boxShadow: '0 0 12px rgba(168,85,247,0.08)',
                        borderRadius: '16px 4px 16px 16px',
                      }
                }
              >
                {/* Header of message bubble */}
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        ...mono,
                        color: msg.type === 'ai' ? '#ec4899' : '#a855f7',
                        fontSize: '9px',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {msg.type === 'ai' ? 'THƯ KÝ KIM' : `${userName} (ANH VINH)`}
                    </span>
                    {msg.type === 'ai' && (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          if (isSpeaking) {
                            stopSpeaking();
                          } else {
                            speakText(msg.text);
                          }
                        }}
                        className="p-0.5 rounded hover:bg-pink-500/20 text-pink-400/70 hover:text-pink-300 cursor-pointer transition-all"
                        title={isSpeaking ? 'Dừng đọc' : 'Đọc bằng giọng nữ Thư Ký Kim'}
                      >
                        {isSpeaking ? (
                          <Square className="w-2.5 h-2.5 text-pink-400" />
                        ) : (
                          <Volume2 className="w-2.5 h-2.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <span style={{ ...mono, color: 'rgba(255,255,255,0.25)', fontSize: '8px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour12: false })}
                  </span>
                </div>

                {/* Attached File Chip if present */}
                {msg.attachedFile && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg mb-2 text-xs"
                    style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)' }}
                  >
                    <FileText className="w-3 h-3 text-cyan-400" />
                    <span style={{ ...mono, color: '#00f5ff', fontSize: '9px' }}>
                      {msg.attachedFile.name} ({(msg.attachedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}

                {/* Message Body */}
                <div
                  className="whitespace-pre-wrap select-text"
                  style={{ ...aptos, color: 'rgba(255,255,255,0.9)', fontSize: '13px', lineHeight: '1.55' }}
                >
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Streaming Text Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 items-start"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.35)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ec4899' }} />
              </div>
              <div
                className="max-w-[88%] px-3.5 py-2.5 rounded-2xl"
                style={{
                  background: 'rgba(236,72,153,0.06)',
                  border: '1px solid rgba(236,72,153,0.25)',
                  borderRadius: '4px 16px 16px 16px',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span style={{ ...mono, color: '#ec4899', fontSize: '9px', letterSpacing: '0.1em' }}>
                    THƯ KÝ KIM (ĐANG SOẠN THẢO)
                  </span>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-pink-400" />
                </div>
                <div style={{ ...aptos, color: 'rgba(255,255,255,0.9)', fontSize: '13px', lineHeight: '1.55' }}>
                  {streamingText || 'Đang tư duy và xử lý nơ-ron...'}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    style={{ color: '#00f5ff', marginLeft: 2 }}
                  >
                    ▋
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-1.5 flex-shrink-0">
        {SUGGESTIONS.map(s => (
          <motion.button
            key={s}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              sounds.playClick();
              setInput(s);
              inputRef.current?.focus();
            }}
            className="px-2.5 py-1 rounded-lg cursor-pointer"
            style={{
              background: 'rgba(0,245,255,0.04)',
              border: '1px solid rgba(0,245,255,0.15)',
            }}
          >
            <span style={{ ...aptos, color: 'rgba(0,245,255,0.7)', fontSize: '11px' }}>{s}</span>
          </motion.button>
        ))}
      </div>

      {/* Attached File Preview Bar */}
      {attachedFile && (
        <div
          className="flex items-center justify-between px-3 py-1.5 rounded-xl flex-shrink-0"
          style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.3)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span style={{ ...aptos, color: '#00f5ff', fontSize: '12px' }} className="truncate">
              {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={() => setAttachedFile(null)}
            className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Box */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2 flex-shrink-0"
        style={{
          background: 'rgba(0,8,25,0.75)',
          border: '1px solid rgba(0,245,255,0.25)',
          boxShadow: '0 0 15px rgba(0,245,255,0.06)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Paperclip Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg cursor-pointer"
          style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.15)' }}
          title="Đính kèm file tài liệu"
        >
          <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
        </motion.button>

        <span style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '12px' }}>{'>'}</span>

        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Nhập câu hỏi, lệnh hệ thống hoặc đính kèm file..."
          className="flex-1 outline-none bg-transparent"
          style={{ ...aptos, color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}
        />

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSubmit}
          disabled={(!input.trim() && !attachedFile) || isTyping}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{
            background: (input.trim() || attachedFile) && !isTyping ? 'rgba(0,245,255,0.25)' : 'rgba(0,245,255,0.04)',
            border: `1px solid ${(input.trim() || attachedFile) && !isTyping ? 'rgba(0,245,255,0.6)' : 'rgba(0,245,255,0.1)'}`,
          }}
        >
          <Send className="w-4 h-4" style={{ color: (input.trim() || attachedFile) && !isTyping ? '#00f5ff' : 'rgba(0,245,255,0.3)' }} />
        </motion.button>
      </div>
    </div>
  );
}
