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

const containerVariants = {
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 relative">
      <DashboardHeader />

      {/* Top Status & Vault Action Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-4 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> AES-256 Secured Vault
          </span>
          <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-mono">
            Keys Configured: {vaultStatus.keysConfiguredCount}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-mono">
            Passcode: {masterPasscode ? 'Unlocked' : 'Default / Locked'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Mock / Live Mode */}
          <button
            type="button"
            onClick={toggleMockMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isMockMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Mode: {isMockMode ? 'Mock Data (Demo)' : 'Live Vault'}
          </button>

          {/* API Key Modal Opener */}
          <button
            type="button"
            onClick={() => setIsApiKeyModalOpen(true)}
            className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Key className="w-3.5 h-3.5" /> API Keys & Vault
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
          className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-200">Monthly Budget Cap</span>
              {budgetUsagePercent >= 90 && (
                <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-mono">
                  <AlertTriangle className="w-3 h-3" /> Near Threshold
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Projected spend is{' '}
              <span className="text-zinc-200 font-mono font-medium">
                {formatCurrency(metrics.projectedMonthlySpend)}
              </span>{' '}
              of your{' '}
              <span className="text-zinc-200 font-mono font-medium">
                {formatCurrency(monthlyBudget)}
              </span>{' '}
              monthly limit.
            </p>
          </div>

          <div className="w-full md:w-72 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
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
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
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
          <ExportFilterBar />
        </motion.div>

        {/* Telemetry Charts (Timeline, Spend Share, SLA Gauges) */}
        <motion.div variants={sectionVariants}>
          <DashboardCharts />
        </motion.div>

        {/* Provider Health */}
        <motion.div variants={sectionVariants}>
          <ProviderHealth />
        </motion.div>

        {/* Usage Logs Table */}
        <motion.div variants={sectionVariants}>
          <UsageTable />
        </motion.div>
      </motion.main>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
}
