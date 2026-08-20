import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, Image, FileText, Clock, TrendingUp, X, ExternalLink } from 'lucide-react';
import { sounds } from '../services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const raj = { fontFamily: 'Rajdhani, sans-serif' };

const MOCK_RESULTS: Record<string, { title: string; snippet: string; source: string; type: string }[]> = {
  default: [
    {
      title: 'Tài liệu hướng dẫn Hệ điều hành CAT v3.7',
      snippet: 'Sổ tay hướng dẫn toàn diện cho CAT AI OS: Lệnh giọng nói, nhận diện cử chỉ, tích hợp API OpenAI/Xkiro, quản lý bộ nhớ.',
      source: 'cat.ai/docs',
      type: 'tài liệu',
    },
    {
      title: 'Tiến bộ Điện toán Lượng tử 2026',
      snippet: 'Đột phá sửa lỗi lượng tử bằng qubit tô-pô. Các bộ xử lý lượng tử logic vượt mốc 1000 qubit.',
      source: 'khoahoc.tech/quantum',
      type: 'bài viết',
    },
    {
      title: 'Hiệu năng Mô hình Gwen 3.8 Max & Xkiro API',
      snippet: 'Kết quả đánh giá cho thấy mô hình xử lý lập trình, suy luận logic và hội thoại tiếng Việt với độ chính xác 99.2%.',
      source: 'xkiro.com/benchmark',
      type: 'báo cáo',
    },
    {
      title: 'Phát triển Giao diện Não - Máy tính Nơ-ron',
      snippet: 'Giao diện thần kinh đạt độ chính xác 95% trong chuyển đổi ý nghĩ thành văn bản qua cảm biến phi xâm lấn.',
      source: 'neuro.research.vn',
      type: 'nghiên cứu',
    },
  ],
  quantum: [
    {
      title: 'Đột phá Vướng víu Lượng tử Không gian',
      snippet: 'Các nhà khoa học đạt liên kết vướng víu lượng tử trên 1000km qua vệ tinh truyền tiếp. Mạng Internet lượng tử tiến gần hơn.',
      source: 'vatly.journal',
      type: 'nghiên cứu',
    },
    {
      title: 'Bộ xử lý Lượng tử IBM Eagle 433-qubit',
      snippet: 'Bộ xử lý đạt ưu thế lượng tử trong các bài toán tối ưu hóa phức tạp.',
      source: 'ibm.com/quantum',
      type: 'bài viết',
    },
  ],
  ai: [
    {
      title: 'Kiến trúc Mạng Nơ-ron Phân tán CAT AI',
      snippet: 'Cái nhìn chuyên sâu về thiết kế module của CAT. Khả năng suy luận phân tán trên 48 đơn vị xử lý thần kinh NPU.',
      source: 'cat.ai/blog',
      type: 'tài liệu',
    },
    {
      title: 'Xu hướng Trợ lý AI Holographic 2026',
      snippet: 'Tương tác không gian 3D, âm thanh phản hồi tức thì và điều khiển giọng nói thời gian thực.',
      source: 'aiinsider.vn',
      type: 'bài viết',
    },
  ],
};

const TRENDING = [
  'điện toán lượng tử',
  'mô hình Gwen 3.8 max',
  'giao diện holographic',
  'bảo mật mã hóa AES-256',
  'trợ lý giọng nói tiếng Việt',
];

