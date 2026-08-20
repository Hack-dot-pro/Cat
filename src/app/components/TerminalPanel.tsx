import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Terminal, Play, Trash2, Download, Package, Search,
  RefreshCw, CheckCircle, AlertCircle, Cpu, ExternalLink,
  Layers, ArrowUpRight, Copy, Check, Filter, Sparkles, Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';
import { terminalService, InstalledPackage, TerminalOutputLine } from '../services/terminal';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

const QUICK_INSTALL_PRESETS = [
  { name: 'axios', manager: 'npm' as const, desc: 'HTTP client for browser & node' },
  { name: 'three', manager: 'npm' as const, desc: '3D WebGL graphics library' },
  { name: 'lodash', manager: 'npm' as const, desc: 'Utility library for JS' },
  { name: 'chart.js', manager: 'npm' as const, desc: 'HTML5 charts' },
  { name: 'requests', manager: 'pip' as const, desc: 'Python HTTP library' },
  { name: 'pandas', manager: 'pip' as const, desc: 'Data analysis and manipulation' },
  { name: 'numpy', manager: 'pip' as const, desc: 'Fundamental package for scientific computing' },
  { name: 'fastapi', manager: 'pip' as const, desc: 'Modern high-performance web framework' },
];

export function TerminalPanel() {
  const { terminalOpen, setTerminalOpen, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'shell' | 'packages' | 'search' | 'quick'>('shell');
  const [logs, setLogs] = useState<TerminalOutputLine[]>(() => terminalService.getLogs());
  const [packages, setPackages] = useState<InstalledPackage[]>(() => terminalService.getInstalledPackages());
  const [inputCmd, setInputCmd] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRegistry, setSearchRegistry] = useState<'npm' | 'pip'>('npm');

  // Quick install custom package state
  const [customPkgName, setCustomPkgName] = useState('');
  const [customPkgManager, setCustomPkgManager] = useState<'npm' | 'pip' | 'cdn' | 'git'>('npm');
  const [customPkgVersion, setCustomPkgVersion] = useState('latest');
  const [isInstalling, setIsInstalling] = useState(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return terminalService.subscribe(() => {
      setLogs(terminalService.getLogs());
      setPackages(terminalService.getInstalledPackages());
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'shell') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  useEffect(() => {
    if (terminalOpen && activeTab === 'shell') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [terminalOpen, activeTab]);

  const handleRunCommand = async (cmdToRun?: string) => {
    const raw = cmdToRun || inputCmd;
    if (!raw.trim() || isExecuting) return;

    sounds.playClick();
    setInputCmd('');
    setIsExecuting(true);

    try {
      await terminalService.executeCommand(raw);
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleQuickInstall = async (pkgName: string, manager: 'npm' | 'pip' | 'cdn' | 'git' = 'npm') => {
    sounds.playScan();
    setIsInstalling(true);
    const res = await terminalService.installPackage(pkgName, manager, 'latest');
    setIsInstalling(false);

    if (res.success) {
      sounds.playSuccess();
      addNotification({
        type: 'success',
        title: 'Cài đặt thư viện thành công',
        message: res.message,
      });
    } else {
      sounds.playError();
      addNotification({
        type: 'error',
        title: 'Cài đặt thất bại',
        message: res.message,
      });
    }
  };

  const handleSearchRegistry = async () => {
    if (!searchQuery.trim() || isSearching) return;
    sounds.playScan();
    setIsSearching(true);
    setSearchResults([]);

    if (searchRegistry === 'npm') {
      const res = await terminalService.searchNpmPackage(searchQuery);
      setSearchResults(res || []);
    } else {
      const res = await terminalService.searchPypiPackage(searchQuery);
      setSearchResults(res ? [res] : []);
    }
    setIsSearching(false);
  };

  const handleCopyLogs = () => {
    const allText = logs.map(l => `[${l.timestamp}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(allText);
    sounds.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogColor = (type: TerminalOutputLine['type']) => {
    switch (type) {
      case 'stdin':
        return '#00f5ff';
      case 'stderr':
        return '#f87171';
      case 'success':
        return '#4ade80';
      case 'warning':
        return '#fbbf24';
      case 'pkg_log':
        return '#c084fc';
      case 'info':
        return '#38bdf8';
      default:
        return 'rgba(255,255,255,0.85)';
    }
  };

  return (
    <AnimatePresence>
      {terminalOpen && (
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
              height: '88vh',
              maxHeight: '92vh',
              background: 'rgba(1, 8, 20, 0.98)',
              border: '1px solid rgba(0,245,255,0.3)',
              boxShadow: '0 0 50px rgba(0,245,255,0.15), inset 0 0 30px rgba(0,0,0,0.8)',
            }}
          >
            {/* Window Titlebar */}
            <div
              className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
              style={{
                background: 'rgba(0, 15, 35, 0.85)',
                borderBottom: '1px solid rgba(0,245,255,0.15)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer" onClick={() => setTerminalOpen(false)} />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80 cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80 cursor-pointer" />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span style={{ ...orb, color: '#00f5ff', fontSize: '13px', letterSpacing: '0.15em' }}>
                    THƯ KÝ KIM — HOLOGRAPHIC TERMINAL & PACKAGE MANAGER
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
                {[
                  { id: 'shell', label: 'CLI Shell', icon: Terminal },
                  { id: 'packages', label: `Đã cài (${packages.length})`, icon: Package },
                  { id: 'search', label: 'Kho thư viện', icon: Search },
                  { id: 'quick', label: 'Cài đặt nhanh', icon: Download },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      sounds.playClick();
                      setActiveTab(t.id as any);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      activeTab === t.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  sounds.playClick();
                  setTerminalOpen(false);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-gray-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Quick Actions Bar */}
            <div
              className="flex items-center justify-between px-6 py-2 flex-shrink-0 overflow-x-auto gap-2"
              style={{ background: 'rgba(0, 5, 15, 0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 text-xs">
                <span style={{ ...mono, color: 'rgba(0,245,255,0.7)', fontSize: '10px' }}>LỆNH NHANH:</span>
                {['pkg list', 'npm i axios', 'pip install pandas', 'sysinfo', 'clear'].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => handleRunCommand(cmd)}
                    className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 text-white/70 hover:text-cyan-300 font-mono text-[11px] cursor-pointer transition-all"
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-mono text-[11px] cursor-pointer"
                  title="Sao chép toàn bộ logs"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>
                <button
                  onClick={() => terminalService.clearLogs()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 font-mono text-[11px] cursor-pointer"
                  title="Xóa màn hình"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>

            {/* TAB 1: CLI INTERACTIVE SHELL */}
            {activeTab === 'shell' && (
              <div className="flex-1 flex flex-col min-h-0 bg-black/60">
                {/* Log Screen */}
                <div
                  className="flex-1 overflow-y-auto p-5 font-mono text-xs space-y-1.5 select-text"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0,245,255,0.2) transparent',
                  }}
                >
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="text-white/20 select-none text-[10px] flex-shrink-0 mt-0.5">
                        {log.timestamp}
                      </span>
                      <span
                        className="whitespace-pre-wrap break-all flex-1"
                        style={{ color: getLogColor(log.type) }}
                      >
                        {log.text}
                      </span>
                    </div>
                  ))}
                  {isExecuting && (
                    <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Thư Ký Kim đang thực thi lệnh...</span>
                    </div>
                  )}
                  <div ref={logsEndRef} />
                </div>

                {/* Command Input Prompt */}
                <div
                  className="flex items-center gap-3 px-6 py-3.5 flex-shrink-0"
                  style={{
                    background: 'rgba(0, 10, 25, 0.95)',
                    borderTop: '1px solid rgba(0,245,255,0.2)',
                  }}
                >
                  <span style={{ ...mono, color: '#00f5ff', fontSize: '13px', fontWeight: 700 }}>
                    vinh@thu-ky-kim:~$
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputCmd}
                    onChange={e => setInputCmd(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRunCommand();
                    }}
                    placeholder="Nhập lệnh (vd: npm i axios, pip install requests, git clone, pkg list, help)..."
                    className="flex-1 bg-transparent outline-none font-mono text-sm text-white caret-cyan-400"
                    disabled={isExecuting}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRunCommand()}
                    disabled={!inputCmd.trim() || isExecuting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs cursor-pointer disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>CHẠY</span>
                  </motion.button>
                </div>
              </div>
            )}

            {/* TAB 2: INSTALLED PACKAGES */}
            {activeTab === 'packages' && (
              <div className="flex-1 overflow-y-auto p-6 bg-black/40" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,245,255,0.2) transparent' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 style={{ ...orb, color: '#00f5ff', fontSize: '14px', margin: 0 }}>
                      DANH SÁCH THƯ VIỆN & MODULE ĐÃ CÀI ĐẶT
                    </h3>
                    <p style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: 2 }}>
                      Tổng cộng {packages.length} gói thư viện đang kích hoạt trong runtime
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('quick')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>CÀI THƯ VIỆN MỚI</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {packages.map(pkg => (
                    <div
                      key={pkg.id}
                      className="p-4 rounded-xl flex flex-col justify-between gap-3"
                      style={{
                        background: 'rgba(0, 245, 255, 0.03)',
                        border: '1px solid rgba(0, 245, 255, 0.15)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            pkg.manager === 'pip' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {pkg.manager}
                          </span>
                          <span style={{ ...orb, color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                            {pkg.name}
                          </span>
                          <span style={{ ...mono, color: '#00f5ff', fontSize: '11px' }}>
                            {pkg.version}
                          </span>
                        </div>
                        <span className="text-white/30 text-[10px] font-mono">
                          {pkg.sizeKb} KB
                        </span>
                      </div>

                      {pkg.description && (
                        <p style={{ ...aptos, color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>
                          {pkg.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                        <span style={{ ...mono, color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                          Cài đặt: {pkg.installedAt}
                        </span>
                        <div className="flex items-center gap-2">
                          {pkg.homepage && (
                            <a
                              href={pkg.homepage}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-cyan-400/70 hover:text-cyan-300 cursor-pointer"
                              title="Trang chủ thư viện"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              sounds.playClick();
                              terminalService.uninstallPackage(pkg.name, pkg.manager);
                              addNotification({
                                type: 'info',
                                title: 'Đã gỡ thư viện',
                                message: `Đã gỡ "${pkg.name}" khỏi hệ thống.`,
                              });
                            }}
                            className="p-1 text-red-400/60 hover:text-red-400 cursor-pointer"
                            title="Gỡ cài đặt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: SEARCH REGISTRY */}
            {activeTab === 'search' && (
              <div className="flex-1 overflow-y-auto p-6 bg-black/40 flex flex-col gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,245,255,0.2) transparent' }}>
                <div>
                  <h3 style={{ ...orb, color: '#00f5ff', fontSize: '14px', margin: 0 }}>
                    TRA CỨU & KHÁM PHÁ THƯ VIỆN (NPM & PYPI)
                  </h3>
                  <p style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: 2 }}>
                    Tìm kiếm hàng triệu gói thư viện trực tiếp từ kho mã nguồn mở
                  </p>
                </div>

                {/* Search Bar */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 border border-white/15 flex-1">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearchRegistry()}
                      placeholder="Nhập tên thư viện (vd: axios, three, pandas, express, tailwindcss)..."
                      className="flex-1 bg-transparent outline-none text-white text-sm"
                    />
                  </div>
                  <div className="flex items-center bg-black/60 rounded-xl p-1 border border-white/15">
                    <button
                      onClick={() => setSearchRegistry('npm')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${
                        searchRegistry === 'npm' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400'
                      }`}
                    >
                      NPM
                    </button>
                    <button
                      onClick={() => setSearchRegistry('pip')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${
                        searchRegistry === 'pip' ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400'
                      }`}
                    >
                      PyPI
                    </button>
                  </div>
                  <button
                    onClick={handleSearchRegistry}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs cursor-pointer disabled:opacity-40"
                  >
                    {isSearching ? 'ĐANG TÌM...' : 'TÌM KIẾM'}
                  </button>
                </div>

                {/* Search Results */}
                <div className="flex flex-col gap-3">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span style={{ ...orb, color: '#00f5ff', fontSize: '13px' }}>
                            {item.name}
                          </span>
                          <span style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                            v{item.version}
                          </span>
                        </div>
                        <p style={{ ...aptos, color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>
                          {item.description || item.summary || 'Không có mô tả'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleQuickInstall(item.name, searchRegistry)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 font-mono text-xs cursor-pointer flex-shrink-0 hover:bg-green-500/30"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CÀI ĐẶT NGAY</span>
                      </button>
                    </div>
                  ))}

                  {searchResults.length === 0 && !isSearching && (
                    <div className="p-8 text-center text-white/30 font-mono text-xs">
                      Nhập tên thư viện và nhấn "TÌM KIẾM" để tra cứu.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: QUICK INSTALL & PRESETS */}
            {activeTab === 'quick' && (
              <div className="flex-1 overflow-y-auto p-6 bg-black/40 flex flex-col gap-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,245,255,0.2) transparent' }}>
                <div>
                  <h3 style={{ ...orb, color: '#00f5ff', fontSize: '14px', margin: 0 }}>
                    CÀI ĐẶT THƯ VIỆN THEO YÊU CẦU (CUSTOM PACKAGE INSTALLER)
                  </h3>
                  <p style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: 2 }}>
                    Tải và nạp bất kỳ thư viện NPM, Python (PyPI), CDN URL hoặc Git Repository
                  </p>
                </div>

                {/* Custom Install Form */}
                <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label style={{ ...mono, color: 'rgba(0,245,255,0.7)', fontSize: '10px' }}>TRÌNH QUẢN LÝ GÓI</label>
                      <select
                        value={customPkgManager}
                        onChange={e => setCustomPkgManager(e.target.value as any)}
                        className="w-full mt-1.5 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                      >
                        <option value="npm">NPM (Node.js / React)</option>
                        <option value="pip">PyPI (Python 3)</option>
                        <option value="cdn">CDN (esm.sh / unpkg)</option>
                        <option value="git">Git Repository</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ ...mono, color: 'rgba(0,245,255,0.7)', fontSize: '10px' }}>TÊN THƯ VIỆN / URL</label>
                      <input
                        type="text"
                        value={customPkgName}
                        onChange={e => setCustomPkgName(e.target.value)}
                        placeholder="Ví dụ: axios, three, pandas, lodash..."
                        className="w-full mt-1.5 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label style={{ ...mono, color: 'rgba(0,245,255,0.7)', fontSize: '10px' }}>PHIÊN BẢN (VERSION)</label>
                      <input
                        type="text"
                        value={customPkgVersion}
                        onChange={e => setCustomPkgVersion(e.target.value)}
                        placeholder="latest hoặc ^1.0.0"
                        className="w-full mt-1.5 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleQuickInstall(customPkgName, customPkgManager)}
                      disabled={isInstalling || !customPkgName.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold font-mono text-xs cursor-pointer disabled:opacity-40"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isInstalling ? 'ĐANG TẢI & CÀI ĐẶT...' : 'TẢI & CÀI ĐẶT NGAY'}</span>
                    </button>
                  </div>
                </div>

                {/* Popular Presets */}
                <div>
                  <h4 style={{ ...orb, color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginBottom: 10 }}>
                    CÁC THƯ VIỆN PHỔ BIẾN ĐƯỢC ĐỀ XUẤT
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {QUICK_INSTALL_PRESETS.map(preset => (
                      <div
                        key={preset.name}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                              preset.manager === 'pip' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                            }`}>
                              {preset.manager}
                            </span>
                            <span style={{ ...orb, color: '#fff', fontSize: '12px' }}>{preset.name}</span>
                          </div>
                          <span style={{ ...aptos, color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                            {preset.desc}
                          </span>
                        </div>
                        <button
                          onClick={() => handleQuickInstall(preset.name, preset.manager)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs cursor-pointer"
                        >
                          Cài
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
