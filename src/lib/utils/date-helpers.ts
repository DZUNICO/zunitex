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
  
  // Si es Timestamp de Firestore, usar método toDate()
  // Timestamp siempre tiene el método toDate()
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // Este caso no debería ocurrir, pero TypeScript lo requiere
  // Si llegamos aquí, value es Timestamp pero sin toDate (imposible)
  // Retornamos fecha actual como fallback seguro
  return new Date();
}

