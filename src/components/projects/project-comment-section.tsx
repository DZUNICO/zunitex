// components/projects/project-comment-section.tsx
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/context/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Comment } from '@/types/comment'; // Asegúrate de tener este archivo

interface CommentSectionProps {
  projectId: string;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
}

export function CommentSection({ 
  projectId, 
  comments, 
  onAddComment 
}: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddComment(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };
  const formatCommentDate = (date: Date | string) => {
    try {
      const commentDate = date instanceof Date ? date : new Date(date);
      return formatDistanceToNow(commentDate, {
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha no disponible';
    }
  };
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Añade un comentario..."
            className="resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!content.trim() || isSubmitting}
            >
              Comentar
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <Avatar>
              <AvatarImage src={comment.photoURL|| undefined} alt={comment.userDisplayName} />
              <AvatarFallback>{comment.userDisplayName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{comment.userDisplayName}</span>
                <span className="text-sm text-muted-foreground">
                  {formatCommentDate(comment.createdAt)}
                </span>
              </div>
              <p className="mt-1">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}