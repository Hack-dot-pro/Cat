import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Upload, FileText, FileCode, FileJson, FileSpreadsheet,
  Trash2, Sparkles, Brain, CheckCircle, Clock, Eye, Copy,
  Check, ArrowRight, MessageSquare, Plus, RefreshCw, File
} from 'lucide-react';
import { useApp, UploadedDocument } from '../context/AppContext';
import { sounds } from '../services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const raj = { fontFamily: 'Rajdhani, sans-serif' };

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  switch (type) {
    case 'code':
      return FileCode;
    case 'json':
      return FileJson;
    case 'csv':
      return FileSpreadsheet;
    case 'pdf':
    case 'text':
    default:
      return FileText;
  }
}

function getFileColor(type: string) {
  switch (type) {
    case 'code':
      return '#00f5ff';
    case 'json':
      return '#f59e0b';
    case 'csv':
      return '#22c55e';
    case 'pdf':
      return '#ef4444';
    case 'text':
    default:
      return '#a855f7';
  }
}

export function FilesPanel() {
  const {
    filesOpen,
    setFilesOpen,
    uploadedDocuments,
    addUploadedDocument,
    removeUploadedDocument,
    analyzeDocument,
    sendAIChat,
    setRightPanel,
    addNotification,
  } = useApp();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDoc = uploadedDocuments.find(d => d.id === selectedDocId) || uploadedDocuments[0] || null;

  const handleFileProcess = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    sounds.playClick();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase() || '';

      let docType: UploadedDocument['type'] = 'text';
      if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'cpp', 'html', 'css', 'go', 'rs', 'php', 'sql', 'sh'].includes(extension)) {
        docType = 'code';
      } else if (extension === 'json') {
        docType = 'json';
      } else if (['csv', 'xlsx', 'xls'].includes(extension)) {
        docType = 'csv';
      } else if (extension === 'pdf') {
        docType = 'pdf';
      }

      try {
        const content = await file.text();
        const docId = Date.now().toString() + Math.random().toString().slice(2, 6);
        const newDoc: UploadedDocument = {
          id: docId,
          name: file.name,
          size: file.size,
          type: docType,
          content: content.slice(0, 100000), // Max 100k chars for performance
          timestamp: new Date(),
          tokenCount: Math.round(content.length / 4),
          status: 'ready',
        };

        addUploadedDocument(newDoc);
        setSelectedDocId(docId);
        sounds.playSuccess();
        addNotification({
          type: 'success',
          title: 'Đã Tải Lên Tài Liệu',
          message: `Tệp "${file.name}" (${formatFileSize(file.size)}) đã sẵn sàng để AI phân tích.`,
        });
      } catch (err: any) {
        sounds.playError();
        addNotification({
          type: 'error',
          title: 'Lỗi Đọc Tệp',
          message: `Không thể đọc tệp "${file.name}": ${err.message || 'Lỗi không xác định'}`,
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileProcess(e.dataTransfer.files);
  };

  const handleCopyAnalysis = (text: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addNotification({
      type: 'info',
      title: 'Đã Sao Chép',
      message: 'Kết quả phân tích đã được lưu vào bộ nhớ tạm.',
    });
  };

  const handleChatWithDocument = (doc: UploadedDocument) => {
    sounds.playClick();
    setFilesOpen(false);
    setRightPanel('console');
    const prompt = `Dưới đây là nội dung tài liệu "${doc.name}":\n\n\`\`\`\n${doc.content.slice(0, 8000)}\n\`\`\`\n\nHãy phân tích và trả lời các thắc mắc về tài liệu này.`;
    sendAIChat(prompt);
  };

  const handleRunAnalysis = async (doc: UploadedDocument, mode: 'summary' | 'deep' | 'extract') => {
    sounds.playClick();
    await analyzeDocument(doc.id, mode);
  };

  return (
    <AnimatePresence>
      {filesOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 175, background: 'rgba(0, 4, 12, 0.92)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-5xl mx-6 rounded-2xl overflow-hidden flex flex-col"
            style={{
              height: '86vh',
              background: 'rgba(0, 10, 25, 0.96)',
              border: '1px solid rgba(0, 245, 255, 0.25)',
              boxShadow: '0 0 60px rgba(0,245,255,0.12), inset 0 0 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-8 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0,245,255,0.15)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(0,245,255,0.1)',
                    border: '1px solid rgba(0,245,255,0.3)',
                    boxShadow: '0 0 12px rgba(0,245,255,0.2)',
                  }}
                >
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 style={{ ...orb, color: '#00f5ff', fontSize: '15px', letterSpacing: '0.2em', margin: 0 }}>
                    TRUNG TÂM PHÂN TÍCH TÀI LIỆU & TỆP TIN
                  </h2>
                  <p style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '10px', marginTop: 2 }}>
                    Tải lên tài liệu PDF, DOCX, TXT, JSON, CODE để mô hình AI phân tích chuyên sâu
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={e => handleFileProcess(e.target.files)}
                  className="hidden"
                  accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.html,.css,.xml,.log,.env,.sql,.pdf"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl cursor-pointer"
                  style={{
                    background: 'rgba(0,245,255,0.15)',
                    border: '1px solid rgba(0,245,255,0.4)',
                    boxShadow: '0 0 12px rgba(0,245,255,0.15)',
                  }}
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span style={{ ...mono, color: '#00f5ff', fontSize: '10px' }}>TẢI TỆP LÊN</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    sounds.playClick();
                    setFilesOpen(false);
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                </motion.button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar: Document List & Upload Dropzone */}
              <div
                className="w-80 flex flex-col gap-3 p-4 flex-shrink-0"
                style={{ borderRight: '1px solid rgba(0,245,255,0.1)', background: 'rgba(0,6,18,0.4)' }}
              >
                {/* Upload Dropzone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center"
                  style={{
                    background: isDragging ? 'rgba(0,245,255,0.12)' : 'rgba(0,245,255,0.03)',
                    border: `1.5px dashed ${isDragging ? '#00f5ff' : 'rgba(0,245,255,0.25)'}`,
                    boxShadow: isDragging ? '0 0 20px rgba(0,245,255,0.2)' : 'none',
                  }}
                >
                  <Upload className="w-6 h-6 text-cyan-400" />
                  <span style={{ ...raj, color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}>
                    Kéo thả tệp vào đây hoặc nhấn để chọn
                  </span>
                  <span style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '9px' }}>
                    Hỗ trợ: TXT, MD, PDF, JSON, CSV, CODE
                  </span>
                </div>

                {/* Documents List Header */}
                <div className="flex items-center justify-between mt-1">
                  <span style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                    DANH SÁCH TÀI LIỆU ({uploadedDocuments.length})
                  </span>
                </div>

                {/* Document Items */}
                <div
                  className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,245,255,0.2) transparent' }}
                >
                  {uploadedDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                      <File className="w-8 h-8 text-cyan-400/30 mb-2" />
                      <p style={{ ...raj, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                        Chưa có tài liệu nào được tải lên.
                      </p>
                    </div>
                  ) : (
                    uploadedDocuments.map(doc => {
                      const Icon = getFileIcon(doc.type);
                      const color = getFileColor(doc.type);
                      const isSelected = selectedDoc?.id === doc.id;

                      return (
                        <motion.div
                          key={doc.id}
                          whileHover={{ scale: 1.01, x: 2 }}
                          onClick={() => {
                            sounds.playClick();
                            setSelectedDocId(doc.id);
                          }}
                          className="rounded-xl p-3 flex items-start gap-3 cursor-pointer group"
                          style={{
                            background: isSelected ? 'rgba(0,245,255,0.12)' : 'rgba(0,10,25,0.6)',
                            border: `1px solid ${isSelected ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                            boxShadow: isSelected ? '0 0 15px rgba(0,245,255,0.1)' : 'none',
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                          >
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              style={{ ...raj, color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)', fontSize: '13px' }}
                              className="truncate"
                            >
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span style={{ ...mono, color: 'rgba(255,255,255,0.35)', fontSize: '9px' }}>
                                {formatFileSize(doc.size)}
                              </span>
                              <span style={{ ...mono, color: `${color}`, fontSize: '9px' }}>
                                {doc.type.toUpperCase()}
                              </span>
                              {doc.analysis && (
                                <span
                                  className="px-1 py-0.2 rounded text-[8px]"
                                  style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}
                                >
                                  ĐÃ PHÂN TÍCH
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              sounds.playClick();
                              removeUploadedDocument(doc.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400/70" />
                          </button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Main Area: Document Preview & AI Analysis */}
              <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
                {selectedDoc ? (
                  <>
                    {/* Selected Document Info Bar */}
                    <div
                      className="rounded-2xl p-4 flex items-center justify-between flex-shrink-0"
                      style={{
                        background: 'rgba(0,10,25,0.7)',
                        border: '1px solid rgba(0,245,255,0.15)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: `${getFileColor(selectedDoc.type)}20`,
                            border: `1px solid ${getFileColor(selectedDoc.type)}40`,
                          }}
                        >
                          {React.createElement(getFileIcon(selectedDoc.type), {
                            className: 'w-5 h-5',
                            style: { color: getFileColor(selectedDoc.type) },
                          })}
                        </div>
                        <div>
                          <h3 style={{ ...raj, color: '#ffffff', fontSize: '15px', margin: 0 }}>
                            {selectedDoc.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
                              Dung lượng: {formatFileSize(selectedDoc.size)}
                            </span>
                            <span style={{ ...mono, color: 'rgba(0,245,255,0.6)', fontSize: '10px' }}>
                              ~{selectedDoc.tokenCount} tokens
                            </span>
                            <span style={{ ...mono, color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                              {selectedDoc.timestamp.toLocaleTimeString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={selectedDoc.status === 'analyzing'}
                          onClick={() => handleRunAnalysis(selectedDoc, 'summary')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer"
                          style={{
                            background: 'rgba(168,85,247,0.15)',
                            border: '1px solid rgba(168,85,247,0.35)',
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span style={{ ...mono, color: '#a855f7', fontSize: '10px' }}>TÓM TẮT</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={selectedDoc.status === 'analyzing'}
                          onClick={() => handleRunAnalysis(selectedDoc, 'deep')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer"
                          style={{
                            background: 'rgba(0,245,255,0.15)',
                            border: '1px solid rgba(0,245,255,0.35)',
                          }}
                        >
                          <Brain className="w-3.5 h-3.5 text-cyan-400" />
                          <span style={{ ...mono, color: '#00f5ff', fontSize: '10px' }}>PHÂN TÍCH CHUYÊN SÂU</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleChatWithDocument(selectedDoc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer"
                          style={{
                            background: 'rgba(34,197,94,0.15)',
                            border: '1px solid rgba(34,197,94,0.35)',
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                          <span style={{ ...mono, color: '#22c55e', fontSize: '10px' }}>HỎI ĐÁP VỚI CAT</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Content Split: Raw Preview & AI Analysis */}
                    <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                      {/* Left: Raw File Content */}
                      <div
                        className="rounded-2xl p-4 flex flex-col gap-2 overflow-hidden"
                        style={{
                          background: 'rgba(0,5,15,0.7)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                            NỘI DUNG TÀI LIỆU GỐC
                          </span>
                          <span style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '9px' }}>
                            {selectedDoc.content.length} ký tự
                          </span>
                        </div>
                        <div
                          className="flex-1 overflow-y-auto p-3 rounded-xl"
                          style={{
                            background: 'rgba(0,2,8,0.5)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            scrollbarWidth: 'thin',
                          }}
                        >
                          <pre
                            style={{
                              ...mono,
                              color: 'rgba(255,255,255,0.8)',
                              fontSize: '11px',
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {selectedDoc.content}
                          </pre>
                        </div>
                      </div>

                      {/* Right: AI Analysis Result */}
                      <div
                        className="rounded-2xl p-4 flex flex-col gap-2 overflow-hidden"
                        style={{
                          background: 'rgba(0,8,22,0.7)',
                          border: '1px solid rgba(168,85,247,0.2)',
                          boxShadow: '0 0 20px rgba(168,85,247,0.05)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span style={{ ...mono, color: '#a855f7', fontSize: '10px' }}>
                              KẾT QUẢ PHÂN TÍCH TỪ AI (GWEN 3.8 MAX)
                            </span>
                          </div>

                          {selectedDoc.analysis && (
                            <button
                              onClick={() => handleCopyAnalysis(selectedDoc.analysis!)}
                              className="flex items-center gap-1 text-xs text-purple-300 hover:text-white cursor-pointer"
                            >
                              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span style={{ ...mono, fontSize: '9px' }}>{copied ? 'ĐÃ CHÉP' : 'SAO CHÉP'}</span>
                            </button>
                          )}
                        </div>

                        <div
                          className="flex-1 overflow-y-auto p-3.5 rounded-xl"
                          style={{
                            background: 'rgba(0,5,15,0.6)',
                            border: '1px solid rgba(168,85,247,0.15)',
                            scrollbarWidth: 'thin',
                          }}
                        >
                          {selectedDoc.status === 'analyzing' ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                              <RefreshCw className="w-7 h-7 text-purple-400 animate-spin" />
                              <p style={{ ...raj, color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                                Đang đưa tài liệu qua mạng nơ-ron để phân tích...
                              </p>
                            </div>
                          ) : selectedDoc.analysis ? (
                            <div
                              style={{
                                ...raj,
                                color: 'rgba(235,235,255,0.95)',
                                fontSize: '13px',
                                lineHeight: '1.7',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {selectedDoc.analysis}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                              <Brain className="w-8 h-8 text-purple-400/40" />
                              <p style={{ ...raj, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                                Chưa có phân tích cho tài liệu này.
                              </p>
                              <p style={{ ...mono, color: 'rgba(168,85,247,0.6)', fontSize: '10px' }}>
                                Nhấn "TÓM TẮT" hoặc "PHÂN TÍCH CHUYÊN SÂU" ở trên để bắt đầu.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                    <Upload className="w-12 h-12 text-cyan-400/40" />
                    <h3 style={{ ...orb, color: '#00f5ff', fontSize: '16px' }}>CHỌN HOẶC TẢI LÊN TÀI LIỆU</h3>
                    <p style={{ ...raj, color: 'rgba(255,255,255,0.6)', fontSize: '13px', maxWidth: 400 }}>
                      Tải lên các tệp tài liệu để hệ thống CAT AI đọc hiểu, trích xuất dữ liệu và giải đáp mọi câu hỏi liên quan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
