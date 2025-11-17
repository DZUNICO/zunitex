'use client';

import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Eye, Pin } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsCommunityPostLiked, useLikeCommunityPost } from '@/lib/react-query/queries';
import { useAuth } from '@/lib/context/auth-context';
import { cn } from '@/lib/utils';
import type { CommunityPost } from '@/types/community';
import Image from 'next/image';

interface CommunityPostCardProps {
  post: CommunityPost;
}

const categoryLabels: Record<string, string> = {
  question: 'Pregunta',
  discussion: 'Discusión',
  showcase: 'Showcase',
  tip: 'Tip',
  news: 'Noticias',
};

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  const { user } = useAuth();
  const { data: isLiked = false } = useIsCommunityPostLiked(post.id);
  const likeMutation = useLikeCommunityPost();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;

    try {
      await likeMutation.mutateAsync({
        postId: post.id || '',
        like: !isLiked,
      });
    } catch (error) {
      // Error manejado en el hook
    }
  };

  const initials = post.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const contentPreview = post.content.length > 150 
    ? post.content.substring(0, 150) + '...' 
    : post.content;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link href={`/community/${post.id}`} className="block">
        {post.images && post.images.length > 0 && (
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={post.images[0]}
              alt="Post image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {post.isPinned && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                  <Pin className="h-3 w-3 mr-1" />
                  Fijado
                </Badge>
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary">
              {categoryLabels[post.category] || post.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {contentPreview}
            </p>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.userAvatar} alt={post.userName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{post.userName}</p>
                <p className="text-xs text-muted-foreground">{post.userRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!user || likeMutation.isPending}
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
                <span className="text-sm">{post.likes || 0}</span>
              </Button>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">{post.commentsCount || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{post.views || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}

