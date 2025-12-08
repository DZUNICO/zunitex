'use client';

import { useParams } from 'next/navigation';
import { useCommunityPost, useCommunityPostComments, useIsCommunityPostLiked } from '@/lib/react-query/queries/use-community-queries';
import { useAddCommunityComment, useLikeCommunityPost } from '@/lib/react-query/mutations/use-community-mutations';
import { useAuth } from '@/lib/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, MessageSquare, Eye, Pin, Send } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { CommunityCommentSection } from '@/components/community/community-comment-section';
import { toDate } from '@/lib/utils/date-helpers';

const categoryLabels: Record<string, string> = {
  question: 'Pregunta',
  discussion: 'Discusión',
  showcase: 'Showcase',
  tip: 'Tip',
  news: 'Noticias',
};

export default function CommunityPostPage() {
  const { user } = useAuth();
  const params = useParams();
  const postId = typeof params.id === 'string' ? params.id : undefined;
  
  const { data: post, isLoading, error } = useCommunityPost(postId);
  const { data: isLiked = false } = useIsCommunityPostLiked(postId);
  const likeMutation = useLikeCommunityPost();

  // Incrementar vista cuando se carga el post
  useEffect(() => {
    if (post?.id) {
      // Esto debería hacerse en el backend, pero por ahora lo dejamos así
    }
  }, [post?.id]);

  const handleLike = async () => {
    if (!user || !post?.id) return;

    try {
      await likeMutation.mutateAsync({
        postId: post.id,
        like: !isLiked,
      });
    } catch (error) {
      // Error manejado en el hook
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Post no encontrado</h1>
          <Link href="/community">
            <Button>Volver a la comunidad</Button>
          </Link>
        </div>
      </div>
    );
  }

  const initials = post.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <article className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link 
          href="/community" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la comunidad
        </Link>
      </div>

      {/* Imágenes */}
      {post.images && post.images.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4">
            {post.images.map((image, index) => (
              <div key={index} className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={image}
                  alt={`Imagen ${index + 1} del post`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {categoryLabels[post.category] || post.category}
          </Badge>
          {post.isPinned && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600">
              <Pin className="h-3 w-3 mr-1" />
              Fijado
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(toDate(post.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>

        <div className="flex items-center justify-between py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.userAvatar} alt={post.userName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{post.userName}</div>
              <div className="text-sm text-muted-foreground">{post.userRole}</div>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{post.commentsCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{post.views || 0}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Contenido */}
        <div className="prose prose-lg max-w-none mt-8">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>
      </div>

      {/* Sección de comentarios */}
      <div className="mt-12 pt-8 border-t">
        <CommunityCommentSection postId={post.id || ''} />
      </div>
    </article>
  );
}
