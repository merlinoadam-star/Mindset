import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Catches any unhandled render error in the tree below it and shows
 * a friendly recovery screen instead of a white page. The user can
 * tap "Reload" to hard-refresh, or "Go home" to navigate to /.
 *
 * Place this high in the tree (wrapping <App />) so it catches
 * errors from any page or component.
 */

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-800 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-elevated text-center">
          <div className="text-5xl mb-4">😵</div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            The app hit an unexpected error. Your data is safe — try
            reloading.
          </p>

          {this.state.error && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-slate-500 cursor-pointer font-semibold">
                Technical details
              </summary>
              <pre className="mt-2 text-[10px] text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-32">
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
            >
              Go home
            </button>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 inline-flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} /> Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
