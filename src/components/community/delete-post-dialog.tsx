'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import type { CommunityPost } from '@/types/community';

interface DeletePostDialogProps {
  post: CommunityPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (postId: string) => void;
}

export function DeletePostDialog({
  post,
  open,
  onOpenChange,
  onConfirm,
}: DeletePostDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!post?.id) return;
    
    try {
      setIsDeleting(true);
      await onConfirm(post.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error in delete confirmation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!post) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-xl">¿Eliminar post?</AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-base">
                Esta acción no se puede deshacer. El post será eliminado permanentemente de la comunidad.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="my-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Contenido del post:</p>
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {post.content}
          </p>
          {post.images && post.images.length > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1.5">
              <span className="text-xs font-medium text-blue-700">
                ⚠️ También se eliminarán {post.images.length} imagen{post.images.length > 1 ? 'es' : ''} adjunta{post.images.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <AlertDialogFooter className="sm:flex-row sm:justify-end gap-2">
          <AlertDialogCancel disabled={isDeleting} className="mt-0">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 dark:bg-red-600 dark:hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar post
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

