'use client';

import { useTokenStore } from '@/store/useTokenStore';
import type { ProviderId } from '@/types';

const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  openrouter: 'OpenRouter',
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

export function UsageLogTable() {
  const usageLogs = useTokenStore((state) => state.usageLogs);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Usage Logs
        </h2>
        <span className="text-sm text-zinc-600">
          {usageLogs.length} entries
        </span>
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
              {usageLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    No usage logs yet. Unlock the vault, add API keys, and sync
                    providers to populate telemetry.
                  </td>
                </tr>
              ) : (
                usageLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition hover:bg-slate-900/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-300">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }).format(new Date(log.timestamp))}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
