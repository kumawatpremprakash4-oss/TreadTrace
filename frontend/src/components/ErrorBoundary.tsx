/**
 * TreadTrace React Error Boundary.
 * Prevents render-time JavaScript exceptions from causing a blank/black screen.
 * Catches any React component tree error and shows a styled recovery UI.
 */

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<Record<string, unknown>>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<Record<string, unknown>>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[TreadTrace] Render error caught by ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07080A] text-[#F5F5F5] flex flex-col items-center justify-center p-8 font-mono">
          <div className="max-w-xl w-full bg-[#101216] border border-[#E10600]/40 rounded-xl p-8 space-y-6 shadow-2xl">
            {/* Error header */}
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-[#E10600] animate-pulse" />
              <span className="text-[10px] font-bold text-[#E10600] uppercase tracking-widest">
                Runtime Engine Fault
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase text-white tracking-tight">
              DASHBOARD RENDER FAULT
            </h1>
            <p className="text-sm text-[#9A9FA8] leading-relaxed">
              A rendering error was intercepted by the safety module. The previous
              session state may have contained unexpected data. Click below to
              reinitialise the dashboard.
            </p>
            {this.state.error && (
              <div className="p-3 rounded bg-[#08090B] border border-[#1E232B] text-[11px] text-[#606775] break-words">
                <span className="text-[#FFB000] font-bold">FAULT:</span>{" "}
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="w-full py-3 rounded-lg bg-[#E10600] hover:bg-[#FF2A1A] text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              ↺ REINITIALISE DASHBOARD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
