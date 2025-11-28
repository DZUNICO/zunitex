'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Heart, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BlogPost } from '@/types/blog';
import { BlogLikeButton } from './blog-like-button';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const formatBlogDate = (date: Date | string) => {
    try {
      const blogDate = date instanceof Date ? date : new Date(date);
      return formatDistanceToNow(blogDate, {
        addSuffix: true,
        locale: es
      });
    } catch (_error) {
      console.error('Error formateando fecha:', _error);
      return 'Fecha no disponible';
    }
  };

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${
      featured ? 'md:grid md:grid-cols-2 gap-6' : ''
    }`}>
      <Link href={`/blog/${post.id}`} className="block">
        <div className={`relative ${featured ? 'h-full min-h-[300px] aspect-[16/9]' : 'aspect-[16/9]'}`}>
          <Image
            src={post.imageUrl || '/placeholder.jpg'}
            alt={post.title}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-white/90 text-black hover:bg-white/80">
              {post.category}
            </Badge>
          </div>
        </div>
      </Link>

      <div className="p-6">
        <div className="space-y-4">
          <Link href={`/blog/${post.id}`} className="block">
            <h3 className={`font-bold hover:text-primary transition-colors ${
              featured ? 'text-2xl' : 'text-xl'
            }`}>
              {post.title}
            </h3>
          </Link>

          <p className="text-muted-foreground line-clamp-2">
            {post.summary}
          </p>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              {/* Avatar clickeable para ir al perfil del autor */}
              <Link 
                href={`/profile/${post.authorId}`}
                className="hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={post.authorPhotoURL || undefined} />
                  <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                {/* Nombre clickeable para ir al perfil del autor */}
                <Link 
                  href={`/profile/${post.authorId}`}
                  className="font-medium text-sm hover:text-primary transition-colors cursor-pointer block"
                >
                  {post.authorName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatBlogDate(post.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <BlogLikeButton 
                postId={post.id || ''} 
                likesCount={post.likesCount || 0}
                variant="ghost"
                size="sm"
                showCount={true}
              />
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">{post.commentsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}