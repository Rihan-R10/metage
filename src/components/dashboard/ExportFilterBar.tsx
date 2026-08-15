import React from 'react';
import { useTokenStore, type DateRange } from '@/store/useTokenStore';

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '24H', value: '24H' },
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
  { label: '90D', value: '90D' },
  { label: 'YTD', value: 'ytd' },
  { label: 'ALL', value: 'ALL' },
];

export const ExportFilterBar: React.FC = () => {
  // 1. Select only stable primitives from the store
  const dateRange = useTokenStore((state) => state.dateRange);
  const setDateRange = useTokenStore((state) => state.setDateRange);

  // 2. Fetch the filtered logs safely outside of the reactive selector hook
  const logs = useTokenStore.getState().getFilteredUsageLogs();

  const exportCSV = () => {
    const headers = ['ID', 'Provider', 'Model', 'Timestamp', 'Prompt Tokens', 'Completion Tokens', 'Cost'];
    const currentLogs = useTokenStore.getState().getFilteredUsageLogs();
    
    const rows = currentLogs.map((log) => [
      log.id,
      log.providerId,
      log.model || '',
      log.timestamp,
      log.promptTokens ?? log.inputTokens ?? 0,
      log.completionTokens ?? log.outputTokens ?? 0,
      log.cost ?? 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `usage_logs_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-400">Timeframe:</span>
        <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setDateRange(opt.value);
              }}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                dateRange === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={exportCSV}
        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
      >
        Export CSV
      </button>
    </div>
  );
};