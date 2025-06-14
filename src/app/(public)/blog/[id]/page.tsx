'use client';

import { blogService } from '@/lib/firebase/blog';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { BlogPost } from '@/types/blog';
import { useAuth } from '@/lib/context/auth-context';
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
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [editedPost, setEditedPost] = useState<Partial<BlogPost>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const params = useParams();

  useEffect(() => {
    const loadPost = async () => {
      try {
        if (typeof params.id === 'string') {
          const data = await blogService.getPostById(params.id);
          setPost(data);
          if (data) {
            setEditedPost({
              title: data.title,
              content: data.content,
              category: data.category,
              status: data.status
            });
          }
        }
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [params.id]);

  const handleSave = async () => {
    try {
      if (!post || !editedPost) return;
      setLoading(true);
      await blogService.updatePost(params.id as string, editedPost);
      setPost({ ...post, ...editedPost });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!post) {
    return notFound();
  }

  const createdAt = post.createdAt instanceof Date 
    ? post.createdAt 
    : new Date(post.createdAt);

  const isAdmin = user?.email === 'diego.zuni@gmail.com';

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
            alt={editedPost.title || post.title}
            className="object-scale-down w-full h-full"
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {isEditing ? (
            <Input
              value={editedPost.category || ''}
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
                  value={editedPost.status || post.status}
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
            value={editedPost.title || ''}
            onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
            className="text-4xl font-bold"
          />
        ) : (
          <h1 className="text-4xl font-bold">{post.title}</h1>
        )}
        
        <div className="flex items-center gap-3 py-4 border-b">
          <Avatar>
            <AvatarImage src={post.authorPhotoURL || undefined} />
            <AvatarFallback>{post.authorName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{post.authorName}</div>
          </div>
        </div>

        <div className="prose prose-lg max-w-none mt-8">
          {isEditing ? (
            <div data-color-mode="light">
              <MDEditor
                value={editedPost.content || ''}
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
    </article>
  );
}