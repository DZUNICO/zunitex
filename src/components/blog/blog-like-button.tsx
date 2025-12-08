'use client';

import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useIsBlogPostLiked } from '@/lib/react-query/queries/use-blog-queries';
import { useLikeBlogPost } from '@/lib/react-query/mutations/use-blog-mutations';
import { useAuth } from '@/lib/context/auth-context';
import { cn } from '@/lib/utils';

interface BlogLikeButtonProps {
  postId: string;
  likesCount: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showCount?: boolean;
}

export function BlogLikeButton({
  postId,
  likesCount,
  variant = 'ghost',
  size = 'default',
  showCount = true,
}: BlogLikeButtonProps) {
  const { user } = useAuth();
  const { data: isLiked = false, isLoading } = useIsBlogPostLiked(postId);
  const likeMutation = useLikeBlogPost();

  const handleLike = async () => {
    if (!user) return;

    try {
      await likeMutation.mutateAsync({
        postId,
        like: !isLiked,
      });
    } catch (_error) {
      // El error ya se maneja en el hook
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLike}
      disabled={likeMutation.isPending || isLoading}
      className={cn(
        'gap-2',
        isLiked && 'text-red-500 hover:text-red-600'
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4',
          isLiked && 'fill-current'
        )}
      />
      {showCount && (
        <span className="text-sm">{likesCount}</span>
      )}
    </Button>
  );
}

