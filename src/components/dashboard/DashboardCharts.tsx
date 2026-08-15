'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Zap, Clock, ShieldCheck, DollarSign, Activity } from 'lucide-react';
import { useTokenStore } from '@/store/useTokenStore';

export function DashboardCharts() {
  const { getFilteredUsageLogs, dateRange, getKPIMetrics, isMockMode } = useTokenStore();
  
  const usageLogs = getFilteredUsageLogs ? getFilteredUsageLogs() : [];
  const kpi: any = getKPIMetrics ? getKPIMetrics() : {
    totalMonthlyCost: 0,
    costChangePercent: 0,
    totalTokens: 0,
    activeKeysCount: 0,
    promptTokens: 0,
    completionTokens: 0,
    avgLatencyMs: 0,
    errorRatePercent: 0,
  };

  const timelineData = useMemo(() => {
    if (!usageLogs || usageLogs.length === 0) return [];
    const map = new Map();
    usageLogs.forEach((log) => {
      const d = new Date(log.timestamp);
      const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!map.has(dateKey)) {
        map.set(dateKey, { date: dateKey, OpenAI: 0, Anthropic: 0, OpenRouter: 0 });
      }
      const item = map.get(dateKey);
      const provider = (log.providerId || '').toLowerCase();
      if (provider === 'openai') item.OpenAI += log.totalTokens || 0;
      else if (provider === 'anthropic') item.Anthropic += log.totalTokens || 0;
      else if (provider === 'openrouter') item.OpenRouter += log.totalTokens || 0;
    });
    return Array.from(map.values());
  }, [usageLogs]);

  const modelSpendData = useMemo(() => {
    if (!usageLogs || usageLogs.length === 0) return [];
    const map = new Map();
    usageLogs.forEach((log) => {
      const model = log.model || 'Unknown';
      const cost = log.cost || 0;
      map.set(model, (map.get(model) || 0) + cost);
    });
    const COLORS = ['#00f3ff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return Array.from(map.entries()).map(([name, value], i) => ({
      name,
      value: Number(value.toFixed(2)),
      color: COLORS[i % COLORS.length],
      fill: COLORS[i % COLORS.length],
    }));
  }, [usageLogs]);

  return (
    <div className="w-full space-y-6">
      {/* KPI Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>TOTAL SPEND</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            ${(kpi.totalMonthlyCost || 0).toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono mt-2">
            <TrendingUp className="w-3 h-3" />
            <span>+{(kpi.costChangePercent || 0).toFixed(1)}% vs last period</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>TOTAL TOKENS</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {((kpi.totalTokens || 0) / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-2">
            {((kpi.promptTokens || 0) / 1_000_000).toFixed(1)}M Prompt / {((kpi.completionTokens || 0) / 1_000_000).toFixed(1)}M Comp
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>AVG LATENCY</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {kpi.avgLatencyMs || 0} <span className="text-xs text-zinc-400">ms</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Optimal response speed</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>ACTIVE KEYS</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {(kpi as any).activeKeysCount || 0}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-2">
            Error rate: {(kpi.errorRatePercent || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Token Consumption Timeline */}
        <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Token Consumption Timeline
              </h3>
              <p className="text-xs text-zinc-400">Tokens processed over time per LLM provider</p>
            </div>
            {isMockMode && (
              <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                SIMULATED DATA
              </span>
            )}
          </div>

          <div className="h-[280px] sm:h-[320px] w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorClaude" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRouter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Area type="monotone" dataKey="OpenAI" stroke="#00f3ff" fillOpacity={1} fill="url(#colorGpt)" />
                <Area type="monotone" dataKey="Anthropic" stroke="#10b981" fillOpacity={1} fill="url(#colorClaude)" />
                <Area type="monotone" dataKey="OpenRouter" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRouter)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Model Spend Breakdown */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-100">Model Cost Breakdown</h3>
            <p className="text-xs text-zinc-400">Share of spend by LLM model</p>
          </div>

          <div className="h-[200px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelSpendData || []}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(modelSpendData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`$${val}`, 'Cost']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2 border-t border-zinc-800/60 pt-3">
            {(modelSpendData || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-zinc-300">{item.name}</span>
                </div>
                <span className="text-zinc-100 font-semibold">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;
