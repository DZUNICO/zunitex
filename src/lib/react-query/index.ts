/**
 * Re-exports centralizados para mantener compatibilidad
 * Este archivo permite importar desde '@/lib/react-query/queries' y '@/lib/react-query/mutations'
 * mientras se migra el código
 */

// Re-export queries
export * from './queries';

// Re-export mutations
export * from './mutations';

// Re-export keys y types
export { queryKeys } from './keys';
export type { ProjectFilters, BlogFilters, ResourceFilters, ReviewFilters, CommunityFilters } from './types';

