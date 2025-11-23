'use client';

import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';
import type { ErrorBoundaryScope } from '@/types/error-boundary';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((reset: () => void) => ReactNode);
  scope?: ErrorBoundaryScope;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error,
      errorInfo: null 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Actualizar estado con errorInfo para logging
    this.setState({ errorInfo });

    // Logging con contexto
    const scope = this.props.scope || 'component';
    logger.error(
      `ErrorBoundary [${scope}] caught an error`,
      error,
      {
        component: 'ErrorBoundary',
        scope,
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
      }
    );

    // Callback personalizado si existe
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        // Si el fallback es una función, pasarle el reset handler
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.handleReset);
        }
        return this.props.fallback;
      }

      // Fallback por defecto
      return (
        <Card className="p-8 m-4 max-w-2xl mx-auto">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-16 w-16 text-destructive" />
            <h2 className="text-2xl font-bold">Algo salió mal</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'Ocurrió un error inesperado'}
            </p>
            {this.props.scope && (
              <p className="text-sm text-muted-foreground">
                Área afectada: {this.props.scope === 'global' ? 'Aplicación completa' : 
                                this.props.scope === 'section' ? 'Sección' : 'Componente'}
              </p>
            )}
            <div className="flex gap-4 mt-4 flex-wrap justify-center">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar de nuevo
              </Button>
              <Link href="/">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

