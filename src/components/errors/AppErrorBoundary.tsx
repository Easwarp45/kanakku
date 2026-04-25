import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      // Only store the message for potential dev-mode display.
      // Never render raw stack traces or DB details to end users.
      message: error.message || 'Unexpected error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // SEC-4: Only log to console in development to prevent leaking internals.
    // In production, wire this to Sentry or another error tracking service.
    if (import.meta.env.DEV) {
      console.error('Unhandled React error:', error, info);
    }
    // TODO: Sentry integration
    // if (import.meta.env.PROD) {
    //   import('@sentry/react').then(({ captureException }) =>
    //     captureException(error, { contexts: { react: { componentStack: info.componentStack } } })
    //   );
    // }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-full bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-6">
          <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The app hit an unexpected error. Reload to continue.
          </p>
          {/* SEC-4: Only show raw error message in development */}
          {import.meta.env.DEV && (
            <p className="mt-3 text-xs text-destructive break-words font-mono">
              {this.state.message}
            </p>
          )}
          <Button className="mt-5 w-full" onClick={this.handleReload}>
            Reload App
          </Button>
        </div>
      </div>
    );
  }
}
