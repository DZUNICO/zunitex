/**
 * Tipos para Error Boundary
 */

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export type ErrorBoundaryScope = 'global' | 'section' | 'component';

