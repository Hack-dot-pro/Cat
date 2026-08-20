import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Globe, Music, FileText, Settings, Cpu, Brain, Camera, Terminal,
  BarChart3, Lock, Cloud, Wifi, Zap, Map, Code, Video, Mail, Phone,
  Calendar, Clock, Package, Database, Shield, Star, Wrench
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

const APPS = [
  // System
  { id: 'terminal', name: 'Dòng lệnh CAT', icon: Terminal, color: '#00f5ff', cat: 'Hệ thống' },
  { id: 'settings', name: 'Cài đặt AI', icon: Settings, color: '#64748b', cat: 'Hệ thống' },
  { id: 'monitor', name: 'Giám sát tài nguyên', icon: BarChart3, color: '#22c55e', cat: 'Hệ thống' },
  { id: 'security', name: 'Két bảo mật AES', icon: Lock, color: '#f59e0b', cat: 'Hệ thống' },
  { id: 'cloud', name: 'Đồng bộ Cloud', icon: Cloud, color: '#0ea5e9', cat: 'Hệ thống' },
  { id: 'network', name: 'Mạng nơ-ron', icon: Wifi, color: '#a855f7', cat: 'Hệ thống' },
  { id: 'storage', name: 'Bộ nhớ lưu trữ', icon: Database, color: '#00f5ff', cat: 'Hệ thống' },
  { id: 'firewall', name: 'Tường lửa', icon: Shield, color: '#ef4444', cat: 'Hệ thống' },

  // AI & Tools
  { id: 'cat', name: 'Lõi CAT AI', icon: Brain, color: '#a855f7', cat: 'AI' },
  { id: 'files', name: 'Hệ thống hóa Tài liệu', icon: FileText, color: '#f59e0b', cat: 'AI' },
  { id: 'mcp', name: 'Giao thức MCP Tools', icon: Wrench, color: '#22c55e', cat: 'AI' },
  { id: 'vision', name: 'Thị giác AI Vision', icon: Camera, color: '#ec4899', cat: 'AI' },
  { id: 'neural', name: 'Phòng thí nghiệm Nơ-ron', icon: Cpu, color: '#00f5ff', cat: 'AI' },
  { id: 'coder', name: 'Tổng hợp Code', icon: Code, color: '#22c55e', cat: 'AI' },

  // Media
  { id: 'music', name: 'Spotify Stream', icon: Music, color: '#1db954', cat: 'Đa phương tiện' },
  { id: 'video', name: 'HoloView', icon: Video, color: '#f59e0b', cat: 'Đa phương tiện' },
  { id: 'browser', name: 'Trình duyệt Holoweb', icon: Globe, color: '#00f5ff', cat: 'Đa phương tiện' },

  // Communications
  { id: 'mail', name: 'Comms Mail', icon: Mail, color: '#00f5ff', cat: 'Liên lạc' },
  { id: 'call', name: 'Holocall', icon: Phone, color: '#22c55e', cat: 'Liên lạc' },
  { id: 'maps', name: 'Bản đồ không gian', icon: Map, color: '#a855f7', cat: 'Liên lạc' },
  { id: 'packages', name: 'Quản lý Module', icon: Package, color: '#0ea5e9', cat: 'Liên lạc' },

  // Tools
  { id: 'calendar', name: 'Lịch biểu', icon: Calendar, color: '#ec4899', cat: 'Công cụ' },
  { id: 'clock', name: 'Đồng hồ ChronOS', icon: Clock, color: '#8b5cf6', cat: 'Công cụ' },
  { id: 'power', name: 'Quản lý Năng lượng', icon: Zap, color: '#f97316', cat: 'Công cụ' },
  { id: 'starred', name: 'Yêu thích', icon: Star, color: '#eab308', cat: 'Công cụ' },
];

const CATEGORIES = ['Tất cả', 'Hệ thống', 'AI', 'Đa phương tiện', 'Liên lạc', 'Công cụ'];

export function AppGrid() {
  const { appGridOpen, setAppGridOpen, setSettingsOpen, setFilesOpen, setMcpOpen, setRightPanel, addNotification } = useApp();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  const filtered = APPS.filter(a => activeCategory === 'Tất cả' || a.cat === activeCategory);

  const handleAppClick = (app: typeof APPS[0]) => {
    sounds.playClick();
    if (app.id === 'settings') {
      setSettingsOpen(true);
      setAppGridOpen(false);
    } else if (app.id === 'files') {
      setFilesOpen(true);
      setAppGridOpen(false);
    } else if (app.id === 'mcp') {
      setMcpOpen(true);
      setAppGridOpen(false);
    } else if (app.id === 'terminal') {
      setRightPanel('console');
      setAppGridOpen(false);
    } else {
      addNotification({ type: 'info', title: `Đã mở ${app.name}`, message: `${app.name} đang được khởi tạo...` });
      setAppGridOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {appGridOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 flex flex-col p-6"
          style={{ zIndex: 150, background: 'rgba(0, 4, 12, 0.95)', backdropFilter: 'blur(20px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between max-w-5xl mx-auto w-full mb-6">
            <div>
              <h2 style={{ ...orb, color: '#00f5ff', fontSize: '18px', letterSpacing: '0.2em' }}>
                HỆ THỐNG ỨNG DỤNG CAT AI
              </h2>
              <p style={{ ...mono, color: 'rgba(0,245,255,0.5)', fontSize: '11px', marginTop: 4 }}>
                DANH MỤC ỨNG DỤNG VÀ MODULE ĐIỀU HÀNH
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                sounds.playClick();
                setAppGridOpen(false);
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <X className="w-5 h-5" style={{ color: '#ef4444' }} />
            </motion.button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 max-w-5xl mx-auto w-full mb-6 flex-wrap">
            {CATEGORIES.map(cat => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  sounds.playClick();
                  setActiveCategory(cat);
                }}
                className="px-4 py-2 rounded-xl cursor-pointer transition-all"
                style={{
                  background: activeCategory === cat ? 'rgba(0,245,255,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeCategory === cat ? '#00f5ff' : 'rgba(255,255,255,0.08)'}`,
                  ...mono,
                  color: activeCategory === cat ? '#00f5ff' : 'rgba(255,255,255,0.5)',
                  fontSize: '11px',
                }}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* Apps Grid */}
          <div className="flex-1 overflow-y-auto max-w-5xl mx-auto w-full pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {filtered.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.85, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAppClick(app)}
                  onMouseEnter={() => {
                    sounds.playHover();
                    setHoveredApp(app.id);
                  }}
                  onMouseLeave={() => setHoveredApp(null)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer text-center relative group"
                  style={{
                    background: 'rgba(0, 10, 25, 0.7)',
                    border: `1px solid ${hoveredApp === app.id ? app.color : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: hoveredApp === app.id ? `0 0 20px ${app.color}30` : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5"
                    style={{
                      background: `radial-gradient(circle, ${app.color}20 0%, transparent 80%)`,
                      border: `1px solid ${app.color}40`,
                    }}
                  >
                    <app.icon className="w-6 h-6" style={{ color: app.color }} />
                  </div>
                  <span style={{ ...aptos, color: '#fff', fontSize: '13px', fontWeight: 600 }} className="line-clamp-1">
                    {app.name}
                  </span>
                  <span style={{ ...mono, color: 'rgba(255,255,255,0.35)', fontSize: '9px', marginTop: 2 }}>
                    {app.cat}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
