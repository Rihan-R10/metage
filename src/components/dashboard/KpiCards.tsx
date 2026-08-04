'use client';

import { Coins, Gauge, Server, Zap } from 'lucide-react';
import { useTokenStore } from '@/store/useTokenStore';
import { cn } from '@/lib/utils';

function formatNumber(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return new Intl.NumberFormat('en-US').format(value);
}

const KPI_CONFIG = [
  {
    key: 'requestsRemaining' as const,
    label: 'Requests Remaining',
    icon: Zap,
    accent: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
  },
  {
    key: 'tokensRemaining' as const,
    label: 'Tokens Remaining',
    icon: Gauge,
    accent: 'text-sky-400',
    border: 'border-sky-500/20',
    bg: 'bg-sky-500/5',
  },
  {
    key: 'creditsRemaining' as const,
    label: 'Credits Remaining',
    icon: Coins,
    accent: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
  },
  {
    key: 'providersOnline' as const,
    label: 'Providers Online',
    icon: Server,
    accent: 'text-violet-400',
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/5',
    format: (kpis: ReturnType<ReturnType<typeof useTokenStore.getState>['getKpis']>) =>
      `${kpis.providersOnline}/${kpis.totalProviders}`,
  },
];

export function KpiCards() {
  const getKpis = useTokenStore((state) => state.getKpis);
  const kpis = getKpis();

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon;
        const value =
          kpi.key === 'providersOnline'
            ? kpi.format!(kpis)
            : formatNumber(kpis[kpi.key]);

        return (
          <article
            key={kpi.label}
            className={cn(
              'rounded-xl border border-slate-800 bg-slate-950/60 p-5',
              kpi.border
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">{kpi.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
                  {value}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800',
                  kpi.bg
                )}
              >
                <Icon className={cn('h-5 w-5', kpi.accent)} />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
