'use client';

import { Activity, RefreshCw, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTokenStore } from '@/store/useTokenStore';
import { cn } from '@/lib/utils';

export function DashboardHeader() {
  const isPolling = useTokenStore((state) => state.isPolling);
  const lastRefreshAt = useTokenStore((state) => state.lastRefreshAt);
  const masterPasscode = useTokenStore((state) => state.masterPasscode);
  const pollAllProviders = useTokenStore((state) => state.pollAllProviders);

  // Defer time formatting to the client to prevent SSR hydration mismatch.
  // The server has no timezone/locale context matching the user's browser.
  const [formattedRefresh, setFormattedRefresh] = useState<string>('Never');

  useEffect(() => {
    setFormattedRefresh(
      lastRefreshAt
        ? new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
          }).format(new Date(lastRefreshAt))
        : 'Never'
    );
  }, [lastRefreshAt]);

  return (
    <header className="border-b border-slate-800 bg-[#09090b]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
              TokenDash
            </h1>
            <p className="text-sm text-zinc-500">
              Multi-provider API usage & rate limits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-sm text-zinc-500 sm:flex">
            <Shield
              className={cn(
                'h-4 w-4',
                masterPasscode ? 'text-emerald-400' : 'text-zinc-600'
              )}
            />
            <span>
              Vault {masterPasscode ? 'unlocked' : 'locked'}
            </span>
            <span className="text-zinc-700">·</span>
            <span>Last sync {formattedRefresh}</span>
          </div>

          <button
            type="button"
            onClick={() => void pollAllProviders()}
            disabled={isPolling}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-emerald-500/40 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <RefreshCw
              className={cn('h-4 w-4', isPolling && 'animate-spin text-emerald-400')}
            />
            {isPolling ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      </div>
    </header>
  );
}
