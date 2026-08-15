import React from 'react';
import type { ProviderAccount } from '@/store/useTokenStore';
import { useTokenStore } from '@/store/useTokenStore';

const STATUS_CONFIG: Record<string, { label: string; badgeColor: string; dotColor: string }> = {
  NORMAL: {
    label: 'Normal',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dotColor: 'bg-emerald-400',
  },
  WARN: {
    label: 'Warning',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dotColor: 'bg-amber-400',
  },
  EXHAUSTED: {
    label: 'Exhausted',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    dotColor: 'bg-rose-400',
  },
  healthy: {
    label: 'Healthy',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dotColor: 'bg-emerald-400',
  },
};

interface ProviderHealthProps {
  accounts?: ProviderAccount[];
}

export const ProviderHealth: React.FC<ProviderHealthProps> = ({ accounts: propAccounts }) => {
  const storeAccounts = useTokenStore((state) => state.accounts);
  const accounts = propAccounts ?? storeAccounts;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Provider Health & Quotas</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const config = STATUS_CONFIG[account.status] ?? STATUS_CONFIG.NORMAL;
          const rateLimit = account.rateLimit || {};

          const reqPercent =
            rateLimit.requestsLimit && rateLimit.requestsRemaining !== null && rateLimit.requestsRemaining !== undefined
              ? Math.round((rateLimit.requestsRemaining / rateLimit.requestsLimit) * 100)
              : null;

          const tokPercent =
            rateLimit.tokensLimit && rateLimit.tokensRemaining !== null && rateLimit.tokensRemaining !== undefined
              ? Math.round((rateLimit.tokensRemaining / rateLimit.tokensLimit) * 100)
              : null;

          return (
            <div
              key={account.id}
              className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-4 transition-all hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">{account.name}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.badgeColor}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
                    {config.label}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs text-slate-400">
                  {rateLimit.requestsLimit !== null && rateLimit.requestsLimit !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Requests Left</span>
                        <span className="text-slate-200">
                          {rateLimit.requestsRemaining} / {rateLimit.requestsLimit}
                        </span>
                      </div>
                      {reqPercent !== null && (
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, reqPercent))}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {rateLimit.tokensLimit !== null && rateLimit.tokensLimit !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Tokens Left</span>
                        <span className="text-slate-200">
                          {rateLimit.tokensRemaining?.toLocaleString()} / {rateLimit.tokensLimit?.toLocaleString()}
                        </span>
                      </div>
                      {tokPercent !== null && (
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, tokPercent))}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {rateLimit.resetAt && (
                <div className="mt-4 border-t border-slate-800/80 pt-2 text-[11px] text-slate-500">
                  Resets in/at: <span className="text-slate-400">{rateLimit.resetAt}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};