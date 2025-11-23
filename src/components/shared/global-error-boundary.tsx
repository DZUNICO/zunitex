'use client';

import { ErrorBoundary } from './error-boundary';
import { GlobalErrorFallback } from './error-fallbacks';
import { logger } from '@/lib/utils/logger';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  return (
    <ErrorBoundary
      scope="global"
      fallback={(reset) => <GlobalErrorFallback onReset={reset} />}
      onError={(error, errorInfo) => {
        logger.error('Global app error', error, {
          component: 'GlobalErrorBoundary',
          scope: 'global',
          errorInfo: {
            componentStack: errorInfo.componentStack,
          },
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

