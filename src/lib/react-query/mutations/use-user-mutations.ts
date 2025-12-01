/**
 * Mutations relacionadas con usuarios y perfiles
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "../keys";
import { doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { logger } from "@/lib/utils/logger";
import { getFirebaseErrorMessage } from "@/lib/utils/logger";
import type { UserProfile } from "@/types/profile";

/**
 * Hook para actualizar el perfil
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      logger.info('Updating user profile', { userId: user.uid });
      const docRef = doc(db, 'users', user.uid);
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(user?.uid || '') });
      toast({
        title: 'Perfil actualizado',
        description: 'Los cambios han sido guardados exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error updating profile', error as Error, { userId: user?.uid });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