const typeColors: Record<string, string> = {
  'tài liệu': '#00f5ff',
  'bài viết': '#a855f7',
  'báo cáo': '#f59e0b',
  'nghiên cứu': '#0ea5e9',
};

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof MOCK_RESULTS['default']>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'all' | 'images' | 'docs'>('all');
  const [history, setHistory] = useState(['quét hệ thống', 'mạng nơ-ron', 'api xkiro']);

  const search = (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    sounds.playClick();
    setLoading(true);
    setTimeout(() => {
      const key = Object.keys(MOCK_RESULTS).find(k => q.toLowerCase().includes(k));
      setResults(key ? MOCK_RESULTS[key] : MOCK_RESULTS.default);
      setHistory(h => [q, ...h.filter(x => x !== q)].slice(0, 5));
      setLoading(false);
      sounds.playSuccess();
    }, 600);
  };

  const handleSubmit = () => {
    if (query.trim()) search(query);
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" style={{ color: '#0ea5e9' }} />
          <span style={{ ...orb, color: '#0ea5e9', fontSize: '11px', letterSpacing: '0.15em' }}>
            TÌM KIẾM DỮ LIỆU
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 4px #22c55e' }} />
          <span style={{ ...mono, color: 'rgba(34,197,94,0.8)', fontSize: '9px' }}>KẾT NỐI NƠ-RON</span>
        </div>
      </div>

      {/* Search bar */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-shrink-0"
        style={{
          background: 'rgba(0,8,25,0.7)',
          border: '1px solid rgba(14,165,233,0.25)',
        }}
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(14,165,233,0.6)' }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Tìm kiếm luồng dữ liệu số..."
          className="flex-1 outline-none bg-transparent"
          style={{ ...raj, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}
        />
        {query && (
          <button
            onClick={() => {
              sounds.playClick();
              setQuery('');
              setResults([]);
            }}
            className="cursor-pointer"
          >
            <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSubmit}
          className="px-2.5 py-1.5 rounded-lg cursor-pointer"
          style={{ background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.4)' }}
        >
          <span style={{ ...mono, color: '#0ea5e9', fontSize: '10px' }}>TÌM</span>
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-shrink-0">
        {[
          { id: 'all', icon: Globe, label: 'TẤT CẢ' },
          { id: 'images', icon: Image, label: 'HÌNH ẢNH' },
          { id: 'docs', icon: FileText, label: 'TÀI LIỆU' },
        ].map(({ id, icon: Icon, label }) => (
          <motion.button
            key={id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              sounds.playClick();
              setTab(id as typeof tab);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer"
            style={{
              background: tab === id ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.04)',
              border: `1px solid ${tab === id ? 'rgba(14,165,233,0.4)' : 'rgba(14,165,233,0.12)'}`,
            }}
          >
            <Icon className="w-3 h-3" style={{ color: tab === id ? '#0ea5e9' : 'rgba(14,165,233,0.4)' }} />
            <span style={{ ...mono, color: tab === id ? '#0ea5e9' : 'rgba(14,165,233,0.4)', fontSize: '9px' }}>
              {label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(14,165,233,0.2) transparent' }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(0,8,25,0.5)', border: '1px solid rgba(14,165,233,0.1)' }}>
                  <div className="flex gap-2 mb-2">
                    <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-3 rounded" style={{ background: 'rgba(14,165,233,0.2)', width: '60%' }} />
                    <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="h-3 rounded" style={{ background: 'rgba(14,165,233,0.1)', width: '20%' }} />
                  </div>
                  <motion.div animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} className="h-2 rounded mb-1" style={{ background: 'rgba(14,165,233,0.15)', width: '90%' }} />
                  <motion.div animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.15 }} className="h-2 rounded" style={{ background: 'rgba(14,165,233,0.1)', width: '75%' }} />
                </div>
              ))}
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
              <span style={{ ...mono, color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>
                {results.length} KẾT QUẢ CHO "{query.toUpperCase()}"
              </span>
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => sounds.playClick()}
                  className="rounded-xl p-3 group cursor-pointer"
                  style={{
                    background: 'rgba(0,8,25,0.5)',
                    border: '1px solid rgba(14,165,233,0.1)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(14,165,233,0.06)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.1)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span style={{ ...raj, color: 'rgba(220,240,255,0.9)', fontSize: '13px' }}>{r.title}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          background: `${typeColors[r.type] || '#0ea5e9'}15`,
                          border: `1px solid ${typeColors[r.type] || '#0ea5e9'}30`,
                          ...mono,
                          color: typeColors[r.type] || '#0ea5e9',
                          fontSize: '8px',
                        }}
                      >
                        {r.type.toUpperCase()}
                      </span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#0ea5e9' }} />
                    </div>
                  </div>
                  <p style={{ ...raj, color: 'rgba(255,255,255,0.5)', fontSize: '11px', lineHeight: '1.5' }}>
                    {r.snippet}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Globe className="w-2.5 h-2.5" style={{ color: 'rgba(14,165,233,0.5)' }} />
                    <span style={{ ...mono, color: 'rgba(14,165,233,0.6)', fontSize: '9px' }}>{r.source}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
              {/* Trending */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3 h-3" style={{ color: 'rgba(14,165,233,0.6)' }} />
                  <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>XU HƯỚNG TÌM KIẾM</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map(t => (
                    <motion.button
                      key={t}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setQuery(t);
                        search(t);
                      }}
                      className="px-2.5 py-1.5 rounded-lg cursor-pointer"
                      style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}
                    >
                      <span style={{ ...mono, color: 'rgba(14,165,233,0.8)', fontSize: '10px' }}>{t}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* History */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>LỊCH SỬ TÌM KIẾM GẦN ĐÂY</span>
                </div>
                {history.map(h => (
                  <motion.button
                    key={h}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      setQuery(h);
                      search(h);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-left"
                    style={{ background: 'transparent' }}
                  >
                    <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <span style={{ ...raj, color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{h}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
