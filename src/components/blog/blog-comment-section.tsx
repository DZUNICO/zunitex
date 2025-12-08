'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useBlogComments } from '@/lib/react-query/queries/use-blog-queries';
import { useAddBlogComment } from '@/lib/react-query/mutations/use-blog-mutations';
import { useAuth } from '@/lib/context/auth-context';
import { MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BlogComment } from '@/lib/firebase/blog-comments';
import Link from 'next/link';
import { toDate } from '@/lib/utils/date-helpers';

interface BlogCommentSectionProps {
  postId: string;
}

export function BlogCommentSection({ postId }: BlogCommentSectionProps) {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useBlogComments(postId);
  const addCommentMutation = useAddBlogComment();
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Protección contra doble submit: verificar al inicio
    if (!commentContent.trim() || !user || isSubmitting || addCommentMutation.isPending) return;

    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync({
        postId,
        content: commentContent.trim(),
      });
      setCommentContent('');
    } catch (_error) {
      // El error ya se maneja en el hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comentarios ({comments.length})
        </h3>
      </div>

      {/* Formulario de comentario */}
      {user && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Escribe tu comentario..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={3}
              disabled={isSubmitting}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!commentContent.trim() || isSubmitting || addCommentMutation.isPending}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {(isSubmitting || addCommentMutation.isPending) ? 'Publicando...' : 'Publicar'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de comentarios */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando comentarios...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay comentarios aún. ¡Sé el primero en comentar!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: BlogComment }) {
  const initials = comment.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        {/* Avatar clickeable para ir al perfil */}
        <Link 
          href={`/profile/${comment.userId}`}
          className="hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src={comment.userAvatar} alt={comment.userName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {/* Nombre clickeable para ir al perfil */}
            <Link 
              href={`/profile/${comment.userId}`}
              className="font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              {comment.userName}
            </Link>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(toDate(comment.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
          
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </Card>
  );
}

