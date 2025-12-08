/**
 * Configuración centralizada de límites para infinite queries
 * Previene memory leaks limitando el número de páginas cargadas
 */

// Configuración centralizada de límites
export const QUERY_LIMITS = {
  ITEMS_PER_PAGE: 10,
  MAX_PAGES: 10,
  MAX_ITEMS: 100, // ITEMS_PER_PAGE × MAX_PAGES
  STALE_TIME: 5 * 60 * 1000, // 5 minutos
  GC_TIME: 5 * 60 * 1000, // 5 minutos
} as const;

export const QUERY_MESSAGES = {
  NEAR_LIMIT: 'Has cargado muchos elementos. Considera refinar tu búsqueda.',
  AT_LIMIT: 'Límite alcanzado (100 items). Refina tu búsqueda para ver más.',
} as const;





