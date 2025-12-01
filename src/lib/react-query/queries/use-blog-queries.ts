/**
 * Queries relacionadas con blog
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { queryKeys } from "../keys";
import { QUERY_LIMITS } from "../constants";
import { blogService } from "@/lib/firebase/blog";
import { blogCommentsService } from "@/lib/firebase/blog-comments";
import { blogLikesService } from "@/lib/firebase/blog-likes";
import { logger } from "@/lib/utils/logger";
import type { BlogFilters } from "../types";

/**
 * Hook para obtener posts del blog con paginación infinita
 */
export function useBlogPosts(filters?: BlogFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.blog.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      logger.debug('Fetching blog posts', { filters, page: pageParam });
      const posts = await blogService.getPublishedPosts({ limit: 10 });
      // Nota: blogService actual no tiene paginación, esto es un placeholder
      return {
        posts,
        nextCursor: posts.length === 10 ? (pageParam as number) + 1 : null,
        hasMore: posts.length === 10,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    maxPages: QUERY_LIMITS.MAX_PAGES,
    staleTime: QUERY_LIMITS.STALE_TIME,
    gcTime: QUERY_LIMITS.GC_TIME,
  });
}

/**
 * Hook para obtener un post específico
 */
export function useBlogPost(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blog.detail(postId || ''),
    queryFn: async () => {
      if (!postId) {
        throw new Error('ID de post requerido');
      }

      logger.debug('Fetching blog post', { postId });
      const post = await blogService.getPostById(postId);
      
      if (!post) {
        throw new Error('Post no encontrado');
      }
      
      return post;
    },
    enabled: !!postId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para obtener comentarios de un post del blog
 */
export function useBlogComments(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blog.commentsList(postId || ''),
    queryFn: async () => {
      if (!postId) {
        throw new Error('ID de post requerido');
      }

      logger.debug('Fetching blog comments', { postId });
      return await blogCommentsService.getPostComments(postId);
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para verificar si un post del blog está liked
 */
export function useIsBlogPostLiked(postId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.blog.likeStatus(postId || '', user?.uid || ''),
    queryFn: async () => {
      if (!postId || !user?.uid) {
        return false;
      }

      return await blogLikesService.isPostLiked(user.uid, postId);
    },
    enabled: !!postId && !!user?.uid,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

