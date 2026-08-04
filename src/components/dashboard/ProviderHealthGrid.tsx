'use client';

import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { useTokenStore, type ProviderHealth } from '@/store/useTokenStore';
import { cn } from '@/lib/utils';

const HEALTH_CONFIG: Record<
  ProviderHealth,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  online: {
    label: 'Online',
    icon: CheckCircle2,
    className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  degraded: {
    label: 'Degraded',
    icon: AlertTriangle,
    className: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  offline: {
    label: 'Offline',
    icon: XCircle,
    className: 'text-red-400 border-red-500/30 bg-red-500/10',
  },
  unknown: {
    label: 'Unknown',
    icon: HelpCircle,
    className: 'text-zinc-400 border-slate-700 bg-slate-900',
  },
};

function formatMetric(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('en-US').format(value);
}

export function ProviderHealthGrid() {
  const accounts = useTokenStore((state) => state.accounts);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Provider Health
        </h2>
        <span className="text-sm text-zinc-600">
          {accounts.length} providers monitored
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => {
          const health = HEALTH_CONFIG[account.health];
          const HealthIcon = health.icon;
          const rateLimit = account.rateLimit;

          return (
            <article
              key={account.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-zinc-100">{account.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-600">
                    {account.providerId}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                    health.className
                  )}
                >
                  <HealthIcon className="h-3.5 w-3.5" />
                  {health.label}
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-slate-800 bg-[#09090b] px-3 py-2">
                  <dt className="text-xs text-zinc-600">Requests</dt>
                  <dd className="mt-1 font-medium text-zinc-200">
                    {formatMetric(rateLimit?.requestsRemaining)}
                    {rateLimit?.requestsLimit != null && (
                      <span className="text-zinc-600">
                        {' '}
                        / {formatMetric(rateLimit.requestsLimit)}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#09090b] px-3 py-2">
                  <dt className="text-xs text-zinc-600">Tokens</dt>
                  <dd className="mt-1 font-medium text-zinc-200">
                    {formatMetric(rateLimit?.tokensRemaining)}
                    {rateLimit?.tokensLimit != null && (
                      <span className="text-zinc-600">
                        {' '}
                        / {formatMetric(rateLimit.tokensLimit)}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#09090b] px-3 py-2">
                  <dt className="text-xs text-zinc-600">Credits</dt>
                  <dd className="mt-1 font-medium text-zinc-200">
                    {formatMetric(rateLimit?.creditsRemaining)}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#09090b] px-3 py-2">
                  <dt className="text-xs text-zinc-600">Last Polled</dt>
                  <dd className="mt-1 font-medium text-zinc-200">
                    {rateLimit?.polledAt
                      ? new Intl.DateTimeFormat('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        }).format(new Date(rateLimit.polledAt))
                      : '—'}
                  </dd>
                </div>
              </dl>

              {account.errorMessage && (
                <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                  {account.errorMessage}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
