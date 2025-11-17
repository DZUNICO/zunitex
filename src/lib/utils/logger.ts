/**
 * Sistema centralizado de logging y manejo de errores
 * Reemplaza todos los console.log/error/warn del proyecto
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.isDevelopment && level === 'debug') {
      return; // No loguear debug en producción
    }

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'error':
        // En producción, enviar a servicio de logging externo
        if (error) {
          console.error(formattedMessage, error);
        } else {
          console.error(formattedMessage);
        }
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        if (this.isDevelopment) {
          console.info(formattedMessage);
        }
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage);
        }
        break;
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();

/**
 * Helper para manejar errores de Firebase y convertirlos en mensajes amigables
 */
export function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Errores de autenticación
    if (errorMessage.includes('auth/user-not-found')) {
      return 'No existe una cuenta con este email';
    }
    if (errorMessage.includes('auth/wrong-password') || errorMessage.includes('auth/invalid-credential')) {
      return 'Credenciales inválidas. Verifica tu email y contraseña';
    }
    if (errorMessage.includes('auth/email-already-in-use')) {
      return 'Este correo electrónico ya está registrado';
    }
    if (errorMessage.includes('auth/weak-password')) {
      return 'La contraseña es demasiado débil';
    }
    if (errorMessage.includes('auth/too-many-requests')) {
      return 'Demasiados intentos fallidos. Intenta más tarde';
    }
    
    // Errores de Firestore
    if (errorMessage.includes('permission-denied')) {
      return 'No tienes permiso para realizar esta acción';
    }
    if (errorMessage.includes('not-found')) {
      return 'El recurso solicitado no fue encontrado';
    }
    if (errorMessage.includes('unavailable')) {
      return 'El servicio no está disponible temporalmente';
    }
    
    // Errores de Storage
    if (errorMessage.includes('storage/unauthorized')) {
      return 'No tienes permiso para realizar esta acción';
    }
    if (errorMessage.includes('storage/object-not-found')) {
      return 'El archivo no fue encontrado';
    }
    
    // Error genérico
    return error.message || 'Ocurrió un error inesperado';
  }
  
  return 'Ocurrió un error inesperado';
}

