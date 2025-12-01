/**
 * Mutations relacionadas con comunidad
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "../keys";
import { communityService } from "@/lib/firebase/community";
import { logger } from "@/lib/utils/logger";
import { getFirebaseErrorMessage } from "@/lib/utils/logger";
import { useUserProfile } from "../queries/use-user-queries";
import type { CommunityPost, UserProfile } from "@/types/community";
import type { QueryDocumentSnapshot } from "firebase/firestore";

/**
 * Hook para crear un post de comunidad
 */
export function useCreateCommunityPost() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'commentsCount' | 'views' | 'userId' | 'userName' | 'userAvatar'>) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      // Esperar a que el perfil se cargue si aún está cargando
      if (profileLoading) {
        // Esperar un momento para que el perfil se cargue
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Obtener el perfil actualizado si está disponible
      const currentProfile = queryClient.getQueryData<UserProfile>(
        queryKeys.profile.detail(user.uid)
      ) || profile;

      return await communityService.createPost({
        ...data,
        userId: user.uid,
        userName: currentProfile?.displayName || user.displayName || 'Usuario',
        userAvatar: currentProfile?.photoURL || user.photoURL || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.lists() });
      toast({
        title: 'Post creado',
        description: 'Tu post ha sido publicado exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error creating community post', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

/**
 * Hook para agregar comentario a un post de comunidad
 */
export function useAddCommunityComment() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      // Esperar a que el perfil se cargue si aún está cargando
      if (profileLoading) {
        // Esperar un momento para que el perfil se cargue
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Obtener el perfil actualizado si está disponible
      const currentProfile = queryClient.getQueryData<UserProfile>(
        queryKeys.profile.detail(user.uid)
      ) || profile;

      return await communityService.addPostComment({
        postId,
        userId: user.uid,
        userName: currentProfile?.displayName || user.displayName || 'Usuario',
        userAvatar: currentProfile?.photoURL || user.photoURL || undefined,
        content,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.commentsList(variables.postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.community.detail(variables.postId) });
      toast({
        title: 'Comentario añadido',
        description: 'Tu comentario ha sido publicado.',
      });
    },
    onError: (error) => {
      logger.error('Error adding community comment', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

/**
 * Hook para dar like/unlike a un post de comunidad
 */
export function useLikeCommunityPost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      if (like) {
        await communityService.likePost(user.uid, postId);
      } else {
        await communityService.unlikePost(user.uid, postId);
      }
      return { postId, like };
    },
    onMutate: async ({ postId, like }) => {
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.community.likeStatus(postId, user?.uid || '') 
      });
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.community.detail(postId) 
      });
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.community.lists() 
      });

      const previousStatus = queryClient.getQueryData<boolean>(
        queryKeys.community.likeStatus(postId, user?.uid || '')
      );
      const previousPost = queryClient.getQueryData<CommunityPost>(
        queryKeys.community.detail(postId)
      );

      // Guardar el estado anterior de todas las listas
      const previousLists = queryClient.getQueriesData<{
        pages: Array<{ posts: CommunityPost[]; nextCursor: QueryDocumentSnapshot | null }>;
        pageParams: unknown[];
      }>({ queryKey: queryKeys.community.lists() });

      // Optimistic update del estado de like
      queryClient.setQueryData(
        queryKeys.community.likeStatus(postId, user?.uid || ''),
        like
      );

      // Optimistic update del contador de likes en el detalle
      if (previousPost) {
        queryClient.setQueryData<CommunityPost>(
          queryKeys.community.detail(postId),
          {
            ...previousPost,
            likes: like ? (previousPost.likes || 0) + 1 : Math.max(0, (previousPost.likes || 0) - 1),
          }
        );
      }

      // Optimistic update del contador de likes en todas las listas (infinite query)
      queryClient.setQueriesData<{
        pages: Array<{ posts: CommunityPost[]; nextCursor: QueryDocumentSnapshot | null }>;
        pageParams: unknown[];
      }>(
        { queryKey: queryKeys.community.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      likes: like ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1),
                    }
                  : post
              ),
            })),
          };
        }
      );

      return { previousStatus, previousPost, previousLists };
    },
    onError: (error, variables, context) => {
      // Revertir estado de like
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          queryKeys.community.likeStatus(variables.postId, user?.uid || ''),
          context.previousStatus
        );
      }
      // Revertir contador de likes en el detalle
      if (context?.previousPost) {
        queryClient.setQueryData<CommunityPost>(
          queryKeys.community.detail(variables.postId),
          context.previousPost
        );
      }
      // Revertir cambios en todas las listas
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      logger.error('Error liking/unliking community post', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.community.likeStatus(variables.postId, user?.uid || '') 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.community.detail(variables.postId) 
      });
      // Invalidar también la lista para actualizar contadores en las tarjetas
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.community.lists() 
      });
    },
  });
}

/**
 * Hook para actualizar un post de comunidad
 */
export function useUpdateCommunityPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: Partial<CommunityPost> }) => {
      logger.info('Updating community post', { postId });
      await communityService.updatePost(postId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.community.detail(variables.postId) });
      toast({
        title: 'Post actualizado',
        description: 'Los cambios han sido guardados exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error updating community post', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

/**
 * Hook para eliminar un post de comunidad
 */
export function useDeleteCommunityPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (postId: string) => {
      logger.info('Deleting community post', { postId });
      await communityService.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.lists() });
      toast({
        title: 'Post eliminado',
        description: 'El post ha sido eliminado exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error deleting community post', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

/**
 * Hook para actualizar un comentario de post
 */
export function useUpdateCommunityComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, content, postId }: { commentId: string; content: string; postId: string }) => {
      logger.info('Updating community comment', { commentId });
      await communityService.updatePostComment(commentId, content);
      return { commentId, postId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.commentsList(variables.postId) });
      toast({
        title: 'Comentario actualizado',
        description: 'El comentario ha sido actualizado exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error updating community comment', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

/**
 * Hook para eliminar un comentario de post
 */
export function useDeleteCommunityComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      logger.info('Deleting community comment', { commentId });
      await communityService.deletePostComment(commentId, postId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.commentsList(variables.postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.community.detail(variables.postId) });
      toast({
        title: 'Comentario eliminado',
        description: 'El comentario ha sido eliminado exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error deleting community comment', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

