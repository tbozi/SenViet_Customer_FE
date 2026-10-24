import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary caught an error]:", error, errorInfo);
    }
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <AlertCircle size={32} />
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Đã có sự cố bất ngờ xảy ra
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Trang web gặp sự cố khi hiển thị nội dung này. Quý khách vui lòng thử tải lại trang hoặc quay về trang chủ.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gold/90 hover:shadow-md"
            >
              <RotateCcw size={16} />
              Tải lại trang
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Home size={16} />
              Về trang chủ
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
