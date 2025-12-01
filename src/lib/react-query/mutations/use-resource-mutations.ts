/**
 * Mutations relacionadas con recursos
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "../keys";
import { resourcesService } from "@/lib/firebase/resources";
import { logger } from "@/lib/utils/logger";
import { getFirebaseErrorMessage } from "@/lib/utils/logger";

/**
 * Hook para dar like/unlike a un recurso
 */
export function useLikeResource() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ resourceId, like }: { resourceId: string; like: boolean }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      if (like) {
        await resourcesService.likeResource(user.uid, resourceId);
      } else {
        await resourcesService.unlikeResource(user.uid, resourceId);
      }
      return { resourceId, like };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.detail(variables.resourceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.lists() });
    },
    onError: (error) => {
      logger.error('Error liking/unliking resource', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

