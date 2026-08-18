'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[HUD ErrorBoundary] Widget crashed:', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-xl border border-cyan-500/40 bg-[#090a0f] p-5 shadow-lg shadow-cyan-500/5"
      >
        <div className="flex items-center gap-2 text-cyan-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-semibold">
            {this.props.title ?? 'Telemetry Widget Unavailable'}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-zinc-400">
          {this.props.fallbackMessage ??
            'This HUD widget encountered a rendering error and has been isolated. The rest of your dashboard remains operational.'}
        </p>
        {this.state.error?.message && (
          <p className="w-full truncate rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 font-mono text-[11px] text-zinc-500">
            {this.state.error.message}
          </p>
        )}
        <button
          type="button"
          onClick={this.handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry Widget
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
