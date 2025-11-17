import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '@/lib/firebase/comments';
import { useAuth } from '@/lib/context/auth-context';
import { useUserProfile } from './use-profile';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/utils/logger';
import { getFirebaseErrorMessage } from '@/lib/utils/logger';
import type { Comment } from '@/types/comment';

// Query keys
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (projectId: string) => [...commentKeys.lists(), projectId] as const,
};

/**
 * Hook para obtener comentarios de un proyecto
 */
export function useProjectComments(projectId: string | undefined) {
  return useQuery({
    queryKey: commentKeys.list(projectId || ''),
    queryFn: async () => {
      if (!projectId) {
        throw new Error('ID de proyecto requerido');
      }

      logger.debug('Fetching project comments', { projectId });
      return await commentService.getProjectComments(projectId);
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para agregar un comentario
 */
export function useAddComment() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
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
        userDisplayName: profile?.displayName || 'Usuario',
        photoURL: profile?.photoURL || null,
        content,
        createdAt: new Date(),
      });
    },
    onSuccess: (_, variables) => {
      // Invalidar y refetch los comentarios del proyecto
      queryClient.invalidateQueries({ queryKey: commentKeys.list(variables.projectId) });
      toast({
        title: 'Comentario añadido',
        description: 'Tu comentario ha sido publicado.',
      });
    },
    onError: (error) => {
      logger.error('Error adding comment', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

