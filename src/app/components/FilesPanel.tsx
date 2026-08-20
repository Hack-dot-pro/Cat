import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Upload, FileText, FileCode, FileSpreadsheet,
  Layers, Database, Sparkles, CheckCircle, Clock, Trash2,
  Send, Eye, RefreshCw, Cpu
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';
import { openAIService } from '../services/openai';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: Date;
  status: 'ready' | 'analyzing' | 'systematized' | 'error';
  analysisResult?: string;
}

export function FilesPanel() {
  const {
    filesOpen,
    setFilesOpen,
    uploadedFiles,
    setUploadedFiles,
    addMessage,
    setAiState,
    addNotification,
  } = useApp();

  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzingMode, setAnalyzingMode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDoc = uploadedFiles.find(f => f.id === activeFileId) || uploadedFiles[0] || null;

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    sounds.playClick();

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const content = (e.target?.result as string) || '';
        const newDoc: UploadedDocument = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || file.name.split('.').pop() || 'text/plain',
          content,
          uploadedAt: new Date(),
          status: 'ready',
        };

        setUploadedFiles(prev => [newDoc, ...prev]);
        setActiveFileId(newDoc.id);
        sounds.playSuccess();
        addNotification({
          type: 'success',
          title: 'Tải tài liệu thành công',
          message: `Đã nạp file "${file.name}" (${(file.size / 1024).toFixed(1)} KB) vào bộ nhớ Thư Ký Kim.`,
        });
      };

      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.ts') || file.name.endsWith('.js') || file.name.endsWith('.py') || file.name.endsWith('.csv') || file.name.endsWith('.html') || file.name.endsWith('.css')) {
        reader.readAsText(file);
      } else {
        reader.readAsText(file); // Text fallback
      }
    });
  };

  const handleSystematize = async (mode: 'structure' | 'extract' | 'summary') => {
    if (!activeDoc) return;
    sounds.playScan();
    setAnalyzingMode(mode);
    setAiState('processing');

    const modeLabels: Record<string, string> = {
      structure: 'HỆ THỐNG HÓA CẤU TRÚC VÀ PHÂN CẤP ĐỀ MỤC',
      extract: 'TRÍCH XUẤT THÔNG SỐ VÀ DỮ LIỆU CỐT LÕI',
      summary: 'TỔNG HỢP VÀ TÓM TẮT ĐIỀU HÀNH CHUYÊN SÂU',
    };

    const promptInstructions: Record<string, string> = {
      structure: `Hãy hệ thống hóa toàn diện cấu trúc của tài liệu "${activeDoc.name}". Yêu cầu:
1. Tạo bảng mục lục phân cấp logic (Heading 1, 2, 3).
2. Tóm tắt nội dung chính từng phần theo dạng bảng hoặc danh sách gạch đầu dòng.
3. Chỉ ra mối liên hệ và luồng logic giữa các khối thông tin.`,
      extract: `Hãy trích xuất toàn bộ dữ liệu quan trọng nhất từ tài liệu "${activeDoc.name}". Yêu cầu:
1. Danh sách các thông số kỹ thuật, số liệu định lượng, chỉ số KPI.
2. Các thực thể chính (con người, tổ chức, công nghệ, mốc thời gian).
3. Danh sách các việc cần làm (Action Items) và khuyến nghị thực thi.`,
      summary: `Hãy viết một bản tóm tắt điều hành cấp cao (Executive Summary) cho tài liệu "${activeDoc.name}". Yêu cầu:
1. Mục tiêu và bối cảnh chính của tài liệu.
2. 3-5 điểm phát hiện cốt lõi (Key Takeaways).
3. Kết luận và định hướng tiếp theo.`,
    };

    try {
      const response = await openAIService.chatCompletion({
        messages: [
          {
            role: 'user',
            content: `${promptInstructions[mode]}\n\n--- NỘI DUNG TÀI LIỆU (${activeDoc.name}) ---\n${activeDoc.content.slice(0, 16000)}`,
          },
        ],
      });

      setUploadedFiles(prev =>
        prev.map(f => (f.id === activeDoc.id ? { ...f, status: 'systematized', analysisResult: response } : f))
      );

      sounds.playSuccess();
      setAiState('idle');
      addNotification({
        type: 'success',
        title: 'Hệ thống hóa hoàn tất',
        message: `${modeLabels[mode]} đã được hoàn thành bởi Thư Ký Kim.`,
      });
    } catch (err: any) {
      sounds.playError();
      setAiState('idle');
      addNotification({
        type: 'error',
        title: 'Lỗi hệ thống hóa',
        message: err.message || 'Không thể xử lý tài liệu.',
      });
    } finally {
      setAnalyzingMode(null);
    }
  };

  const handleSendToChat = () => {
    if (!activeDoc) return;
    sounds.playClick();
    addMessage({
      type: 'user',
      text: `Đã nạp tài liệu [${activeDoc.name}]. Thư Ký Kim hãy hỗ trợ anh phân tích và giải đáp nhé!`,
    });
    addMessage({
      type: 'ai',
      text: `Dạ sếp! Em đã tiếp nhận tài liệu **${activeDoc.name}** (${(activeDoc.size / 1024).toFixed(1)} KB, ~${Math.ceil(activeDoc.content.length / 3.5)} tokens). Sếp cứ hỏi bất kỳ thông tin nào cần bóc tách nhé ạ!`,
    });
    setFilesOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) setActiveFileId(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['json', 'ts', 'js', 'py', 'html', 'css'].includes(ext || '')) return FileCode;
    if (['csv', 'xlsx', 'xls'].includes(ext || '')) return FileSpreadsheet;
    return FileText;
  };

  return (
    <AnimatePresence>
      {filesOpen && (
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
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0,245,255,0.15)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)' }}
                >
                  <Database className="w-5 h-5" style={{ color: '#00f5ff' }} />
                </div>
                <div>
                  <h2 style={{ ...orb, color: '#00f5ff', fontSize: '15px', letterSpacing: '0.15em', margin: 0 }}>
                    TRUNG TÂM HỆ THỐNG HÓA TÀI LIỆU & DỮ LIỆU
                  </h2>
                  <p style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '10px', marginTop: 2 }}>
                    THƯ KÝ KIM NEURAL DOCUMENT SYSTEMIZER — V2.4
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => handleFileUpload(e.target.files)}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl cursor-pointer"
                  style={{
                    background: 'rgba(0,245,255,0.15)',
                    border: '1px solid rgba(0,245,255,0.4)',
                    boxShadow: '0 0 15px rgba(0,245,255,0.15)',
                  }}
                >
                  <Upload className="w-3.5 h-3.5" style={{ color: '#00f5ff' }} />
                  <span style={{ ...mono, color: '#00f5ff', fontSize: '10px' }}>TẢI FILE MỚI</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    sounds.playClick();
                    setFilesOpen(false);
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                </motion.button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden" style={{ minHeight: 480 }}>
              {/* Left Column: File List & Drag Drop */}
              <div
                className="w-72 flex flex-col gap-2 p-4 flex-shrink-0"
                style={{ borderRight: '1px solid rgba(0,245,255,0.1)' }}
              >
                {/* Drop Zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center"
                  style={{
                    background: dragOver ? 'rgba(0,245,255,0.15)' : 'rgba(0,245,255,0.03)',
                    border: `1.5px dashed ${dragOver ? '#00f5ff' : 'rgba(0,245,255,0.25)'}`,
                  }}
                >
                  <Upload className="w-6 h-6" style={{ color: '#00f5ff' }} />
                  <span style={{ ...aptos, color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                    Kéo thả tài liệu vào đây hoặc nhấn để chọn
                  </span>
                  <span style={{ ...mono, color: 'rgba(0,245,255,0.4)', fontSize: '8px' }}>
                    PDF, DOCX, TXT, JSON, CSV, MD, CODE
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 px-1">
                  <span style={{ ...mono, color: 'rgba(0,245,255,0.6)', fontSize: '10px' }}>
                    DANH SÁCH FILE ({uploadedFiles.length})
                  </span>
                </div>

                {/* File List Items */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {uploadedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                      <FileText className="w-8 h-8 mb-2" />
                      <span style={{ ...aptos, fontSize: '12px' }}>Chưa có tài liệu nào</span>
                    </div>
                  ) : (
                    uploadedFiles.map(file => {
                      const Icon = getFileIcon(file.name);
                      const isSelected = activeDoc?.id === file.id;

                      return (
                        <motion.div
                          key={file.id}
                          whileHover={{ x: 2 }}
                          onClick={() => {
                            sounds.playClick();
                            setActiveFileId(file.id);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all"
                          style={{
                            background: isSelected ? 'rgba(0,245,255,0.12)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isSelected ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? '#00f5ff' : 'rgba(255,255,255,0.4)' }} />
                            <div className="flex flex-col min-w-0">
                              <span style={{ ...aptos, color: isSelected ? '#00f5ff' : 'rgba(255,255,255,0.85)', fontSize: '12px' }} className="truncate">
                                {file.name}
                              </span>
                              <span style={{ ...mono, color: 'rgba(255,255,255,0.35)', fontSize: '8px' }}>
                                {formatFileSize(file.size)} • ~{Math.ceil(file.content.length / 3.5)} tokens
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={e => handleDelete(file.id, e)}
                            className="p-1 rounded opacity-40 hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Document Details & AI Actions */}
              <div className="flex-1 flex flex-col p-6 overflow-y-auto gap-4">
                {activeDoc ? (
                  <>
                    {/* Document Info Header */}
                    <div
                      className="p-4 rounded-xl flex items-center justify-between"
                      style={{ background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.15)' }}
                    >
                      <div className="flex flex-col">
                        <span style={{ ...orb, color: '#00f5ff', fontSize: '14px' }}>
                          {activeDoc.name}
                        </span>
                        <div className="flex items-center gap-4 mt-1">
                          <span style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                            Dung lượng: {formatFileSize(activeDoc.size)}
                          </span>
                          <span style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                            Số ký tự: {activeDoc.content.length.toLocaleString()}
                          </span>
                          <span style={{ ...mono, color: 'rgba(0,245,255,0.8)', fontSize: '10px' }}>
                            Ước tính Tokens: ~{Math.ceil(activeDoc.content.length / 3.5).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendToChat}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-pointer"
                        style={{
                          background: 'rgba(168,85,247,0.2)',
                          border: '1px solid rgba(168,85,247,0.4)',
                        }}
                      >
                        <Send className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />
                        <span style={{ ...mono, color: '#a855f7', fontSize: '10px' }}>ĐƯA VÀO CHAT</span>
                      </motion.button>
                    </div>

                    {/* AI Systematization Buttons */}
                    <div className="flex flex-col gap-2">
                      <span style={{ ...mono, color: 'rgba(0,245,255,0.7)', fontSize: '10px', letterSpacing: '0.1em' }}>
                        CÁC TÁC VỤ HỆ THỐNG HÓA AI:
                      </span>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            id: 'structure',
                            label: 'HỆ THỐNG HÓA CẤU TRÚC',
                            desc: 'Phân cấp đề mục, bảng logic & quan hệ',
                            icon: Layers,
                            color: '#00f5ff',
                          },
                          {
                            id: 'extract',
                            label: 'TRÍCH XUẤT THÔNG SỐ',
                            desc: 'Lọc số liệu, bảng biểu & việc cần làm',
                            icon: Cpu,
                            color: '#a855f7',
                          },
                          {
                            id: 'summary',
                            label: 'TÓM TẮT ĐIỀU HÀNH',
                            desc: 'Tổng hợp phân tích cấp cao 3-5 điểm cốt lõi',
                            icon: Sparkles,
                            color: '#22c55e',
                          },
                        ].map(btn => (
                          <motion.button
                            key={btn.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={analyzingMode !== null}
                            onClick={() => handleSystematize(btn.id as any)}
                            className="p-3.5 rounded-xl flex flex-col items-start gap-1.5 cursor-pointer text-left transition-all"
                            style={{
                              background: analyzingMode === btn.id ? `${btn.color}25` : `${btn.color}08`,
                              border: `1px solid ${analyzingMode === btn.id ? btn.color : `${btn.color}30`}`,
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <btn.icon className="w-4 h-4" style={{ color: btn.color }} />
                              {analyzingMode === btn.id && (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: btn.color }} />
                              )}
                            </div>
                            <span style={{ ...mono, color: btn.color, fontSize: '10px', fontWeight: 600 }}>
                              {btn.label}
                            </span>
                            <span style={{ ...aptos, color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                              {btn.desc}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Result or Preview */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                      <div className="flex items-center justify-between">
                        <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
                          {activeDoc.analysisResult ? 'KẾT QUẢ HỆ THỐNG HÓA AI:' : 'XEM TRƯỚC VĂN BẢN GỐC:'}
                        </span>
                      </div>
                      <div
                        className="flex-1 rounded-xl p-4 overflow-y-auto whitespace-pre-wrap select-text"
                        style={{
                          background: 'rgba(0,5,15,0.7)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          ...aptos,
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: '13px',
                          lineHeight: '1.6',
                          maxHeight: 280,
                        }}
                      >
                        {activeDoc.analysisResult || activeDoc.content || '(File trống)'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-40 gap-3">
                    <FileText className="w-16 h-16" />
                    <span style={{ ...aptos, fontSize: '14px' }}>Chọn hoặc tải lên một tài liệu để hệ thống hóa</span>
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
