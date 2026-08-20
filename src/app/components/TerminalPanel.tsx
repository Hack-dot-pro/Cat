import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Terminal, Play, Trash2, Download, Package, Search,
  RefreshCw, CheckCircle, AlertCircle, Cpu, ExternalLink,
  Layers, ArrowUpRight, Copy, Check, Filter, Sparkles, Plus,
  Code2, FileCode, Split, Square, Folder, Wrench, ChevronRight,
  Maximize2, Minimize2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';
import {
  terminalService,
  InstalledPackage,
  InstalledLanguage,
  TerminalOutputLine,
  VirtualFile
} from '../services/terminal';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: "'Share Tech Mono', 'Fira Code', monospace" };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

export function TerminalPanel() {
  const { terminalOpen, setTerminalOpen, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'terminal' | 'tools' | 'files' | 'packages' | 'search'>('terminal');
  const [activeSession, setActiveSession] = useState<'bash' | 'python' | 'node'>('bash');
  const [logs, setLogs] = useState<TerminalOutputLine[]>(() => terminalService.getLogs());
  const [packages, setPackages] = useState<InstalledPackage[]>(() => terminalService.getInstalledPackages());
  const [languages, setLanguages] = useState<InstalledLanguage[]>(() => terminalService.getInstalledLanguages());
  const [files, setFiles] = useState<VirtualFile[]>(() => terminalService.getVirtualFiles());
  const [inputCmd, setInputCmd] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRegistry, setSearchRegistry] = useState<'npm' | 'pip'>('npm');

  // Custom tool install state
  const [toolInstallQuery, setToolInstallQuery] = useState('');
  const [isInstallingTool, setIsInstallingTool] = useState(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return terminalService.subscribe(() => {
      setLogs(terminalService.getLogs());
      setPackages(terminalService.getInstalledPackages());
      setLanguages(terminalService.getInstalledLanguages());
      setFiles(terminalService.getVirtualFiles());
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'terminal') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  useEffect(() => {
    if (terminalOpen && activeTab === 'terminal') {
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

  const handleInstallTool = async (toolId: string) => {
    sounds.playScan();
    setIsInstallingTool(true);
    const res = await terminalService.installToolOrLanguage(toolId);
    setIsInstallingTool(false);

    if (res.success) {
      sounds.playSuccess();
      addNotification({ type: 'success', title: 'Cài đặt công cụ thành công', message: res.message });
    } else {
      sounds.playError();
      addNotification({ type: 'error', title: 'Cài đặt thất bại', message: res.message });
    }
  };

  const handleInstallPackage = async (pkgName: string, manager: 'npm' | 'pip' | 'cargo' | 'cdn' = 'npm') => {
    sounds.playScan();
    const res = await terminalService.installPackage(pkgName, manager, 'latest');
    if (res.success) {
      sounds.playSuccess();
      addNotification({ type: 'success', title: 'Cài đặt gói thành công', message: res.message });
    } else {
      sounds.playError();
      addNotification({ type: 'error', title: 'Cài đặt thất bại', message: res.message });
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
      case 'codespace':
        return '#38bdf8';
      case 'info':
        return '#93c5fd';
      default:
        return 'rgba(255,255,255,0.88)';
    }
  };

  return (
    <AnimatePresence>
      {terminalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-5"
          style={{ zIndex: 180, background: 'rgba(0, 4, 12, 0.94)', backdropFilter: 'blur(18px)' }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
              isMaximized ? 'max-w-full h-[96vh]' : 'max-w-5xl h-[88vh]'
            }`}
            style={{
              background: '#181818',
              border: '1px solid rgba(0, 245, 255, 0.25)',
              boxShadow: '0 0 50px rgba(0, 245, 255, 0.15), 0 20px 40px rgba(0,0,0,0.8)',
            }}
          >
            {/* VS Code / Codespaces Top Title Bar */}
            <div
              className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 select-none"
              style={{ background: '#1f1f1f', borderBottom: '1px solid #2b2b2b' }}
            >
              {/* Left breadcrumb / title */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56] cursor-pointer hover:opacity-80" onClick={() => setTerminalOpen(false)} />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] cursor-pointer hover:opacity-80" onClick={() => setIsMaximized(!isMaximized)} />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] cursor-pointer hover:opacity-80" />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span style={{ ...mono, color: '#e5e7eb', fontSize: '12px', fontWeight: 600 }}>
                    Thư Ký Kim — GitHub Codespaces Terminal
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    /workspaces/Cat
                  </span>
                </div>
              </div>

              {/* Right window actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  title={isMaximized ? 'Thu nhỏ' : 'Phóng to'}
                >
                  {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setTerminalOpen(false)}
                  className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/20 cursor-pointer"
                  title="Đóng Terminal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Codespace Terminal Tab Navigation Bar */}
            <div
              className="flex items-center justify-between px-3 py-1 flex-shrink-0"
              style={{ background: '#252526', borderBottom: '1px solid #1e1e1e' }}
            >
              {/* Primary Feature Tabs */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'terminal', label: '1: zsh (bash)', icon: Terminal },
                  { id: 'tools', label: `Công cụ & Ngôn ngữ (${languages.filter(l => l.installed).length})`, icon: Wrench },
                  { id: 'files', label: `Tệp mã nguồn (${files.length})`, icon: FileCode },
                  { id: 'packages', label: `Gói thư viện (${packages.length})`, icon: Package },
                  { id: 'search', label: 'Tra cứu Registry', icon: Search },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sounds.playClick();
                      setActiveTab(tab.id as any);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-mono transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-[#1e1e1e] text-white border-t-2 border-cyan-400 font-semibold'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick CLI actions */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-[11px] cursor-pointer"
                  title="Sao chép toàn bộ logs"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Đã sao chép' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => terminalService.clearLogs()}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 font-mono text-[11px] cursor-pointer"
                  title="Xóa màn hình Terminal"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Quick Command Launcher Bar */}
            <div
              className="flex items-center gap-2 px-4 py-1.5 flex-shrink-0 overflow-x-auto text-xs"
              style={{ background: '#1e1e1e', borderBottom: '1px solid #2d2d2d' }}
            >
              <span style={{ ...mono, color: '#00f5ff', fontSize: '10px', fontWeight: 600 }}>CHẠY NHANH:</span>
              {[
                { label: 'python main.py', cmd: 'python main.py' },
                { label: 'node index.js', cmd: 'node index.js' },
                { label: 'cargo run', cmd: 'cargo run' },
                { label: 'cache stats', cmd: 'cache' },
                { label: 'cache benchmark', cmd: 'cache benchmark' },
                { label: 'tool list', cmd: 'tool list' },
                { label: 'pkg list', cmd: 'pkg list' },
                { label: 'neofetch', cmd: 'neofetch' },
                { label: 'clear', cmd: 'clear' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => handleRunCommand(item.cmd)}
                  className="px-2.5 py-0.5 rounded bg-black/40 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 font-mono text-[11px] cursor-pointer transition-all flex-shrink-0"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* TAB 1: CODESPACE TERMINAL SHELL */}
            {activeTab === 'terminal' && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
                {/* Terminal Screen */}
                <div
                  className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 select-text"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#3c3c3c transparent' }}
                >
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
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
                    <div className="flex items-center gap-2 text-cyan-400 animate-pulse font-mono">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Codespace engine đang thực thi...</span>
                    </div>
                  )}
                  <div ref={logsEndRef} />
                </div>

                {/* Prompt Bar */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
                  style={{ background: '#181818', borderTop: '1px solid #2d2d2d' }}
                >
                  <span style={{ ...mono, color: '#4ade80', fontSize: '12px', fontWeight: 700 }}>
                    vinh@codespace
                  </span>
                  <span style={{ ...mono, color: '#00f5ff', fontSize: '12px' }}>
                    :~/workspace$
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputCmd}
                    onChange={e => setInputCmd(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRunCommand();
                    }}
                    placeholder="Nhập lệnh (vd: python -c 'print(2**10)', npm i axios, apt install ffmpeg, cargo run)..."
                    className="flex-1 bg-transparent outline-none font-mono text-xs text-white caret-cyan-400"
                    disabled={isExecuting}
                  />
                  <button
                    onClick={() => handleRunCommand()}
                    disabled={!inputCmd.trim() || isExecuting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs cursor-pointer disabled:opacity-40"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: TOOLS & LANGUAGE RUNTIMES */}
            {activeTab === 'tools' && (
              <div className="flex-1 overflow-y-auto p-5 bg-[#1e1e1e]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3c3c3c transparent' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 style={{ ...orb, color: '#00f5ff', fontSize: '13px', margin: 0 }}>
                      BỘ CÔNG CỤ & NGÔN NGỮ LẬP TRÌNH (RUNTIMES & TOOLCHAINS)
                    </h3>
                    <p style={{ ...mono, color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: 2 }}>
                      Thư Ký Kim có thể tự động tải và kích hoạt các ngôn ngữ, compiler và công cụ hệ thống theo yêu cầu
                    </p>
                  </div>
                </div>

                {/* Tool Search / Custom Install */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={toolInstallQuery}
                    onChange={e => setToolInstallQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleInstallTool(toolInstallQuery)}
                    placeholder="Nhập tên công cụ cần cài (vd: ffmpeg, rust, golang, bun, deno, cmake, jq)..."
                    className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-mono outline-none"
                  />
                  <button
                    onClick={() => handleInstallTool(toolInstallQuery)}
                    disabled={!toolInstallQuery.trim() || isInstallingTool}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono cursor-pointer disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Cài đặt qua APT</span>
                  </button>
                </div>

                {/* Language / Tool Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {languages.map(lang => (
                    <div
                      key={lang.id}
                      className="p-3.5 rounded-lg flex items-center justify-between"
                      style={{
                        background: lang.installed ? 'rgba(0, 245, 255, 0.04)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${lang.installed ? 'rgba(0, 245, 255, 0.25)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span style={{ ...orb, color: lang.installed ? '#00f5ff' : '#9ca3af', fontSize: '12px' }}>
                            {lang.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white/5 text-gray-300">
                            {lang.version}
                          </span>
                        </div>
                        <p style={{ ...aptos, color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: 0 }}>
                          {lang.description}
                        </p>
                      </div>

                      {lang.installed ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-green-500/20 text-green-300 text-[11px] font-mono border border-green-500/40">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>SẴN SÀNG</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInstallTool(lang.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono border border-cyan-500/40 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Cài đặt</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: VIRTUAL SOURCE FILES */}
            {activeTab === 'files' && (
              <div className="flex-1 overflow-y-auto p-5 bg-[#1e1e1e]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3c3c3c transparent' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 style={{ ...orb, color: '#00f5ff', fontSize: '13px', margin: 0 }}>
                      KHO MÃ NGUỒN VÀ TỆP TIN CODESPACE
                    </h3>
                    <p style={{ ...mono, color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: 2 }}>
                      Chạy trực tiếp các tệp Python, Node.js, Rust hoặc chỉnh sửa nội dung
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {files.map(f => (
                    <div key={f.name} className="p-4 rounded-lg bg-black/40 border border-white/10 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-cyan-400" />
                          <span style={{ ...mono, color: '#fff', fontSize: '13px', fontWeight: 600 }}>{f.name}</span>
                          <span className="text-white/30 text-[10px] font-mono">({f.size} bytes)</span>
                        </div>
                        <button
                          onClick={() => {
                            if (f.name.endsWith('.py')) handleRunCommand(`python ${f.name}`);
                            else if (f.name.endsWith('.js')) handleRunCommand(`node ${f.name}`);
                            else if (f.name.endsWith('.rs')) handleRunCommand(`cargo run`);
                            else handleRunCommand(`cat ${f.name}`);
                            setActiveTab('terminal');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs font-mono border border-green-500/40 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Chạy tệp này</span>
                        </button>
                      </div>
                      <pre className="p-3 rounded bg-black/70 border border-white/5 font-mono text-[11px] text-gray-300 overflow-x-auto select-text">
                        {f.content}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: INSTALLED PACKAGES */}
            {activeTab === 'packages' && (
              <div className="flex-1 overflow-y-auto p-5 bg-[#1e1e1e]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3c3c3c transparent' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 style={{ ...orb, color: '#00f5ff', fontSize: '13px', margin: 0 }}>
                      DANH SÁCH THƯ VIỆN ĐÃ CÀI ĐẶT
                    </h3>
                    <p style={{ ...mono, color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: 2 }}>
                      Tổng cộng {packages.length} gói thư viện đang hoạt động
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="p-3.5 rounded-lg bg-black/40 border border-white/10 flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {pkg.manager}
                          </span>
                          <span style={{ ...mono, color: '#fff', fontSize: '12px', fontWeight: 600 }}>{pkg.name}</span>
                          <span style={{ ...mono, color: '#00f5ff', fontSize: '11px' }}>{pkg.version}</span>
                        </div>
                        <span className="text-white/30 text-[10px] font-mono">{pkg.sizeKb} KB</span>
                      </div>
                      <p style={{ ...aptos, color: 'rgba(255,255,255,0.65)', fontSize: '11px', margin: 0 }}>
                        {pkg.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-[10px] font-mono text-white/30">{pkg.installedAt}</span>
                        <button
                          onClick={() => {
                            sounds.playClick();
                            terminalService.uninstallPackage(pkg.name, pkg.manager);
                          }}
                          className="p-1 text-red-400/60 hover:text-red-400 cursor-pointer"
                          title="Gỡ bỏ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SEARCH REGISTRY */}
            {activeTab === 'search' && (
              <div className="flex-1 overflow-y-auto p-5 bg-[#1e1e1e] flex flex-col gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3c3c3c transparent' }}>
                <div>
                  <h3 style={{ ...orb, color: '#00f5ff', fontSize: '13px', margin: 0 }}>
                    TRA CỨU & CÀI ĐẶT THƯ VIỆN TRỰC TUYẾN
                  </h3>
                  <p style={{ ...mono, color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: 2 }}>
                    Tìm kiếm trên NPM Registry và Python PyPI
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchRegistry()}
                    placeholder="Nhập tên thư viện (vd: axios, three, pandas, express, tailwindcss)..."
                    className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-mono outline-none"
                  />
                  <div className="flex items-center bg-black/50 rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() => setSearchRegistry('npm')}
                      className={`px-3 py-1 rounded text-xs font-mono cursor-pointer ${
                        searchRegistry === 'npm' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400'
                      }`}
                    >
                      NPM
                    </button>
                    <button
                      onClick={() => setSearchRegistry('pip')}
                      className={`px-3 py-1 rounded text-xs font-mono cursor-pointer ${
                        searchRegistry === 'pip' ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400'
                      }`}
                    >
                      PyPI
                    </button>
                  </div>
                  <button
                    onClick={handleSearchRegistry}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono cursor-pointer disabled:opacity-40"
                  >
                    {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {searchResults.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span style={{ ...mono, color: '#00f5ff', fontSize: '13px', fontWeight: 600 }}>{item.name}</span>
                          <span className="text-white/40 text-[10px] font-mono">v{item.version}</span>
                        </div>
                        <p style={{ ...aptos, color: 'rgba(255,255,255,0.7)', fontSize: '11px', margin: 0 }}>
                          {item.description || item.summary || 'Không có mô tả'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleInstallPackage(item.name, searchRegistry)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs font-mono border border-green-500/40 cursor-pointer flex-shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>Cài đặt</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
