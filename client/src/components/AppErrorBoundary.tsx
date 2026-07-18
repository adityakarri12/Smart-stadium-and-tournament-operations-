import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Application error boundary caught an error:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          aria-live="assertive"
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            textAlign: 'center',
            background: 'radial-gradient(circle at top, rgba(0, 240, 255, 0.16), transparent 32%), var(--bg-main)',
          }}
        >
          <section className="glass-panel" style={{ maxWidth: '640px', padding: '2rem', borderRadius: '1.5rem' }}>
            <FiAlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} aria-hidden="true" />
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Operational UI recovered from an unexpected error</h1>
            <p className="text-muted" style={{ marginTop: '0.75rem', lineHeight: 1.7 }}>
              The stadium control surface hit an application error. Refresh to restore the live dashboard, or return after the backend recovers.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={this.handleReload}
              style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FiRefreshCw /> Reload platform
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
