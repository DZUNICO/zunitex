import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/utils/logger';
import { getFirebaseErrorMessage } from '@/lib/utils/logger';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { UserProfile } from '@/types/profile';

// Query keys
export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
};

/**
 * Hook para obtener el perfil del usuario
 */
export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: profileKeys.detail(user?.uid || ''),
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      logger.debug('Fetching user profile', { userId: user.uid });
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Perfil no encontrado');
      }

      return docSnap.data() as UserProfile;
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para actualizar el perfil del usuario
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
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(user?.uid || '') });
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

