/**
 * Mutations relacionadas con blog
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "../keys";
import { blogCommentsService } from "@/lib/firebase/blog-comments";
import { blogLikesService } from "@/lib/firebase/blog-likes";
import { logger } from "@/lib/utils/logger";
import { getFirebaseErrorMessage } from "@/lib/utils/logger";
import { useUserProfile } from "../queries/use-user-queries";
import type { BlogComment } from "@/lib/firebase/blog-comments";

/**
 * Hook para agregar comentario a un post del blog
 */
export function useAddBlogComment() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      logger.info('Adding blog comment', { postId, userId: user.uid });
      
      return await blogCommentsService.addComment({
        postId,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Usuario',
        userAvatar: profile?.photoURL || user.photoURL || null,
        content,
        parentId,
      });
    },
    onMutate: async ({ postId, content, parentId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.blog.commentsList(postId) });

      const previousComments = queryClient.getQueryData<BlogComment[]>(
        queryKeys.blog.commentsList(postId)
      );

      if (previousComments && user?.uid && profile) {
        const optimisticComment: BlogComment = {
          id: 'temp-' + Date.now(),
          postId,
          userId: user.uid,
          userName: profile.displayName || 'Usuario',
          userAvatar: profile.photoURL || undefined,
          content,
          parentId,
          likes: 0,
          createdAt: new Date(),
        };

        queryClient.setQueryData<BlogComment[]>(
          queryKeys.blog.commentsList(postId),
          [...previousComments, optimisticComment]
        );
      }

      return { previousComments };
    },
    onError: (error, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.blog.commentsList(variables.postId),
          context.previousComments
        );
      }
      logger.error('Error adding blog comment', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blog.commentsList(variables.postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blog.detail(variables.postId) });
      toast({
        title: 'Comentario añadido',
        description: 'Tu comentario ha sido publicado.',
      });
    },
  });
}

/**
 * Hook para dar like/unlike a un post del blog
 */
export function useLikeBlogPost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      if (like) {
        await blogLikesService.likePost(user.uid, postId);
      } else {
        await blogLikesService.unlikePost(user.uid, postId);
      }
      return { postId, like };
    },
    onMutate: async ({ postId, like }) => {
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.blog.likeStatus(postId, user?.uid || '') 
      });

      const previousStatus = queryClient.getQueryData<boolean>(
        queryKeys.blog.likeStatus(postId, user?.uid || '')
      );

      // Optimistic update
      queryClient.setQueryData(
        queryKeys.blog.likeStatus(postId, user?.uid || ''),
        like
      );

      return { previousStatus };
    },
    onError: (error, variables, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          queryKeys.blog.likeStatus(variables.postId, user?.uid || ''),
          context.previousStatus
        );
      }
      logger.error('Error liking/unliking blog post', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.blog.likeStatus(variables.postId, user?.uid || '') 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.blog.detail(variables.postId) 
      });
    },
  });
}

