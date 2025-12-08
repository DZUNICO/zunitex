'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { useBlogPost } from '@/lib/react-query/queries/use-blog-queries';
import { BlogCommentSection } from '@/components/blog/blog-comment-section';
import { BlogLikeButton } from '@/components/blog/blog-like-button';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Importar el editor y el visor de Markdown dinámicamente
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

const MDMarkdown = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
);

export default function BlogPostPage() {
  const { user } = useAuth();
  const params = useParams();
  const postId = typeof params.id === 'string' ? params.id : undefined;
  
  const { data: post, isLoading, error } = useBlogPost(postId);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPost, setEditedPost] = useState<Partial<typeof post>>({});

  // Inicializar editedPost cuando el post se carga
  useEffect(() => {
    if (post && !editedPost?.title) {
      setEditedPost({
        title: post.title,
        content: post.content,
        category: post.category,
        status: post.status
      });
    }
  }, [post]);

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
          <Link href="/blog">
            <Button>Volver al blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const createdAt = post.createdAt instanceof Date 
    ? post.createdAt 
    : new Date(post.createdAt);

  const isAdmin = user?.email === 'diego.zuni@gmail.com';

  const handleSave = () => {
    // TODO: Implementar actualización de blog post
    console.log('Guardar cambios:', editedPost);
    setIsEditing(false);
  };

  return (
    <article className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/blog" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al blog
        </Link>
        {isAdmin && (
          <div className="space-x-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} variant="default">
                  Guardar
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancelar
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            )}
          </div>
        )}
      </div>

      {post.imageUrl && (
        <div className="aspect-video relative overflow-hidden rounded-lg mb-8">
          <img
            src={post.imageUrl}
            alt={editedPost?.title || post.title}
            className="object-scale-down w-full h-full"
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {isEditing ? (
            <Input
              value={editedPost?.category || ''}
              onChange={(e) => setEditedPost({ ...editedPost, category: e.target.value })}
              className="w-32"
            />
          ) : (
            <Badge variant="secondary">
              {post.category}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(createdAt, { addSuffix: true, locale: es })}
          </span>
          {isAdmin && (
            <div className="flex items-center gap-4">
              {isEditing ? (
                <select
                  value={editedPost?.status || post.status}
                  onChange={(e) => setEditedPost({ 
                    ...editedPost, 
                    status: e.target.value as 'draft' | 'published' 
                  })}
                  className="p-2 rounded border bg-background text-foreground"
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              ) : (
                <Badge variant={post.status === 'published' ? "default" : "secondary"}>
                  {post.status === 'published' ? 'Publicado' : 'Borrador'}
                </Badge>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <Input
            value={editedPost?.title || ''}
            onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
            className="text-4xl font-bold"
          />
        ) : (
          <h1 className="text-4xl font-bold">{post.title}</h1>
        )}
        
        <div className="flex items-center justify-between py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.authorPhotoURL || undefined} />
              <AvatarFallback>{post.authorName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{post.authorName}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <BlogLikeButton 
              postId={post.id || ''} 
              likesCount={post.likesCount || 0}
              variant="ghost"
              size="sm"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{post.commentsCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="prose prose-lg max-w-none mt-8">
          {isEditing ? (
            <div data-color-mode="light">
              <MDEditor
                value={editedPost?.content || ''}
                onChange={(value) => setEditedPost({ ...editedPost, content: value || '' })}
                preview="edit"
                height={500}
              />
            </div>
          ) : (
            <div data-color-mode="light">
              <MDMarkdown 
                source={post.content} 
                className="prose max-w-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sección de comentarios */}
      <div className="mt-12 pt-8 border-t">
        <BlogCommentSection postId={post.id || ''} />
      </div>
    </article>
  );
}