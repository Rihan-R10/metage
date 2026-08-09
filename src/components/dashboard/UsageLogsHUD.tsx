"use client";

import React, { useState } from "react";
import {
  Terminal,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Pause,
  Play,
  Lock,
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  status: "success" | "warning" | "error";
  latencyMs: number;
  tokens: number;
  cost: number;
  promptSnippet: string;
}

const MOCK_LOGS: LogEntry[] = [
  {
    id: "log-101",
    timestamp: "12:42:05.120",
    provider: "OpenAI",
    model: "gpt-4o",
    status: "success",
    latencyMs: 340,
    tokens: 1240,
    cost: 0.0062,
    promptSnippet: "Analyze system logs for security vulnerabilities across AWS infrastructure...",
  },
  {
    id: "log-102",
    timestamp: "12:41:50.040",
    provider: "Anthropic",
    model: "claude-3-5-sonnet",
    status: "success",
    latencyMs: 510,
    tokens: 2890,
    cost: 0.0144,
    promptSnippet: "Synthesize summary report for Q3 cloud token allocation and burn rate...",
  },
  {
    id: "log-103",
    timestamp: "12:41:12.890",
    provider: "OpenRouter",
    model: "deepseek-r1",
    status: "warning",
    latencyMs: 1200,
    tokens: 850,
    cost: 0.0012,
    promptSnippet: "Execute complex mathematical reasoning over multi-variable dataset...",
  },
  {
    id: "log-104",
    timestamp: "12:39:02.450",
    provider: "OpenAI",
    model: "gpt-4o-mini",
    status: "error",
    latencyMs: 4050,
    tokens: 0,
    cost: 0.0,
    promptSnippet: "Stream response timeout: Connection terminated by remote host...",
  },
];

export function UsageLogsHUD({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const [logs] = useState<LogEntry[]>(MOCK_LOGS);
  const [filter, setFilter] = useState<"all" | "success" | "warning" | "error">("all");
  const [search, setSearch] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.status === filter;
    const matchesSearch =
      log.model.toLowerCase().includes(search.toLowerCase()) ||
      log.provider.toLowerCase().includes(search.toLowerCase()) ||
      log.promptSnippet.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg backdrop-blur-md overflow-hidden font-mono text-xs">
      {/* HUD Header */}
      <div className="p-3 bg-zinc-900/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Live Stream Logs
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {isLive ? "LIVE STREAMING" : "PAUSED"}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search snippet, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1 bg-zinc-950 border border-zinc-800 focus:border-cyan-500/50 rounded text-zinc-200 text-[11px] outline-none w-36 sm:w-48 transition-all"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center border border-zinc-800 rounded bg-zinc-950 p-0.5">
            {(["all", "success", "warning", "error"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-2 py-0.5 rounded text-[10px] capitalize transition-all ${
                  filter === st
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Stream Pause/Play Toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className="p-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-300 transition-all"
            title={isLive ? "Pause Feed" : "Resume Feed"}
          >
            {isLive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Pending Anti-Gravity Auth Button Trigger */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold rounded text-[10px] transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)]"
          >
            <Lock className="w-3 h-3" />
            <span>Anti-gravity Auth</span>
          </button>
        </div>
      </div>

      {/* Logs Table Header */}
      <div className="grid grid-cols-12 px-4 py-2 border-b border-zinc-800/60 bg-zinc-900/30 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
        <div className="col-span-1">Status</div>
        <div className="col-span-2 hidden sm:block">Time</div>
        <div className="col-span-2">Provider</div>
        <div className="col-span-2">Model</div>
        <div className="col-span-3 sm:col-span-3">Snippet</div>
        <div className="col-span-2 sm:col-span-2 text-right">Cost / Latency</div>
      </div>

      {/* Logs Feed Container */}
      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No telemetry records found matching query parameters.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div key={log.id} className="group hover:bg-zinc-900/40 transition-colors">
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="grid grid-cols-12 px-4 py-2.5 items-center cursor-pointer select-none"
                >
                  {/* Status Indicator */}
                  <div className="col-span-1 flex items-center gap-1">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                    )}
                    {log.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {log.status === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    {log.status === "error" && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  </div>

                  {/* Time */}
                  <div className="col-span-2 hidden sm:block text-zinc-400 text-[11px]">
                    {log.timestamp}
                  </div>

                  {/* Provider */}
                  <div className="col-span-2 text-zinc-200 font-semibold">{log.provider}</div>

                  {/* Model */}
                  <div className="col-span-2 text-cyan-400/90 truncate">{log.model}</div>

                  {/* Snippet */}
                  <div className="col-span-3 sm:col-span-3 text-zinc-400 truncate pr-2">
                    {log.promptSnippet}
                  </div>

                  {/* Cost & Latency */}
                  <div className="col-span-2 sm:col-span-2 text-right font-mono">
                    <span className="text-emerald-400 font-semibold">${log.cost.toFixed(4)}</span>
                    <span className="text-zinc-500 block text-[10px]">{log.latencyMs}ms</span>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-6 py-3 bg-zinc-950/90 border-y border-zinc-800/80 text-[11px] space-y-2">
                    <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/40 pb-1.5">
                      <span className="font-semibold text-zinc-300">Payload Telemetry ID: {log.id}</span>
                      <button
                        onClick={() => handleCopy(log.id, JSON.stringify(log, null, 2))}
                        className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedId === log.id ? "Copied" : "Copy Raw JSON"}
                      </button>
                    </div>
                    <p className="text-zinc-300 leading-relaxed font-sans">{log.promptSnippet}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] text-zinc-400 font-mono">
                      <div>Total Tokens: <span className="text-white">{log.tokens}</span></div>
                      <div>Latency: <span className="text-white">{log.latencyMs}ms</span></div>
                      <div>Status: <span className="uppercase text-cyan-400">{log.status}</span></div>
                      <div>Cost: <span className="text-emerald-400">${log.cost}</span></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}