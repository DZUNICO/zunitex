/**
 * Queries relacionadas con usuarios y perfiles
 */

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/context/auth-context";
import { queryKeys } from "../keys";
import { logger } from "@/lib/utils/logger";
import type { UserProfile } from "@/types/profile";

/**
 * Hook para obtener el perfil del usuario
 */
export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.profile.detail(user?.uid || ''),
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      logger.debug('Fetching user profile', { userId: user.uid });
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Si el perfil no existe, crear uno básico
        logger.warn('User profile not found, creating default profile', { userId: user.uid });
        const { setDoc } = await import('firebase/firestore');
        const defaultProfile = {
          email: user.email || '',
          displayName: user.displayName || 'Usuario',
          phone: user.phoneNumber || '',
          role: 'user' as const,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          projectsCount: 0,
          rating: 0,
          specialties: [] as string[],
          photoURL: user.photoURL || null,
          active: true,
        };
        await setDoc(docRef, defaultProfile);
        return { ...defaultProfile, id: user.uid } as UserProfile;
      }

      const profileData = docSnap.data() as UserProfile;
      return { ...profileData, id: user.uid } as UserProfile;
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener el perfil de cualquier usuario por su ID
 * Útil para visualizar perfiles de otros usuarios
 */
export function useUserProfileById(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profile.detail(userId || ''),
    queryFn: async () => {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      logger.debug('Fetching user profile by ID', { userId });
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Perfil no encontrado');
      }

      const data = docSnap.data() as UserProfile;
      return { ...data, id: userId };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

