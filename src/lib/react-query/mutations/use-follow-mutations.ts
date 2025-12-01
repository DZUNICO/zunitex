/**
 * Mutations relacionadas con follows y reviews
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "../keys";
import { followersService } from "@/lib/firebase/followers";
import { reviewsService } from "@/lib/firebase/reviews";
import { logger } from "@/lib/utils/logger";
import { getFirebaseErrorMessage } from "@/lib/utils/logger";
import { useUserProfile } from "../queries/use-user-queries";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Review } from "@/types/reviews";

/**
 * Hook para seguir/dejar de seguir un usuario con optimistic update
 */
export function useFollowUser() {
  const { user } = useAuth();
  const { data: currentUserProfile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      followingId, 
      follow, 
      followingName, 
      followingAvatar 
    }: { 
      followingId: string; 
      follow: boolean;
      followingName?: string;
      followingAvatar?: string;
    }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      if (follow) {
        // Obtener datos del usuario a seguir si no se proporcionaron
        let targetUserName = followingName;
        let targetUserAvatar = followingAvatar;

        if (!targetUserName) {
          const targetUserDoc = await getDoc(doc(db, 'users', followingId));
          if (targetUserDoc.exists()) {
            const targetUserData = targetUserDoc.data();
            targetUserName = targetUserData.displayName || 'Usuario';
            targetUserAvatar = targetUserData.photoURL || null;
          }
        }

        await followersService.followUser({
          followerId: user.uid,
          followingId,
          followerName: currentUserProfile?.displayName || user.displayName || 'Usuario',
          followerAvatar: currentUserProfile?.photoURL || user.photoURL || null,
          followingName: targetUserName || 'Usuario',
          followingAvatar: targetUserAvatar || null,
        });
      } else {
        await followersService.unfollowUser(user.uid, followingId);
      }
      return { followingId, follow };
    },
    onMutate: async ({ followingId, follow }) => {
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.followers.status(user?.uid || '', followingId) 
      });

      const previousStatus = queryClient.getQueryData<boolean>(
        queryKeys.followers.status(user?.uid || '', followingId)
      );

      // Optimistic update
      queryClient.setQueryData(
        queryKeys.followers.status(user?.uid || '', followingId),
        follow
      );

      return { previousStatus };
    },
    onError: (error, variables, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          queryKeys.followers.status(user?.uid || '', variables.followingId),
          context.previousStatus
        );
      }
      logger.error('Error following/unfollowing user', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.followers.status(user?.uid || '', variables.followingId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.followers.followers(variables.followingId) 
      });
      toast({
        title: variables.follow ? 'Usuario seguido' : 'Dejaste de seguir',
        description: variables.follow 
          ? 'Ahora sigues a este usuario.' 
          : 'Ya no sigues a este usuario.',
      });
    },
  });
}

/**
 * Hook para crear una review
 */
export function useCreateReview() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'reviewerName' | 'reviewerAvatar'>) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      return await reviewsService.createReview({
        ...data,
        reviewerId: user.uid,
        reviewerName: profile?.displayName || user.displayName || 'Usuario',
        reviewerAvatar: profile?.photoURL || user.photoURL || null,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.lists() });
      if (variables.reviewedUserId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.reviews.list({ reviewedUserId: variables.reviewedUserId }) 
        });
      }
      toast({
        title: 'Reseña creada',
        description: 'Tu reseña ha sido publicada exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error creating review', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

