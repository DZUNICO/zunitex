/**
 * Queries relacionadas con follows y reviews
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { QUERY_LIMITS } from "../constants";
import { followersService } from "@/lib/firebase/followers";
import { reviewsService } from "@/lib/firebase/reviews";
import { logger } from "@/lib/utils/logger";
import type { ReviewFilters } from "../types";
import type { QueryDocumentSnapshot } from "firebase/firestore";

/**
 * Hook para obtener seguidores de un usuario
 */
export function useFollowers(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.followers.followers(userId || ''),
    queryFn: async () => {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      logger.debug('Fetching followers', { userId });
      return await followersService.getUserFollowers(userId);
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para obtener usuarios que sigue un usuario
 */
export function useFollowing(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.followers.following(userId || ''),
    queryFn: async () => {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      logger.debug('Fetching following', { userId });
      return await followersService.getUserFollowing(userId);
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para verificar si un usuario sigue a otro
 */
export function useIsFollowing(followerId: string | undefined, followingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.followers.status(followerId || '', followingId || ''),
    queryFn: async () => {
      if (!followerId || !followingId) {
        return false;
      }

      return await followersService.isFollowing(followerId, followingId);
    },
    enabled: !!followerId && !!followingId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener reviews con paginación infinita
 */
export function useReviews(filters?: ReviewFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.reviews.list(filters),
    queryFn: async ({ pageParam = null }) => {
      logger.debug('Fetching reviews page', { filters, pageParam: !!pageParam });
      return await reviewsService.getReviews({
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
 * Hook para obtener un review específico
 */
export function useReview(reviewId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews.detail(reviewId || ''),
    queryFn: async () => {
      if (!reviewId) {
        throw new Error('ID de review requerido');
      }

      logger.debug('Fetching review', { reviewId });
      const review = await reviewsService.getReview(reviewId);
      
      if (!review) {
        throw new Error('Review no encontrado');
      }
      
      return review;
    },
    enabled: !!reviewId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener el rating de un usuario
 */
export function useUserRating(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-rating', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      return await reviewsService.getUserRating(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener comentarios de un proyecto
 */
export function useProjectComments(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.comments.list(projectId || ''),
    queryFn: async () => {
      if (!projectId) {
        throw new Error('ID de proyecto requerido');
      }

      logger.debug('Fetching project comments', { projectId });
      const { commentService } = await import('@/lib/firebase/comments');
      return await commentService.getProjectComments(projectId);
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutos - comentarios pueden cambiar frecuentemente
  });
}

