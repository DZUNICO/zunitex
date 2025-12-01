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

export interface ResourceFilters {
  userId?: string;
  type?: Resource['type'];
  category?: string;
}

export interface ReviewFilters {
  userId?: string;
  projectId?: string;
  reviewedUserId?: string;
  reviewerId?: string;
  category?: string;
  minRating?: number;
}

export interface CommunityFilters {
  category?: string;
  userId?: string;
}

