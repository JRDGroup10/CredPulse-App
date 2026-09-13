import React from "react";
import { reportError } from "../lib/errorMonitoring";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level safety net. Before this existed, an uncaught error anywhere in
 * the render tree unmounted the whole app and left a blank white screen —
 * no message, no way to recover short of the person guessing to reload,
 * and (until errorMonitoring.ts) not even a record that it happened. Wraps
 * <App/> in main.tsx.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <div className="max-w-sm text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h1 className="font-medium text-ink mb-1">Something went wrong</h1>
          <p className="text-body text-ink-muted mb-5">
            This has been reported. Reloading the page usually fixes it — your certificates are safe either way.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary text-body px-4 py-2">
            Reload
          </button>
        </div>
      </div>
    );
  }
}
