import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Globe, Music, FileText, Settings, Cpu, Brain, Camera, Terminal,
  BarChart3, Lock, Cloud, Wifi, Zap, Map, Code, Video, Mail, Phone,
  Calendar, Clock, Package, Database, Shield, Star
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const raj = { fontFamily: 'Rajdhani, sans-serif' };

const APPS = [
  // System
  { id: 'terminal', name: 'Dòng lệnh', icon: Terminal, color: '#00f5ff', cat: 'Hệ thống' },
  { id: 'settings', name: 'Cài đặt', icon: Settings, color: '#0ea5e9', cat: 'Hệ thống' },
  { id: 'monitor', name: 'Giám sát', icon: Cpu, color: '#22c55e', cat: 'Hệ thống' },
  { id: 'security', name: 'Bảo mật', icon: Shield, color: '#ef4444', cat: 'Hệ thống' },
  { id: 'storage', name: 'Lưu trữ', icon: Database, color: '#f59e0b', cat: 'Hệ thống' },
  { id: 'network', name: 'Mạng lưới', icon: Wifi, color: '#8b5cf6', cat: 'Hệ thống' },
  // AI
  { id: 'cat', name: 'Lõi AI CAT', icon: Brain, color: '#a855f7', cat: 'Trí tuệ AI' },
  { id: 'vision', name: 'Thị giác AI', icon: Camera, color: '#ec4899', cat: 'Trí tuệ AI' },
  { id: 'analyze', name: 'Bộ phân tích', icon: BarChart3, color: '#06b6d4', cat: 'Trí tuệ AI' },
  { id: 'code', name: 'Lập trình AI', icon: Code, color: '#10b981', cat: 'Trí tuệ AI' },
  { id: 'memory', name: 'Bộ nhớ tri thức', icon: Package, color: '#f97316', cat: 'Trí tuệ AI' },
  { id: 'encrypt', name: 'Kho bảo mật', icon: Lock, color: '#6366f1', cat: 'Trí tuệ AI' },
  // Media
  { id: 'browser', name: 'Trình duyệt Hologram', icon: Globe, color: '#0ea5e9', cat: 'Đa phương tiện' },
  { id: 'music', name: 'Âm nhạc', icon: Music, color: '#22c55e', cat: 'Đa phương tiện' },
  { id: 'video', name: 'Video 3D', icon: Video, color: '#f59e0b', cat: 'Đa phương tiện' },
  { id: 'maps', name: 'Bản đồ', icon: Map, color: '#06b6d4', cat: 'Đa phương tiện' },
  // Comms
  { id: 'mail', name: 'Hộp thư', icon: Mail, color: '#a855f7', cat: 'Truyền thông' },
  { id: 'call', name: 'Liên lạc', icon: Phone, color: '#22c55e', cat: 'Truyền thông' },
  { id: 'cloud', name: 'Đồng bộ mây', icon: Cloud, color: '#0ea5e9', cat: 'Truyền thông' },
  { id: 'files', name: 'Quản lý tệp', icon: FileText, color: '#f59e0b', cat: 'Truyền thông' },
  // Tools
  { id: 'calendar', name: 'Lịch trình', icon: Calendar, color: '#ec4899', cat: 'Công cụ' },
  { id: 'clock', name: 'Đồng hồ', icon: Clock, color: '#8b5cf6', cat: 'Công cụ' },
  { id: 'power', name: 'Năng lượng', icon: Zap, color: '#f97316', cat: 'Công cụ' },
  { id: 'starred', name: 'Yêu thích', icon: Star, color: '#eab308', cat: 'Công cụ' },
];

const CATEGORIES = ['Tất cả', 'Hệ thống', 'Trí tuệ AI', 'Đa phương tiện', 'Truyền thông', 'Công cụ'];

export function AppGrid() {
  const { appGridOpen, setAppGridOpen, setSettingsOpen, setFilesOpen, addNotification } = useApp();
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
    } else {
      addNotification({
        type: 'info',
        title: `Đã khởi chạy ${app.name}`,
        message: `Ứng dụng ${app.name} đang được khởi tạo...`,
      });
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
          className="fixed inset-0 flex flex-col"
          style={{ zIndex: 150, background: 'rgba(0, 4, 12, 0.95)', backdropFilter: 'blur(20px)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-10 py-5 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(0,245,255,0.1)' }}
          >
            <div>
              <h2 style={{ ...orb, color: '#00f5ff', fontSize: '18px', letterSpacing: '0.2em', margin: 0, textShadow: '0 0 20px rgba(0,245,255,0.5)' }}>
                LƯỚI ỨNG DỤNG HỆ THỐNG
              </h2>
              <p style={{ ...mono, color: 'rgba(0,245,255,0.4)', fontSize: '10px', marginTop: 4 }}>
                {APPS.length} ỨNG DỤNG KHẢ DỤNG
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

          {/* Category tabs */}
          <div className="flex gap-2 px-10 py-4 flex-shrink-0">
            {CATEGORIES.map(cat => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  sounds.playClick();
                  setActiveCategory(cat);
                }}
                className="px-4 py-2 rounded-xl cursor-pointer"
                style={{
                  background: activeCategory === cat ? 'rgba(0,245,255,0.12)' : 'rgba(0,245,255,0.03)',
                  border: `1px solid ${activeCategory === cat ? 'rgba(0,245,255,0.4)' : 'rgba(0,245,255,0.1)'}`,
                  boxShadow: activeCategory === cat ? '0 0 12px rgba(0,245,255,0.1)' : 'none',
                }}
              >
                <span style={{ ...mono, color: activeCategory === cat ? '#00f5ff' : 'rgba(0,245,255,0.4)', fontSize: '11px' }}>
                  {cat.toUpperCase()}
                </span>
              </motion.button>
            ))}
          </div>

          {/* App grid */}
          <div className="flex-1 overflow-y-auto px-10 pb-10">
            <motion.div
              layout
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((app, i) => (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAppClick(app)}
                    onMouseEnter={() => setHoveredApp(app.id)}
                    onMouseLeave={() => setHoveredApp(null)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer"
                    style={{
                      background: hoveredApp === app.id ? `${app.color}15` : 'rgba(0,8,25,0.6)',
                      border: `1px solid ${hoveredApp === app.id ? `${app.color}50` : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: hoveredApp === app.id ? `0 0 20px ${app.color}25` : 'none',
                      transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-2.5"
                      style={{
                        background: `${app.color}15`,
                        border: `1px solid ${app.color}30`,
                        boxShadow: `0 0 12px ${app.color}20`,
                      }}
                    >
                      <app.icon className="w-6 h-6" style={{ color: app.color }} />
                    </div>
                    <span style={{ ...raj, color: 'rgba(255,255,255,0.85)', fontSize: '13px', textAlign: 'center' }}>
                      {app.name}
                    </span>
                    <span style={{ ...mono, color: 'rgba(255,255,255,0.3)', fontSize: '9px', marginTop: 2 }}>
                      {app.cat}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
