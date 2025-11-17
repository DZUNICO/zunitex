/**
 * Sistema centralizado de manejo de errores
 * Reemplaza todos los console.error del proyecto
 */

import { logger } from './utils/logger';
import { getFirebaseErrorMessage } from './utils/logger';

export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

class ErrorHandler {
  /**
   * Maneja errores de manera centralizada
   */
  handleError(
    error: unknown,
    level: ErrorLevel = ErrorLevel.ERROR,
    context?: ErrorContext,
    showToast: boolean = true
  ): string {
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);
    
    const friendlyMessage = getFirebaseErrorMessage(error);

    // Logging según el nivel
    switch (level) {
      case ErrorLevel.CRITICAL:
        logger.error('CRITICAL ERROR', error as Error, context);
        // Aquí podrías enviar a un servicio externo como Sentry
        // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        //   Sentry.captureException(error, { extra: context });
        // }
        break;
      case ErrorLevel.ERROR:
        logger.error('Error', error as Error, context);
        break;
      case ErrorLevel.WARNING:
        logger.warn('Warning', context);
        break;
      case ErrorLevel.INFO:
        logger.info('Info', context);
        break;
    }

    return friendlyMessage;
  }

  /**
   * Maneja errores de red con retry logic
   */
  async handleNetworkError<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Verificar si es un error de red
        if (error instanceof Error && 
            (error.message.includes('network') || 
             error.message.includes('fetch') ||
             error.message.includes('timeout'))) {
          
          if (attempt < retries - 1) {
            logger.warn(`Network error, retrying... (${attempt + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
            continue;
          }
        }
        
        // Si no es error de red o se agotaron los reintentos, lanzar error
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Valida y sanitiza datos antes de enviar a Firestore
   */
  validateFirestoreData(data: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validar que no haya campos undefined
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) {
        errors.push(`Campo '${key}' no puede ser undefined`);
      }
    });

    // Validar tipos básicos
    if (data.createdAt && !(data.createdAt instanceof Date) && typeof data.createdAt !== 'string') {
      errors.push('createdAt debe ser Date o string');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const errorHandler = new ErrorHandler();

/**
 * Hook para usar el error handler en componentes
 * Nota: Este hook debe usarse dentro de componentes React
 */
export function useErrorHandler() {
  // Nota: useToast debe ser llamado dentro del componente que usa este hook
  // Por ahora, retornamos el errorHandler directamente
  // Los componentes pueden usar useToast directamente si necesitan mostrar notificaciones
  
  return {
    handleError: errorHandler.handleError.bind(errorHandler),
    handleNetworkError: errorHandler.handleNetworkError.bind(errorHandler),
    validateFirestoreData: errorHandler.validateFirestoreData.bind(errorHandler),
  };
}

