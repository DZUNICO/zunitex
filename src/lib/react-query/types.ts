/**
 * Types para filtros de queries
 */

import type { Resource } from '@/types/resources';

export interface ProjectFilters {
  userId?: string;
  status?: string;
  category?: string;
}

export interface BlogFilters {
  category?: string;
  status?: 'published' | 'draft';
}

// ResourceFilters y ReviewFilters están definidos en src/types/
export type { ResourceFilters } from '@/types/resources';
export type { ReviewFilters } from '@/types/reviews';

// CommunityFilters está definido en src/types/community.ts
export type { CommunityFilters } from '@/types/community';

