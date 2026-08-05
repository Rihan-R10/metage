'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFormattedDate } from '@/hooks/useFormattedDate';
import { MOCK_REFERENCE_NOW } from '@/lib/mockData';
import { useTokenStore } from '@/store/useTokenStore';
import type { ProviderId, UsageLog } from '@/types';
import { cn } from '@/lib/utils';

const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  groq: 'Groq',
  openrouter: 'OpenRouter',
};

type Timeframe = '24h' | '7d' | '30d';

const TIMEFRAME_HOURS: Record<Timeframe, number> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
};

function formatNumber(value: number | undefined): string {
  if (value === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('en-US').format(value);
}

function formatCost(value: number | undefined): string {
  if (value === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

const LOG_TIMESTAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

function TimestampCell({ timestamp }: { timestamp: string }) {
  const formatted = useFormattedDate(timestamp, LOG_TIMESTAMP_OPTIONS);
  return <>{formatted}</>;
}

function filterLogsByTimeframe(logs: UsageLog[], timeframe: Timeframe): UsageLog[] {
  const referenceNow = new Date(MOCK_REFERENCE_NOW).getTime();
  const cutoff = referenceNow - TIMEFRAME_HOURS[timeframe] * 60 * 60 * 1000;
  return logs.filter((log) => new Date(log.timestamp).getTime() >= cutoff);
}

export function UsageTable() {
  const usageLogs = useTokenStore((state) => state.usageLogs);
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');

  const filteredLogs = useMemo(
    () => filterLogsByTimeframe(usageLogs, timeframe),
    [usageLogs, timeframe]
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Usage Logs
        </h2>

        <div className="flex items-center gap-2">
          {(['24h', '7d', '30d'] as Timeframe[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTimeframe(tab)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                timeframe === tab
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-800 bg-slate-950 text-zinc-500 hover:border-slate-700 hover:text-zinc-300'
              )}
            >
              {tab}
            </button>
          ))}
          <span className="ml-2 text-sm text-zinc-600">
            {filteredLogs.length} entries
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-[#09090b]">
              <tr>
                {[
                  'Timestamp',
                  'Provider',
                  'Model',
                  'Input',
                  'Output',
                  'Total',
                  'Requests',
                  'Cost',
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              <AnimatePresence mode="popLayout">
                {filteredLogs.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-zinc-500"
                    >
                      No usage logs for this timeframe.
                    </td>
                  </motion.tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.25, delay: index * 0.02 }}
                      className="transition hover:bg-slate-900/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-300">
                        <TimestampCell timestamp={log.timestamp} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="rounded-md border border-slate-800 bg-[#09090b] px-2 py-1 text-xs font-medium text-emerald-400">
                          {PROVIDER_LABELS[log.providerId]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-400">
                        {log.model ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-zinc-300">
                        {formatNumber(log.inputTokens)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-zinc-300">
                        {formatNumber(log.outputTokens)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-zinc-200">
                        {formatNumber(log.totalTokens)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-zinc-300">
                        {formatNumber(log.requests)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-zinc-300">
                        {formatCost(log.cost)}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
