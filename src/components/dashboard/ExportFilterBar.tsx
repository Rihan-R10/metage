'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileJson } from 'lucide-react';
import { useTokenStore, type DateRange } from '@/store/useTokenStore';

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'YTD', value: 'ytd' },
];

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDateLabel(range: DateRange): string {
  const now = new Date();
  if (range === 'ytd') {
    return `YTD-${now.getFullYear()}`;
  }
  return range.toUpperCase();
}

export function ExportFilterBar() {
  const dateRange = useTokenStore((s) => s.dateRange);
  const setDateRange = useTokenStore((s) => s.setDateRange);
  const getFilteredUsageLogs = useTokenStore((s) => s.getFilteredUsageLogs);
  const isMockMode = useTokenStore((s) => s.isMockMode);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleExportCSV() {
    const logs = getFilteredUsageLogs();
    const label = formatDateLabel(dateRange);

    const headers = ['Date', 'Model', 'Provider', 'Prompt Tokens', 'Completion Tokens', 'Total Tokens', 'Total Cost (USD)'];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString().split('T')[0],
      log.model ?? 'unknown',
      log.providerId,
      log.inputTokens ?? 0,
      log.outputTokens ?? 0,
      log.totalTokens ?? 0,
      (log.cost ?? 0).toFixed(4),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    downloadFile(csv, `tokendash-export-${label}.csv`, 'text/csv');
    setIsDropdownOpen(false);
  }

  function handleExportJSON() {
    const logs = getFilteredUsageLogs();
    const label = formatDateLabel(dateRange);

    const payload = {
      exportedAt: new Date().toISOString(),
      dateRange,
      isMockMode,
      totalRecords: logs.length,
      records: logs.map((log) => ({
        date: new Date(log.timestamp).toISOString().split('T')[0],
        timestamp: log.timestamp,
        model: log.model ?? 'unknown',
        provider: log.providerId,
        promptTokens: log.inputTokens ?? 0,
        completionTokens: log.outputTokens ?? 0,
        totalTokens: log.totalTokens ?? 0,
        totalCostUSD: log.cost ?? 0,
      })),
    };

    downloadFile(JSON.stringify(payload, null, 2), `tokendash-export-${label}.json`, 'application/json');
    setIsDropdownOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 shadow-sm">
      {/* Left: Date range selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest mr-1 select-none">
          Range
        </span>
        <div
          role="group"
          aria-label="Date range selection"
          className="flex items-center bg-zinc-800/80 rounded-lg p-0.5 gap-0.5"
        >
          {DATE_RANGE_OPTIONS.map(({ label, value }) => {
            const isActive = dateRange === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setDateRange(value)}
                aria-pressed={isActive}
                className={`relative px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wider transition-all duration-150 cursor-pointer select-none
                  active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                  ${isActive
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                  }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-emerald-400/70" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Export dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60
            text-zinc-300 text-xs font-semibold tracking-wide
            hover:bg-zinc-700/70 hover:border-zinc-600/60 hover:text-zinc-100
            active:scale-95 transition-all duration-150 cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          Export Data
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-700/80 shadow-2xl shadow-black/50
              overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="p-1 space-y-0.5">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-zinc-300
                  hover:bg-zinc-800 hover:text-emerald-400 transition-colors duration-100 cursor-pointer
                  active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <FileText className="w-4 h-4 text-emerald-500/70 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-xs">Export CSV</div>
                  <div className="text-[10px] text-zinc-500">Spreadsheet format</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-zinc-300
                  hover:bg-zinc-800 hover:text-violet-400 transition-colors duration-100 cursor-pointer
                  active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <FileJson className="w-4 h-4 text-violet-500/70 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-xs">Export JSON</div>
                  <div className="text-[10px] text-zinc-500">Structured data format</div>
                </div>
              </button>
            </div>

            <div className="border-t border-zinc-800 px-3 py-2">
              <p className="text-[10px] text-zinc-600">
                Exporting{' '}
                <span className="text-zinc-400 font-mono">{getFilteredUsageLogs().length}</span>{' '}
                records · {dateRange.toUpperCase()} window
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
