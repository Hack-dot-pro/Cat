import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Send, Trash2, Download, Sparkles, Paperclip, FileText, X, Volume2, VolumeX } from 'lucide-react';
import { useApp, UploadedDocument } from '../context/AppContext';
import { sounds } from '../services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const raj = { fontFamily: 'Rajdhani, sans-serif' };

const SUGGESTIONS = [
  'quét hệ thống',
  'phân tích tài liệu',
  'trạng thái',
  'thời tiết',
  'triển khai',
  'trợ giúp',
];

export function CommandConsole() {
  const {
    messages,
    clearMessages,
    aiState,
    sendAIChat,
    aiConfig,
    setSettingsOpen,
    setFilesOpen,
    addUploadedDocument,
    addNotification,
    robotSpeaking,
    speakText,
    stopSpeaking,
  } = useApp();

  const [input, setInput] = useState('');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; size: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProcessing = aiState === 'processing';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiState]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const text = await file.text();
      setAttachedFile({
        name: file.name,
        content: text,
        size: file.size,
      });

      // Also register into uploaded documents
      const newDoc: UploadedDocument = {
        id: Date.now().toString() + Math.random().toString().slice(2, 6),
        name: file.name,
        size: file.size,
        type: file.name.endsWith('.json') ? 'json' : file.name.endsWith('.csv') ? 'csv' : 'text',
        content: text.slice(0, 100000),
        timestamp: new Date(),
        tokenCount: Math.round(text.length / 4),
        status: 'ready',
      };
      addUploadedDocument(newDoc);
      sounds.playSuccess();
      addNotification({
        type: 'info',
        title: 'Đã Đính Kèm Tệp',
        message: `Tệp "${file.name}" đã được đính kèm vào hội thoại.`,
      });
    } catch (err: any) {
      sounds.playError();
      addNotification({
        type: 'error',
        title: 'Lỗi Đính Kèm',
        message: err.message || 'Không thể đọc tệp',
      });
    }
  };

  const handleSubmit = async () => {
    if ((!input.trim() && !attachedFile) || isProcessing) return;

    let fullPrompt = input.trim();
    if (attachedFile) {
      fullPrompt = `${fullPrompt ? fullPrompt + '\n\n' : 'Hãy phân tích tệp đính kèm sau:\n\n'}[Tài liệu đính kèm: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content.slice(0, 8000)}\n\`\`\``;
    }

    setInput('');
    setAttachedFile(null);
    await sendAIChat(fullPrompt);
  };

  const handleExportChat = () => {
    sounds.playClick();
    const text = messages
      .map(
        m =>
          `[${m.timestamp.toLocaleString('vi-VN')}] ${m.type.toUpperCase()}: ${m.text}`
      )
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cat-console-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification({
      type: 'success',
      title: 'Đã Xuất Nhật Ký',
      message: 'Lịch sử hội thoại đã được tải xuống máy.',
    });
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" style={{ color: '#00f5ff' }} />
          <span style={{ ...orb, color: '#00f5ff', fontSize: '11px', letterSpacing: '0.15em' }}>
            BẢNG ĐIỀU KHIỂN & DÒNG LỆNH
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Files Center button */}
          <button
            onClick={() => {
              sounds.playClick();
              setFilesOpen(true);
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
            style={{
              background: 'rgba(0,245,255,0.08)',
              border: '1px solid rgba(0,245,255,0.25)',
            }}
            title="Mở Trung tâm Phân tích Tệp tin"
          >
            <FileText className="w-2.5 h-2.5 text-cyan-400" />
            <span style={{ ...mono, color: '#00f5ff', fontSize: '8px' }}>TỆP TIN</span>
          </button>

          {/* Active Model Badge */}
          <button
            onClick={() => {
              sounds.playClick();
              setSettingsOpen(true);
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
            style={{
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.25)',
            }}
            title="Nhấn để cấu hình Model & API"
          >
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            <span style={{ ...mono, color: '#a855f7', fontSize: '8px' }}>
              {aiConfig.model.slice(0, 12)}
            </span>
          </button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleExportChat}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.12)' }}
            title="Tải nhật ký hội thoại"
          >
            <Download className="w-3 h-3" style={{ color: 'rgba(0,245,255,0.5)' }} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearMessages}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.12)' }}
            title="Xóa màn hình dòng lệnh"
          >
            <Trash2 className="w-3 h-3" style={{ color: 'rgba(0,245,255,0.5)' }} />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
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
                        border: '1px solid rgba(168,85,247,0.3)',
                        boxShadow: '0 0 12px rgba(168,85,247,0.08)',
                        borderRadius: '16px 4px 16px 16px',
                      }
                }
              >
                <p
                  style={{
                    ...raj,
                    color: msg.type === 'ai' ? 'rgba(220,240,255,0.95)' : 'rgba(220,200,255,0.95)',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text || (msg.isStreaming ? '...' : '')}
                  {msg.isStreaming && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      style={{ color: '#00f5ff', marginLeft: 2 }}
                    >
                      ▋
                    </motion.span>
                  )}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  {msg.type === 'ai' ? (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        if (robotSpeaking && speakingMsgId === msg.id) {
                          stopSpeaking();
                          setSpeakingMsgId(null);
                        } else {
                          speakText(msg.text);
                          setSpeakingMsgId(msg.id);
                        }
                      }}
                      className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      style={{
                        background: robotSpeaking && speakingMsgId === msg.id ? 'rgba(168,85,247,0.25)' : 'rgba(0,245,255,0.06)',
                        color: robotSpeaking && speakingMsgId === msg.id ? '#a855f7' : 'rgba(0,245,255,0.6)',
                        border: `1px solid ${robotSpeaking && speakingMsgId === msg.id ? '#a855f7' : 'rgba(0,245,255,0.15)'}`,
                      }}
                      title="Đọc bằng giọng Robot Tiếng Việt"
                    >
                      <Volume2 className={`w-2.5 h-2.5 ${robotSpeaking && speakingMsgId === msg.id ? 'animate-pulse' : ''}`} />
                      <span style={{ ...mono }}>{robotSpeaking && speakingMsgId === msg.id ? 'ĐANG ĐỌC' : 'ĐỌC GIỌNG ROBOT'}</span>
                    </button>
                  ) : <div />}
                  <span style={{ ...mono, color: 'rgba(255,255,255,0.25)', fontSize: '9px' }}>
                    {msg.timestamp.toLocaleTimeString('vi-VN', { hour12: false })}
                  </span>
                </div>
              </div>

              {msg.type === 'user' && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: 'rgba(168,85,247,0.15)',
                    border: '1px solid rgba(168,85,247,0.4)',
                    boxShadow: '0 0 8px rgba(168,85,247,0.2)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a855f7' }} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Processing indicator */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex gap-2 items-center"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00f5ff' }} />
              </div>
              <div
                className="px-3 py-2 rounded-2xl flex items-center gap-1.5"
                style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.15)' }}
              >
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#00f5ff' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Attached file chip */}
      {attachedFile && (
        <div
          className="flex items-center justify-between px-3 py-1.5 rounded-xl flex-shrink-0"
          style={{
            background: 'rgba(0,245,255,0.08)',
            border: '1px solid rgba(0,245,255,0.3)',
          }}
        >
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span style={{ ...raj, color: '#ffffff', fontSize: '12px' }} className="truncate">
              {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={() => setAttachedFile(null)}
            className="p-1 hover:text-red-400 cursor-pointer"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      )}

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5 flex-shrink-0">
        {SUGGESTIONS.map(s => (
          <motion.button
            key={s}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sounds.playClick();
              if (s === 'phân tích tài liệu') {
                setFilesOpen(true);
              } else {
                setInput(s);
                inputRef.current?.focus();
              }
            }}
            className="px-2.5 py-1 rounded-lg cursor-pointer"
            style={{
              background: 'rgba(0,245,255,0.04)',
              border: '1px solid rgba(0,245,255,0.15)',
            }}
          >
            <span style={{ ...mono, color: 'rgba(0,245,255,0.6)', fontSize: '9px' }}>{s}</span>
          </motion.button>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-shrink-0"
        style={{
          background: 'rgba(0,8,25,0.7)',
          border: '1px solid rgba(0,245,255,0.2)',
          boxShadow: '0 0 10px rgba(0,245,255,0.04)',
        }}
      >
        <span style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '12px' }}>{'>'}</span>

        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={attachedFile ? `Nhập yêu cầu phân tích cho "${attachedFile.name}"...` : "Nhập lệnh hoặc trò chuyện với CAT..."}
          className="flex-1 outline-none bg-transparent"
          style={{ ...raj, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}
        />

        {/* Attach File Button */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.html,.css,.xml,.log,.env,.sql,.pdf"
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            sounds.playClick();
            fileInputRef.current?.click();
          }}
          className="p-1 cursor-pointer hover:text-cyan-400"
          title="Đính kèm tệp tài liệu"
        >
          <Paperclip className="w-4 h-4" style={{ color: attachedFile ? '#00f5ff' : 'rgba(255,255,255,0.4)' }} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSubmit}
          disabled={(!input.trim() && !attachedFile) || isProcessing}
          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
          style={{
            background: (input.trim() || attachedFile) && !isProcessing ? 'rgba(0,245,255,0.2)' : 'rgba(0,245,255,0.04)',
            border: `1px solid ${(input.trim() || attachedFile) && !isProcessing ? 'rgba(0,245,255,0.5)' : 'rgba(0,245,255,0.1)'}`,
          }}
        >
          <Send className="w-3.5 h-3.5" style={{ color: (input.trim() || attachedFile) && !isProcessing ? '#00f5ff' : 'rgba(0,245,255,0.3)' }} />
        </motion.button>
      </div>
    </div>
  );
}
