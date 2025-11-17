'use client';

import { Button } from '@/components/ui/button';
import { useFollowUser, useIsFollowing } from '@/lib/react-query/queries';
import { useAuth } from '@/lib/context/auth-context';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

interface FollowButtonProps {
  userId: string;
  userName?: string;
  userAvatar?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export function FollowButton({
  userId,
  userName,
  userAvatar,
  variant = 'outline',
  size = 'default',
  showIcon = true,
}: FollowButtonProps) {
  const { user } = useAuth();
  const followUserMutation = useFollowUser();
  const { data: isFollowing = false, isLoading: isLoadingStatus } = useIsFollowing(
    user?.uid,
    userId
  );

  // No mostrar botón si es el propio usuario
  const isOwnProfile = useMemo(() => user?.uid === userId, [user?.uid, userId]);

  const handleFollow = async () => {
    if (!user?.uid) return;

    try {
      await followUserMutation.mutateAsync({
        followingId: userId,
        follow: !isFollowing,
        followingName: userName,
        followingAvatar: userAvatar,
      });
    } catch (error) {
      // El error ya se maneja en el hook con toast
      console.error('Error al seguir/dejar de seguir:', error);
    }
  };

  if (isOwnProfile) {
    return null;
  }

  if (isLoadingStatus) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Cargando...
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFollow}
      disabled={followUserMutation.isPending}
    >
      {followUserMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {isFollowing ? 'Dejando de seguir...' : 'Siguiendo...'}
        </>
      ) : (
        <>
          {showIcon && (
            <>
              {isFollowing ? (
                <UserMinus className="h-4 w-4 mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
            </>
          )}
          {isFollowing ? 'Dejar de seguir' : 'Seguir'}
        </>
      )}
    </Button>
  );
}

