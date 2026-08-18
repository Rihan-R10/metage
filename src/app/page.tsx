'use client';

import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  DollarSign,
  Flame,
  LineChart,
  Zap,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Key,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ProviderHealth } from '@/components/dashboard/ProviderHealth';
import { UsageTable } from '@/components/dashboard/UsageTable';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { ApiKeyModal } from '@/components/dashboard/ApiKeyModal';
import { useTokenStore } from '@/store/useTokenStore';
import { useHasMounted } from '@/hooks/useHasMounted';
import { ExportFilterBar } from '@/components/dashboard/ExportFilterBar';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatTokens(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export default function Home() {
  const hasMounted = useHasMounted();

  const pollAllProviders = useTokenStore((state) => state.pollAllProviders);
  const masterPasscode = useTokenStore((state) => state.masterPasscode);
  const getMetricsSummary = useTokenStore((state) => state.getMetricsSummary);
  const isMockMode = useTokenStore((state) => state.isMockMode);
  const toggleMockMode = useTokenStore((state) => state.toggleMockMode);
  const getVaultStatus = useTokenStore((state) => state.getVaultStatus);
  const monthlyBudget = useTokenStore((state) => state.monthlyBudget);

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const rawMetrics = getMetricsSummary();
  const metrics = hasMounted
    ? rawMetrics
    : { todaySpend: 0, activeBurnRate: 0, projectedMonthlySpend: 0, totalTokens: 0 };

  const rawVaultStatus = getVaultStatus();
  const vaultStatus = hasMounted
    ? rawVaultStatus
    : { isEncrypted: true, algorithm: 'AES-256-GCM', keysConfiguredCount: 0 };

  const safeBudget = monthlyBudget > 0 ? monthlyBudget : 1;
  const budgetUsagePercent = Math.min(
    100,
    Math.max(0, Math.round((metrics.projectedMonthlySpend / safeBudget) * 100))
  );

  useEffect(() => {
    if (hasMounted && masterPasscode) {
      void pollAllProviders();
    }
  }, [hasMounted, masterPasscode, pollAllProviders]);

  const metricCards = [
    {
      label: "Today's Spend",
      value: formatCurrency(metrics.todaySpend),
      icon: DollarSign,
      accent: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
    },
    {
      label: 'Active Burn Rate',
      value: `${formatCurrency(metrics.activeBurnRate)}/hr`,
      icon: Flame,
      accent: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/5',
    },
    {
      label: 'Projected Monthly',
      value: formatCurrency(metrics.projectedMonthlySpend),
      icon: LineChart,
      accent: 'text-sky-400',
      border: 'border-sky-500/20',
      bg: 'bg-sky-500/5',
    },
    {
      label: 'Total Tokens',
      value: formatTokens(metrics.totalTokens),
      icon: Zap,
      accent: 'text-violet-400',
      border: 'border-violet-500/20',
      bg: 'bg-violet-500/5',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#09090b] text-zinc-100">
      <DashboardHeader />

      {/* Top Status & Vault Action Bar */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 px-6 pt-4 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> AES-256 Secured Vault
          </span>
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 font-mono text-xs text-zinc-400">
            Keys Configured: {vaultStatus.keysConfiguredCount}
          </span>
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 font-mono text-xs text-zinc-400">
            Passcode: {masterPasscode ? 'Unlocked' : 'Default / Locked'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Mock / Live Mode */}
          <button
            type="button"
            onClick={toggleMockMode}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isMockMode
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Mode: {isMockMode ? 'Mock Data (Demo)' : 'Live Vault'}
          </button>

          {/* API Key Modal Opener */}
          <button
            type="button"
            onClick={() => setIsApiKeyModalOpen(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Key className="h-3.5 w-3.5" /> API Keys & Vault
          </button>
        </div>
      </div>

      <motion.main
        className="mx-auto max-w-7xl space-y-8 px-6 py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Monthly Budget Cap Bar */}
        <motion.section
          variants={sectionVariants}
          className="flex flex-col items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-lg md:flex-row md:items-center"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-200">Monthly Budget Cap</span>
              {budgetUsagePercent >= 90 && (
                <span className="flex items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 font-mono text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3" /> Near Threshold
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Projected spend is{' '}
              <span className="font-mono font-medium text-zinc-200">
                {formatCurrency(metrics.projectedMonthlySpend)}
              </span>{' '}
              of your{' '}
              <span className="font-mono font-medium text-zinc-200">
                {formatCurrency(monthlyBudget)}
              </span>{' '}
              monthly limit.
            </p>
          </div>

          <div className="w-full space-y-1.5 md:w-72">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-zinc-400">Usage Progress</span>
              <span
                className={`font-semibold ${
                  budgetUsagePercent >= 90
                    ? 'text-red-400'
                    : budgetUsagePercent >= 75
                    ? 'text-amber-400'
                    : 'text-cyan-400'
                }`}
              >
                {budgetUsagePercent}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUsagePercent >= 90
                    ? 'bg-red-500'
                    : budgetUsagePercent >= 75
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${budgetUsagePercent}%` }}
              />
            </div>
          </div>
        </motion.section>

        {/* Top Metric KPI Cards */}
        <motion.section
          variants={sectionVariants}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metricCards.map((card, index) => (
            <MetricCard key={card.label} {...card} index={index} />
          ))}
        </motion.section>

        {/* Date Range Filter & Export Bar */}
        <motion.div variants={sectionVariants}>
          <ErrorBoundary title="Export & Filter Unavailable">
            <ExportFilterBar />
          </ErrorBoundary>
        </motion.div>

        {/* Telemetry Charts */}
        <motion.div variants={sectionVariants}>
          <ErrorBoundary title="Telemetry Charts Unavailable">
            <DashboardCharts />
          </ErrorBoundary>
        </motion.div>

        {/* Provider Health */}
        <motion.div variants={sectionVariants}>
          <ErrorBoundary title="Provider Health Unavailable">
            <ProviderHealth />
          </ErrorBoundary>
        </motion.div>

        {/* Usage Logs Table */}
        <motion.div variants={sectionVariants}>
          <ErrorBoundary title="Usage Logs Unavailable">
            <UsageTable />
          </ErrorBoundary>
        </motion.div>
      </motion.main>

      <ApiKeyModal
        key={isApiKeyModalOpen ? 'open' : 'closed'}
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
}