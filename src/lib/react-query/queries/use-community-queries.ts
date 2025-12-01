/**
 * Queries relacionadas con comunidad
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { queryKeys } from "../keys";
import { QUERY_LIMITS } from "../constants";
import { communityService } from "@/lib/firebase/community";
import { logger } from "@/lib/utils/logger";
import type { CommunityFilters } from "../types";
import type { QueryDocumentSnapshot } from "firebase/firestore";

/**
 * Hook para obtener posts de comunidad con paginación infinita
 */
export function useCommunityPosts(filters?: CommunityFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.community.list(filters),
    queryFn: async ({ pageParam = null }) => {
      logger.debug('Fetching community posts page', { filters, pageParam: !!pageParam });
      return await communityService.getPosts({
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
 * Hook para obtener un post de comunidad específico
 */
export function useCommunityPost(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.community.detail(postId || ''),
    queryFn: async () => {
      if (!postId) {
        throw new Error('ID de post requerido');
      }

      logger.debug('Fetching community post', { postId });
      const post = await communityService.getPost(postId);
      
      if (!post) {
        throw new Error('Post no encontrado');
      }
      
      return post;
    },
    enabled: !!postId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para obtener comentarios de un post de comunidad
 */
export function useCommunityPostComments(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.community.commentsList(postId || ''),
    queryFn: async () => {
      if (!postId) {
        throw new Error('ID de post requerido');
      }

      logger.debug('Fetching community post comments', { postId });
      return await communityService.getPostComments(postId);
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para verificar si un post de comunidad está liked
 */
export function useIsCommunityPostLiked(postId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.community.likeStatus(postId || '', user?.uid || ''),
    queryFn: async () => {
      if (!postId || !user?.uid) {
        return false;
      }

      return await communityService.isPostLiked(user.uid, postId);
    },
    enabled: !!postId && !!user?.uid,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

