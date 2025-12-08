/**
 * Queries relacionadas con recursos
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { QUERY_LIMITS } from "../constants";
import { resourcesService } from "@/lib/firebase/resources";
import { logger } from "@/lib/utils/logger";
import type { ResourceFilters } from "@/types/resources";
import type { QueryDocumentSnapshot } from "firebase/firestore";

/**
 * Hook para obtener recursos con paginación infinita
 */
export function useResources(filters?: ResourceFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.resources.list(filters),
    queryFn: async ({ pageParam = null }) => {
      logger.debug('Fetching resources page', { filters, pageParam: !!pageParam });
      return await resourcesService.getResources({
        limit: 10,
        cursor: pageParam as QueryDocumentSnapshot | null,
        filters,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as QueryDocumentSnapshot | null,
    maxPages: QUERY_LIMITS.MAX_PAGES,
    staleTime: QUERY_LIMITS.STALE_TIME,
    gcTime: QUERY_LIMITS.GC_TIME,
  });
}

/**
 * Hook para obtener un recurso específico
 */
export function useResource(resourceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.resources.detail(resourceId || ''),
    queryFn: async () => {
      if (!resourceId) {
        throw new Error('ID de recurso requerido');
      }

      logger.debug('Fetching resource', { resourceId });
      const resource = await resourcesService.getResource(resourceId);
      
      if (!resource) {
        throw new Error('Recurso no encontrado');
      }
      
      return resource;
    },
    enabled: !!resourceId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

