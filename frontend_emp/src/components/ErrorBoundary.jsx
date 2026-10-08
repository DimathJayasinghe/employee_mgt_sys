import React from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import sessionManager from '../services/sessionManager';

/**
 * ============================================================================
 * React Error Boundary (Graceful Frontend Crash Protection)
 * ============================================================================
 * Prevents unhandled render errors from causing a blank white screen.
 * Displays a recovery dashboard with options to reload or reset session.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('🚨 [React Error Boundary Caught Crash]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    sessionManager.clearSession();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              The application encountered an unexpected error. You can try refreshing the page or signing in again.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out & Reset
              </button>
            </div>

            {isDev && this.state.error && (
              <details className="text-left bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 text-xs text-rose-300 overflow-auto max-h-48">
                <summary className="cursor-pointer font-semibold text-slate-400 hover:text-slate-200">
                  Developer Error Details
                </summary>
                <pre className="mt-2 text-[11px] whitespace-pre-wrap font-mono">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
