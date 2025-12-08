import { Timestamp } from 'firebase/firestore';

/**
 * Convierte Timestamp de Firestore o Date a Date nativo
 * Maneja ambos casos de forma segura
 */
export function toDate(value: Timestamp | Date | undefined): Date {
  if (!value) return new Date();
  
  // Si ya es Date, retornar directamente
  if (value instanceof Date) {
    return value;
  }
  
  // Si es Timestamp de Firestore, convertir
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // Fallback: intentar crear Date desde el valor
  return new Date(value);
}

