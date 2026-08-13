"use client";

import React from "react";
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
} from "recharts";
import { DollarSign, Zap, Clock, ShieldCheck, TrendingUp } from "lucide-react";
import { useTokenStore } from "@/store/useTokenStore";

export function DashboardCharts() {
  const { isMockMode, timelineData, modelSpendData, providerHealth, getKPIMetrics } =
    useTokenStore();

  const kpi = getKPIMetrics ? getKPIMetrics() : {
    totalMonthlyCost: 0,
    costChangePercent: 0,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    avgLatencyMs: 0,
  };

  return (
    <div className="w-full space-y-6">
      {/* Top KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Cost */}
        <div className="p-4 bg-zinc-950/60 border border-zinc-800 hover:border-cyan-500/40 rounded-lg backdrop-blur-md transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
            <span>Projected Monthly Spend</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${kpi.totalMonthlyCost.toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono mt-2">
            <TrendingUp className="w-3 h-3" />
            <span>+{kpi.costChangePercent}% vs last week</span>
          </div>
        </div>

        {/* Metric 2: Total Tokens */}
        <div className="p-4 bg-zinc-950/60 border border-zinc-800 hover:border-purple-500/40 rounded-lg backdrop-blur-md transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
            <span>Total Tokens Consumed</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {(kpi.totalTokens / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-2">
            {(kpi.promptTokens / 1_000_000).toFixed(1)}M Prompt / {(kpi.completionTokens / 1_000_000).toFixed(1)}M Completion
          </div>
        </div>

        {/* Metric 3: Avg Latency */}
        <div className="p-4 bg-zinc-950/60 border border-zinc-800 hover:border-emerald-500/40 rounded-lg backdrop-blur-md transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
            <span>Average Response Latency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {kpi.avgLatencyMs} <span className="text-xs text-zinc-400">ms</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Optimal SLA Performance</span>
          </div>
        </div>

        {/* Metric 4: Vault Encryption Status */}
        <div className="p-4 bg-zinc-950/60 border border-cyan-500/30 rounded-lg backdrop-blur-md transition-all shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
            <span>Security Engine</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-cyan-300 font-mono">
            AES-256-GCM
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-2">
            Zero-Knowledge • Local Encryption Active
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Burn Rate Timeline (2/3 width) */}
        <div className="lg:col-span-2 p-5 bg-zinc-950/60 border border-zinc-800 rounded-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Token Consumption Timeline
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Tokens processed over time per LLM provider
              </p>
            </div>
            {isMockMode && (
              <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
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
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRouter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" stroke="#71717a" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#71717a" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#090a0f", borderColor: "#27272a", borderRadius: "6px" }}
                  itemStyle={{ fontSize: "12px", fontFamily: "monospace" }}
                />
                <Area type="monotone" dataKey="gpt4o" name="GPT-4o" stroke="#00f3ff" fillOpacity={1} fill="url(#colorGpt)" />
                <Area type="monotone" dataKey="claudeSonnet" name="Claude 3.5" stroke="#a855f7" fillOpacity={1} fill="url(#colorClaude)" />
                <Area type="monotone" dataKey="openRouter" name="OpenRouter" stroke="#10b981" fillOpacity={1} fill="url(#colorRouter)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Spend Breakdown Donut Chart (1/3 width) */}
        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded-lg backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-1">
              Provider Spend Share
            </h3>
            <p className="text-xs text-zinc-400 font-mono mb-4">
              Cost distribution across integrated APIs
            </p>

            <div className="h-[280px] sm:h-[320px] w-full overflow-hidden">
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
                    contentStyle={{ backgroundColor: "#090a0f", borderColor: "#27272a", borderRadius: "6px" }}
                    formatter={(value: any) => [`$${Number(value ?? 0).toFixed(2)}`, "Spend"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 mt-2 font-mono text-xs">
            {(modelSpendData || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-semibold text-white">${Number(item.value || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provider Health & SLA Gauge */}
      <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded-lg backdrop-blur-md">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-3">
          Provider Health & API SLA Gauges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {(providerHealth || []).map((provider) => (
            <div
              key={provider.name}
              className="p-3 bg-zinc-900/50 border border-zinc-800 rounded flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-white">{provider.name}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Uptime: {provider.uptime}</div>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 font-semibold">{provider.latencyMs}ms</div>
                <div className="flex items-center justify-end gap-1 text-[10px] mt-0.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="uppercase">{provider.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}