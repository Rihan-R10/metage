'use client';

import { motion } from 'framer-motion';
import { useTokenStore } from '@/store/useTokenStore';
import { useFormattedDate } from '@/hooks/useFormattedDate';
import type { ProviderStatus } from '@/types';
import { cn } from '@/lib/utils';

const POLLED_AT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
};

function LastPolledTime({ polledAt }: { polledAt?: string | null }) {
  const formatted = useFormattedDate(polledAt, POLLED_AT_OPTIONS, '—');
  return <>{formatted}</>;
}


const STATUS_CONFIG: Record<
  ProviderStatus,
  { label: string; dotClass: string; badgeClass: string; pulse: boolean }
> = {
  NORMAL: {
    label: 'Normal',
    dotClass: 'bg-emerald-400',
    badgeClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    pulse: true,
  },
  WARN: {
    label: 'Warning',
    dotClass: 'bg-amber-400',
    badgeClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    pulse: true,
  },
  EXHAUSTED: {
    label: 'Exhausted',
    dotClass: 'bg-red-400',
    badgeClass: 'text-red-400 border-red-500/30 bg-red-500/10',
    pulse: true,
  },
};

function formatMetric(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('en-US').format(value);
}

function StatusDot({ status }: { status: ProviderStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span className="relative flex h-2.5 w-2.5">
      {config.pulse && (
        <motion.span
          className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', config.dotClass)}
          animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', config.dotClass)} />
    </span>
  );
}

export function ProviderHealth() {
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
        {accounts.map((account, index) => {
          const status = STATUS_CONFIG[account.status];
          const rateLimit = account.rateLimit;

          return (
            <motion.article
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.08 }}
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
                    'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
                    status.badgeClass
                  )}
                >
                  <StatusDot status={account.status} />
                  {status.label}
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
                    <LastPolledTime polledAt={rateLimit?.polledAt} />
                  </dd>
                </div>
              </dl>

              {account.errorMessage && (
                <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                  {account.errorMessage}
                </p>
              )}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
