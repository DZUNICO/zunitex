/**
 * @deprecated Este archivo se mantiene solo para compatibilidad.
 * Por favor, importa desde los módulos específicos:
 * - Queries: from '@/lib/react-query/queries'
 * - Mutations: from '@/lib/react-query/mutations'
 * - Keys: from '@/lib/react-query/keys'
 * - Types: from '@/lib/react-query/types'
 * 
 * Este archivo será eliminado en una versión futura.
 */

// Re-export queries desde módulos organizados
export * from './queries';

// Re-export mutations desde módulos organizados
export * from './mutations';

// Re-export keys y types para compatibilidad
export { queryKeys } from './keys';
export type { ProjectFilters, BlogFilters, ResourceFilters, ReviewFilters, CommunityFilters } from './types';
