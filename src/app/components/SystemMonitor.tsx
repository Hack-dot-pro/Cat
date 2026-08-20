import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Cpu, Database, Wifi, Thermometer, Zap } from 'lucide-react';
import { cacheService, CacheStats } from '../services/cache';

const orb = { fontFamily: 'Orbitron, sans-serif' };
const mono = { fontFamily: 'Share Tech Mono, monospace' };
const raj = { fontFamily: 'Rajdhani, sans-serif' };

const glassPanel = {
  background: 'rgba(0, 12, 30, 0.6)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(0, 245, 255, 0.15)',
  borderRadius: '12px',
};

function generate(base: number, variance: number) {
  return Math.max(5, Math.min(99, base + (Math.random() - 0.5) * variance * 2));
}

function initData(base: number, variance: number) {
  return Array(25).fill(0).map((_, i) => ({ t: i, v: generate(base, variance) }));
}

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
  data: { t: number; v: number }[];
}

function MetricCard({ label, value, unit, color, icon, data }: MetricCardProps) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{
        background: 'rgba(0, 8, 20, 0.5)',
        border: `1px solid ${color}25`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div style={{ color }}>{icon}</div>
          <span style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>{label}</span>
        </div>
        <span style={{ ...orb, color, fontSize: '14px', textShadow: `0 0 8px ${color}` }}>
          {Math.round(value)}
          <span style={{ fontSize: '9px', opacity: 0.7 }}>{unit}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 6px ${color}` }}
        />
      </div>

      {/* Mini chart */}
      <div style={{ height: 36 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${label})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SystemMonitor() {
  const [cpu, setCpu] = useState(() => initData(42, 18));
  const [mem, setMem] = useState(() => initData(62, 12));
  const [net, setNet] = useState(() => initData(35, 30));
  const [gpu, setGpu] = useState(() => initData(28, 15));
  const [temp, setTemp] = useState(54);
  const [uptime, setUptime] = useState(14398);
  const [cacheStats, setCacheStats] = useState<CacheStats>(() => cacheService.getStats());

  useEffect(() => {
    const unsub = cacheService.subscribe(() => {
      setCacheStats(cacheService.getStats());
    });

    const interval = setInterval(() => {
      const t = Date.now();
      setCpu(p => [...p.slice(1), { t, v: generate(42, 18) }]);
      setMem(p => [...p.slice(1), { t, v: generate(62, 12) }]);
      setNet(p => [...p.slice(1), { t, v: generate(35, 30) }]);
      setGpu(p => [...p.slice(1), { t, v: generate(28, 15) }]);
      setTemp(generate(54, 4));
      setUptime(s => s + 2);
    }, 2000);

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);

  const fmtUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const metrics = [
    { label: 'CPU', value: cpu[cpu.length - 1].v, unit: '%', color: '#00f5ff', icon: <Cpu className="w-3 h-3" />, data: cpu },
    { label: 'MEMORY', value: mem[mem.length - 1].v, unit: '%', color: '#a855f7', icon: <Database className="w-3 h-3" />, data: mem },
    { label: 'NETWORK', value: net[net.length - 1].v, unit: '%', color: '#0ea5e9', icon: <Wifi className="w-3 h-3" />, data: net },
    { label: 'GPU', value: gpu[gpu.length - 1].v, unit: '%', color: '#f59e0b', icon: <Zap className="w-3 h-3" />, data: gpu },
  ];

  const getHealthColor = (v: number) => v < 60 ? '#22c55e' : v < 80 ? '#f59e0b' : '#ef4444';
  const overallHealth = Math.round((metrics.reduce((a, m) => a + m.value, 0) / metrics.length));

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: '#00f5ff' }} />
          <span style={{ ...orb, color: '#00f5ff', fontSize: '11px', letterSpacing: '0.15em' }}>SYSTEM MONITOR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#22c55e' }}
          />
          <span style={{ ...mono, color: '#22c55e', fontSize: '9px' }}>LIVE</span>
        </div>
      </div>

      {/* Health overview */}
      <div
        className="rounded-xl p-3 flex items-center gap-4 flex-shrink-0"
        style={{
          background: 'rgba(0,8,20,0.5)',
          border: `1px solid ${getHealthColor(overallHealth)}25`,
        }}
      >
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <motion.circle
              cx="24" cy="24" r="20"
              fill="none"
              stroke={getHealthColor(overallHealth)}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 20}`}
              animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - overallHealth / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 4px ${getHealthColor(overallHealth)})` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ ...orb, color: getHealthColor(overallHealth), fontSize: '10px' }}>
              {Math.round(overallHealth)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span style={{ ...raj, color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>System Health</span>
          <span style={{ ...mono, color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>
            UPTIME: {fmtUptime(uptime)}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <Thermometer className="w-3 h-3" style={{ color: '#f59e0b' }} />
            <span style={{ ...mono, color: '#f59e0b', fontSize: '10px' }}>{Math.round(temp)}°C</span>
          </div>
        </div>
        <div className="ml-auto">
          <span style={{ ...raj, color: getHealthColor(overallHealth), fontSize: '12px' }}>
            {overallHealth < 60 ? 'OPTIMAL' : overallHealth < 80 ? 'MODERATE' : 'HIGH LOAD'}
          </span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto">
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* 4-Tier High-Performance Cache Card */}
      <div
        className="rounded-xl p-3 flex-shrink-0 flex flex-col gap-2"
        style={{
          background: 'rgba(0, 15, 30, 0.65)',
          border: '1px solid rgba(0, 245, 255, 0.25)',
          boxShadow: '0 0 15px rgba(0, 245, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span style={{ ...orb, color: '#00f5ff', fontSize: '10px', letterSpacing: '0.08em' }}>
              BỘ ĐỆM 4 TẦNG CACHE
            </span>
          </div>
          <button
            onClick={() => cacheService.clearAll()}
            className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 cursor-pointer"
            title="Xóa sạch toàn bộ Cache"
          >
            Làm mới
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-1.5 rounded bg-black/40 border border-white/5 flex flex-col">
            <span style={{ ...orb, color: '#22c55e', fontSize: '12px' }}>
              {cacheStats.hitRatePercent}%
            </span>
            <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '8px' }}>
              HIT RATE
            </span>
          </div>
          <div className="p-1.5 rounded bg-black/40 border border-white/5 flex flex-col">
            <span style={{ ...orb, color: '#a855f7', fontSize: '12px' }}>
              {cacheStats.savedTokens > 999 ? `${(cacheStats.savedTokens / 1000).toFixed(1)}k` : cacheStats.savedTokens}
            </span>
            <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '8px' }}>
              SAVED TOKENS
            </span>
          </div>
          <div className="p-1.5 rounded bg-black/40 border border-white/5 flex flex-col">
            <span style={{ ...orb, color: '#00f5ff', fontSize: '12px' }}>
              {cacheStats.l1ItemCount + cacheStats.l2ItemCount}
            </span>
            <span style={{ ...mono, color: 'rgba(255,255,255,0.4)', fontSize: '8px' }}>
              ENTRIES
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-white/50 pt-1 border-t border-white/5">
          <span>L1 RAM: {(cacheStats.totalMemoryBytes / 1024).toFixed(1)} KB</span>
          <span className="text-cyan-300">Độ trễ: &lt; 2ms</span>
        </div>
      </div>

      {/* Process list */}
      <div
        className="rounded-xl p-3 flex-shrink-0"
        style={{ background: 'rgba(0,8,20,0.5)', border: '1px solid rgba(0,245,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ ...mono, color: 'rgba(0,245,255,0.6)', fontSize: '10px' }}>TOP PROCESSES</span>
        </div>
        {[
          { name: 'kim-core.exe', cpu: 12.4, mem: 842 },
          { name: 'cache-engine', cpu: 0.8, mem: 128 },
          { name: 'neural-net.dll', cpu: 8.1, mem: 1240 },
          { name: 'voice-synth', cpu: 3.2, mem: 256 },
        ].map(p => (
          <div key={p.name} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>{p.name}</span>
            <div className="flex gap-3">
              <span style={{ ...mono, color: '#00f5ff', fontSize: '9px' }}>{p.cpu}%</span>
              <span style={{ ...mono, color: '#a855f7', fontSize: '9px' }}>{p.mem}MB</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
