'use client';

import { useState, useEffect } from 'react';
import { Activity, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { useFormattedDate } from '@/hooks/useFormattedDate';
import { useTokenStore } from '@/store/useTokenStore';
import { ApiKeyModal } from '@/components/dashboard/ApiKeyModal';
import { cn } from '@/lib/utils';

const SYNC_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
};

export function Header() {
  const isPolling = useTokenStore((state) => state.isPolling);
  const lastRefreshAt = useTokenStore((state) => state.lastRefreshAt);
  const pollAllProviders = useTokenStore((state) => state.pollAllProviders);
  const hasKeys = useTokenStore((state) => state.hasKeys);
  const checkKeysStatus = useTokenStore((state) => state.checkKeysStatus);

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  useEffect(() => {
    checkKeysStatus();
  }, [checkKeysStatus]);

  const formattedRefresh = useFormattedDate(
    lastRefreshAt,
    SYNC_TIME_OPTIONS,
    'Never'
  );

  return (
    <>
      <header className="border-b border-slate-800 bg-[#09090b]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
                Hunch
              </h1>
              <p className="text-sm text-zinc-500">
                Multi-provider API usage & rate limits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dynamic Key Status Badge */}
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(true)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                hasKeys
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              )}
            >
              {hasKeys ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Keys Encrypted & Ready</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                  </span>
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>No Keys Configured</span>
                </>
              )}
            </button>

            <div className="hidden items-center gap-2 text-sm text-zinc-500 md:flex">
              <span className="text-zinc-700">·</span>
              <span suppressHydrationWarning>
                Last sync {formattedRefresh}
              </span>
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

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </>
  );
}

export { Header as DashboardHeader };
