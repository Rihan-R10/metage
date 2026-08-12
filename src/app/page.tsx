'use client';

import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  DollarSign,
  Flame,
  LineChart,
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Key,
  Trash2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ProviderHealth } from '@/components/dashboard/ProviderHealth';
import { UsageTable } from '@/components/dashboard/UsageTable';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { useTokenStore } from '@/store/useTokenStore';

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
  const [mounted, setMounted] = useState(false);
  const pollAllProviders = useTokenStore((state) => state.pollAllProviders);
  const masterPasscode = useTokenStore((state) => state.masterPasscode);
  const getMetricsSummary = useTokenStore((state) => state.getMetricsSummary);
  const isMockMode = useTokenStore((state) => state.isMockMode);
  const toggleMockMode = useTokenStore((state) => state.toggleMockMode);
  const getVaultStatus = useTokenStore((state) => state.getVaultStatus);
  const { saveApiKeys, setMasterPasscode, clearApiKeys } = useTokenStore();

  const metrics = getMetricsSummary
    ? getMetricsSummary()
    : { todaySpend: 0, activeBurnRate: 0, projectedMonthlySpend: 0, totalTokens: 0 };

  const vaultStatus = getVaultStatus
    ? getVaultStatus()
    : { isEncrypted: true, algorithm: 'AES-256-GCM', keysConfiguredCount: 0 };

  // Budget threshold (default $150/mo)
  const [monthlyBudget, setMonthlyBudget] = useState<number>(150);
  const budgetUsagePercent = Math.min(
    100,
    Math.round((metrics.projectedMonthlySpend / monthlyBudget) * 100)
  );

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [grokKey, setGrokKey] = useState('');
  const [passcode, setPasscode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (masterPasscode && pollAllProviders) {
      void pollAllProviders();
    }
  }, [masterPasscode, pollAllProviders]);

  const handleSave = async () => {
    setFeedback(null);
    if (passcode) {
      setMasterPasscode(passcode);
    }

    const result = await saveApiKeys({
      openai: openaiKey || undefined,
      anthropic: anthropicKey || undefined,
      openrouter: openrouterKey || undefined,
      grok: grokKey || undefined,
    });

    if (result && !result.success) {
      setFeedback({ type: 'error', text: result.error || 'Invalid key format.' });
    } else {
      setFeedback({
        type: 'success',
        text: 'API Keys validated and encrypted into local AES-256 vault!',
      });
      setTimeout(() => {
        setIsOpen(false);
        setFeedback(null);
      }, 1800);
    }
  };

  const handleClearVault = () => {
    clearApiKeys();
    setFeedback({ type: 'success', text: 'Encrypted vault keys cleared.' });
    setTimeout(() => {
      setFeedback(null);
    }, 1500);
  };

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

      {/* Top Action Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-4 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> AES-256 Secured Vault
          </span>
          <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-mono">
            Keys Configured: {mounted ? vaultStatus.keysConfiguredCount : 0}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Mock / Live Mode */}
          <button
            onClick={toggleMockMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isMockMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Mode: {isMockMode ? 'Mock Data' : 'Live Vault'}
          </button>

          {/* Modal Opener */}
          <button
            onClick={() => {
              setFeedback(null);
              setIsOpen(true);
            }}
            className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-4 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <Settings className="w-3.5 h-3.5" /> Vault Settings & Keys
          </button>
        </div>
      </div>

      <motion.main
        className="mx-auto max-w-7xl space-y-8 px-6 py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Budget Spend Cap Bar */}
        <motion.section
          variants={sectionVariants}
          className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-200">Monthly Budget Cap</span>
              {budgetUsagePercent >= 90 && (
                <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  <AlertTriangle className="w-3 h-3" /> Near Threshold
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Projected spend is <span className="text-zinc-200 font-mono font-medium">{formatCurrency(metrics.projectedMonthlySpend)}</span> of your <span className="text-zinc-200 font-mono font-medium">{formatCurrency(monthlyBudget)}</span> monthly limit.
            </p>
          </div>

          <div className="w-full md:w-72 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{budgetUsagePercent}% spent</span>
              <span className="text-zinc-400">{formatCurrency(monthlyBudget)}</span>
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

        {/* Top KPI Cards */}
        <motion.section
          variants={sectionVariants}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metricCards.map((card, index) => (
            <MetricCard key={card.label} {...card} index={index} />
          ))}
        </motion.section>

        {/* Telemetry Charts */}
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

      {/* Settings & Vault Key Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Configure Vault API Keys</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* In-app Feedback Banner */}
            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Master Vault Passcode
                </label>
                <input
                  type="password"
                  placeholder="Optional encryption passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-or-..."
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Grok (xAI) API Key
                </label>
                <input
                  type="password"
                  placeholder="xai-..."
                  value={grokKey}
                  onChange={(e) => setGrokKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Monthly Budget Cap ($ USD)
                </label>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(Number(e.target.value) || 100)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                onClick={handleClearVault}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Vault
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 text-xs transition"
                >
                  Save & Validate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}