import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Application ErrorBoundary Caught]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/app';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            An unexpected client error occurred while rendering this page. The error has been intercepted safely to prevent an application crash.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Page
            </button>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition"
            >
              <Home className="w-3.5 h-3.5" /> Return to Dashboard
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-6 p-4 max-w-2xl w-full bg-slate-900 text-slate-200 rounded-xl text-left font-mono text-[11px] overflow-x-auto">
              <p className="text-rose-400 font-bold mb-1">{this.state.error.toString()}</p>
              <pre className="text-slate-400 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
