import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Cpu, Server, Plus, CheckCircle, AlertCircle,
  Play, RefreshCw, Trash2, Power, Terminal, Zap, Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../services/sound';
import { mcpService, MCPServer, MCPTool } from '../services/mcp';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const aptos = { fontFamily: "'Aptos Narrow', 'Aptos', sans-serif" };

export function MCPPanel() {
  const { mcpOpen, setMcpOpen, addNotification } = useApp();
  const [servers, setServers] = useState<MCPServer[]>(() => mcpService.getServers());
  const [tools, setTools] = useState<MCPTool[]>(() => mcpService.getTools());
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(tools[0] || null);

  // New server modal
  const [showAddServer, setShowAddServer] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [serverAuth, setServerAuth] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Tool execution test
  const [testArgs, setTestArgs] = useState('{"expression": "25 * 4 + 100 / 2"}');
  const [executing, setExecuting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const refreshData = () => {
    setServers(mcpService.getServers());
    setTools(mcpService.getTools());
  };

  const handleToggleTool = (name: string, enabled: boolean) => {
    sounds.playClick();
    mcpService.toggleTool(name, enabled);
    refreshData();
  };

  const handleAddServer = async () => {
    if (!serverName.trim() || !serverUrl.trim()) return;
    sounds.playClick();
    setIsAdding(true);

    const res = await mcpService.addServer(serverName, serverUrl, serverAuth);
    setIsAdding(false);

    if (res.success) {
      sounds.playSuccess();
      addNotification({ type: 'success', title: 'Máy chủ MCP kết nối', message: res.message });
      setShowAddServer(false);
      setServerName('');
      setServerUrl('');
      setServerAuth('');
      refreshData();
    } else {
      sounds.playError();
      addNotification({ type: 'error', title: 'Lỗi MCP Server', message: res.message });
    }
  };

  const handleRemoveServer = (id: string) => {
    sounds.playClick();
    mcpService.removeServer(id);
    refreshData();
    addNotification({ type: 'info', title: 'Đã xóa MCP Server', message: 'Máy chủ đã được gỡ khỏi hệ thống.' });
  };

  const handleRunTool = async () => {
    if (!selectedTool) return;
    sounds.playScan();
    setExecuting(true);
    setTestResult(null);

    let parsedArgs = {};
    try {
      if (testArgs.trim()) parsedArgs = JSON.parse(testArgs);
    } catch {
      sounds.playError();
      setTestResult({ error: 'Tham số JSON không hợp lệ' });
      setExecuting(false);
      return;
    }

    const res = await mcpService.callTool(selectedTool.name, parsedArgs);
    setExecuting(false);
    setTestResult(res);

    if (res.success) {
      sounds.playSuccess();
    } else {
      sounds.playError();
    }
  };

  return (
    <AnimatePresence>
      {mcpOpen && (
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
              border: '1px solid rgba(168,85,247,0.3)',
              boxShadow: '0 0 50px rgba(168,85,247,0.15), inset 0 0 30px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(168,85,247,0.2)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)' }}
                >
                  <Cpu className="w-5 h-5" style={{ color: '#a855f7' }} />
                </div>
                <div>
                  <h2 style={{ ...orb, color: '#a855f7', fontSize: '15px', letterSpacing: '0.15em', margin: 0 }}>
                    MODEL CONTEXT PROTOCOL (MCP) TOOL HUB
                  </h2>
                  <p style={{ ...mono, color: 'rgba(168,85,247,0.6)', fontSize: '10px', marginTop: 2 }}>
                    QUẢN LÝ CÔNG CỤ NGOẠI VI & MÁY CHỦ MCP CHO THƯ KÝ KIM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    sounds.playClick();
                    setShowAddServer(!showAddServer);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl cursor-pointer"
                  style={{
                    background: 'rgba(168,85,247,0.15)',
                    border: '1px solid rgba(168,85,247,0.4)',
                    boxShadow: '0 0 15px rgba(168,85,247,0.15)',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />
                  <span style={{ ...mono, color: '#a855f7', fontSize: '10px' }}>THÊM MCP SERVER</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    sounds.playClick();
                    setMcpOpen(false);
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                </motion.button>
              </div>
            </div>

            {/* Add Server Dropdown Modal */}
            <AnimatePresence>
              {showAddServer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 py-4 overflow-hidden"
                  style={{ background: 'rgba(168,85,247,0.06)', borderBottom: '1px solid rgba(168,85,247,0.2)' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      placeholder="Tên máy chủ (vd: Database Server)"
                      value={serverName}
                      onChange={e => setServerName(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-white text-xs outline-none focus:border-purple-400"
                    />
                    <input
                      placeholder="URL Endpoint (vd: http://localhost:8000/rpc)"
                      value={serverUrl}
                      onChange={e => setServerUrl(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-white text-xs outline-none focus:border-purple-400"
                    />
                    <div className="flex gap-2">
                      <input
                        placeholder="Auth Bearer Token (Tùy chọn)"
                        value={serverAuth}
                        onChange={e => setServerAuth(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-white text-xs outline-none focus:border-purple-400"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isAdding}
                        onClick={handleAddServer}
                        className="px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-500 text-purple-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
                      >
                        {isAdding ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'KẾT NỐI'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content: 2 Columns */}
            <div className="flex flex-1 overflow-hidden" style={{ minHeight: 460 }}>
              {/* Left Column: Server & Tools List */}
              <div
                className="w-80 flex flex-col gap-3 p-4 flex-shrink-0"
                style={{ borderRight: '1px solid rgba(168,85,247,0.15)' }}
              >
                {/* Servers Section */}
                <div className="flex flex-col gap-1.5">
                  <span style={{ ...mono, color: 'rgba(168,85,247,0.8)', fontSize: '10px' }}>
                    MÁY CHỦ MCP ({servers.length})
                  </span>
                  <div className="flex flex-col gap-1">
                    {servers.map(srv => (
                      <div
                        key={srv.id}
                        className="flex items-center justify-between p-2 rounded-xl text-xs"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(168,85,247,0.15)',
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Server className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span style={{ ...aptos, color: '#fff', fontSize: '12px' }} className="truncate">
                              {srv.name}
                            </span>
                            <span style={{ ...mono, color: 'rgba(255,255,255,0.35)', fontSize: '8px' }}>
                              {srv.type === 'builtin' ? 'Tích hợp sẵn' : srv.url}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: srv.status === 'connected' ? '#22c55e' : '#ef4444' }}
                          />
                          {srv.type !== 'builtin' && (
                            <button
                              onClick={() => handleRemoveServer(srv.id)}
                              className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tools Section */}
                <div className="flex-1 flex flex-col gap-1.5 min-h-0">
                  <div className="flex items-center justify-between">
                    <span style={{ ...mono, color: 'rgba(168,85,247,0.8)', fontSize: '10px' }}>
                      CÔNG CỤ MCP ({tools.length})
                    </span>
                    <span style={{ ...mono, color: '#22c55e', fontSize: '9px' }}>
                      {tools.filter(t => t.enabled).length} ĐANG BẬT
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
                    {tools.map(tool => {
                      const isSelected = selectedTool?.name === tool.name;

                      return (
                        <motion.div
                          key={tool.name}
                          whileHover={{ x: 2 }}
                          onClick={() => {
                            sounds.playClick();
                            setSelectedTool(tool);
                            if (tool.name === 'cat_calculator') {
                              setTestArgs('{"expression": "25 * 4 + 100 / 2"}');
                            } else if (tool.name === 'cat_crypto_hasher') {
                              setTestArgs('{"input": "CAT_AI_2026", "algorithm": "SHA-256"}');
                            } else if (tool.name === 'cat_datetime') {
                              setTestArgs('{"timezone": "Asia/Ho_Chi_Minh"}');
                            } else if (tool.name === 'cat_system_stats') {
                              setTestArgs('{"detailLevel": "full"}');
                            } else {
                              setTestArgs('{}');
                            }
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all"
                          style={{
                            background: isSelected ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isSelected ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.06)'}`,
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tool.enabled ? '#a855f7' : 'rgba(255,255,255,0.3)' }} />
                            <div className="flex flex-col min-w-0">
                              <span style={{ ...mono, color: isSelected ? '#a855f7' : 'rgba(255,255,255,0.85)', fontSize: '11px' }} className="truncate">
                                {tool.name}
                              </span>
                              <span style={{ ...aptos, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }} className="truncate">
                                {tool.description}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleToggleTool(tool.name, !tool.enabled);
                            }}
                            className="p-1 rounded cursor-pointer"
                            title={tool.enabled ? 'Tắt công cụ' : 'Bật công cụ'}
                          >
                            <Power className={`w-3.5 h-3.5 ${tool.enabled ? 'text-green-400' : 'text-gray-500'}`} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Tool Details & Interactive Test */}
              <div className="flex-1 flex flex-col p-6 overflow-y-auto gap-4">
                {selectedTool ? (
                  <>
                    <div
                      className="p-4 rounded-xl flex items-center justify-between"
                      style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ ...orb, color: '#a855f7', fontSize: '14px' }}>
                            {selectedTool.name}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-mono"
                            style={{
                              background: selectedTool.enabled ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                              color: selectedTool.enabled ? '#22c55e' : 'rgba(255,255,255,0.4)',
                              border: `1px solid ${selectedTool.enabled ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            }}
                          >
                            {selectedTool.enabled ? 'HOẠT ĐỘNG' : 'TẮT'}
                          </span>
                        </div>
                        <p style={{ ...aptos, color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: 4 }}>
                          {selectedTool.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleTool(selectedTool.name, !selectedTool.enabled)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs cursor-pointer ${
                          selectedTool.enabled ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-green-500/20 text-green-300 border border-green-500/40'
                        }`}
                      >
                        {selectedTool.enabled ? 'TẮT CÔNG CỤ' : 'KÍCH HOẠT'}
                      </button>
                    </div>

                    {/* Parameters Schema */}
                    <div className="flex flex-col gap-1.5">
                      <span style={{ ...mono, color: 'rgba(168,85,247,0.8)', fontSize: '10px' }}>
                        CẤU TRÚC THAM SỐ (JSON SCHEMA):
                      </span>
                      <pre
                        className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-cyan-300/80 overflow-x-auto"
                        style={{ maxHeight: 130 }}
                      >
                        {JSON.stringify(selectedTool.parameters, null, 2)}
                      </pre>
                    </div>

                    {/* Test Execution Console */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span style={{ ...mono, color: 'rgba(168,85,247,0.8)', fontSize: '10px' }}>
                          THỬ NGHIỆM GỌI CÔNG CỤ (TEST CALL):
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={executing}
                          onClick={handleRunTool}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600/30 border border-purple-500 text-purple-200 text-xs font-mono cursor-pointer"
                        >
                          {executing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          <span>CHẠY THỬ</span>
                        </motion.button>
                      </div>

                      <textarea
                        value={testArgs}
                        onChange={e => setTestArgs(e.target.value)}
                        placeholder="Nhập tham số JSON (vd: { &quot;expression&quot;: &quot;10 * 5&quot; })"
                        className="w-full h-16 p-2.5 rounded-xl bg-black/70 border border-purple-500/30 text-white text-xs font-mono outline-none focus:border-purple-400"
                      />
                    </div>

                    {/* Test Result Display */}
                    {testResult && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span style={{ ...mono, color: testResult.success ? '#22c55e' : '#ef4444', fontSize: '10px' }}>
                            KẾT QUẢ TRẢ VỀ ({testResult.executionTimeMs || 0}ms):
                          </span>
                        </div>
                        <pre
                          className="p-3 rounded-xl bg-black/80 border text-xs font-mono overflow-x-auto"
                          style={{
                            borderColor: testResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                            color: testResult.success ? '#86efac' : '#fca5a5',
                            maxHeight: 150,
                          }}
                        >
                          {JSON.stringify(testResult.result || testResult.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-40 gap-2">
                    <Zap className="w-12 h-12" />
                    <span style={{ ...aptos, fontSize: '13px' }}>Chọn một công cụ MCP để xem chi tiết</span>
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
