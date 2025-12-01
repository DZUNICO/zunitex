/**
 * Mutations relacionadas con comentarios
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "../keys";
import { commentService } from "@/lib/firebase/comments";
import { logger } from "@/lib/utils/logger";
import { getFirebaseErrorMessage } from "@/lib/utils/logger";
import { useUserProfile } from "../queries/use-user-queries";
import type { Comment } from "@/types/comment";

/**
 * Hook para agregar un comentario con optimistic update
 */
export function useAddComment() {
  const { user } = useAuth();
  // useUserProfile se define más abajo, pero está bien porque se ejecuta en runtime
  const profileQuery = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, content }: { projectId: string; content: string }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      logger.info('Adding comment', { projectId, userId: user.uid });
      
      await commentService.addComment({
        projectId,
        userId: user.uid,
        userDisplayName: profileQuery.data?.displayName || 'Usuario',
        photoURL: profileQuery.data?.photoURL || null,
        content,
        // createdAt y updatedAt se manejan en commentService con serverTimestamp()
      });
    },
    onMutate: async ({ projectId, content }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.list(projectId) });

      const previousComments = queryClient.getQueryData<Comment[]>(
        queryKeys.comments.list(projectId)
      );

      if (previousComments && user?.uid && profileQuery.data) {
        const optimisticComment: Comment = {
          id: 'temp-' + Date.now(),
          projectId,
          userId: user.uid,
          userDisplayName: profileQuery.data.displayName || 'Usuario',
          photoURL: profileQuery.data.photoURL || null,
          content,
          createdAt: new Date(),
        };

        queryClient.setQueryData<Comment[]>(
          queryKeys.comments.list(projectId),
          [...previousComments, optimisticComment]
        );
      }

      return { previousComments };
    },
    onError: (error, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.comments.list(variables.projectId),
          context.previousComments
        );
      }
      logger.error('Error adding comment', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(variables.projectId) });
      toast({
        title: 'Comentario añadido',
        description: 'Tu comentario ha sido publicado.',
      });
    },
  });
}

