'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, MessageSquare, Eye, Pin, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsCommunityPostLiked } from '@/lib/react-query/queries/use-community-queries';
import { useLikeCommunityPost, useDeleteCommunityPost } from '@/lib/react-query/mutations/use-community-mutations';
import { useAuth } from '@/lib/context/auth-context';
import { cn } from '@/lib/utils';
import type { CommunityPost } from '@/types/community';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { EditPostDialog } from './edit-post-dialog';
import { DeletePostDialog } from './delete-post-dialog';

// Componente para hacer clickeable el contenido del post sin usar Link anidado
const ClickablePostContent = ({ postId, children }: { postId: string; children: React.ReactNode }) => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(`/community/${postId}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {children}
    </div>
  );
};

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
  const deletePostMutation = useDeleteCommunityPost();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  /**
   * Función helper para convertir diferentes tipos de fechas a Date
   * Maneja: Date, string, Timestamp de Firestore, y objetos con seconds/nanoseconds
   */
  const convertToDate = (date: any): Date => {
    // Si es un Timestamp de Firestore con método toDate
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      return date.toDate();
    }
    // Si es un objeto con seconds (Timestamp serializado)
    if (date && typeof date === 'object' && ('seconds' in date || '_seconds' in date)) {
      const seconds = date.seconds || date._seconds || 0;
      const nanoseconds = date.nanoseconds || date._nanoseconds || 0;
      return new Timestamp(seconds, nanoseconds).toDate();
    }
    // Si ya es un Date
    if (date instanceof Date) {
      return date;
    }
    // Si es un string
    if (typeof date === 'string') {
      return new Date(date);
    }
    // Si es un número (timestamp)
    if (typeof date === 'number') {
      return new Date(date);
    }
    // Fallback: fecha actual
    return new Date();
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;

    try {
      await likeMutation.mutateAsync({
        postId: post.id || '',
        like: !isLiked,
      });
    } catch (_error) {
      // Error manejado en el hook
    }
  };

  const handleEdit = (post: CommunityPost) => {
    setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (postId: string) => {
    try {
      await deletePostMutation.mutateAsync(postId);
    } catch (error) {
      // Error manejado en el hook
      throw error;
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
    <>
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 bg-white border border-gray-200">
      <div className="flex gap-0">
        {/* Sidebar de votos - estilo Reddit mejorado */}
        <div className="flex flex-col items-center py-3 px-2 bg-gray-50/30 border-r border-gray-200 min-w-[50px]">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!user || likeMutation.isPending}
            className={cn(
              'h-9 w-9 p-0 rounded-md transition-all',
              isLiked 
                ? 'text-red-500 hover:bg-red-50 hover:text-red-600' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-red-500'
            )}
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-transform',
                isLiked && 'fill-current scale-110'
              )}
            />
          </Button>
          <span className={cn(
            'text-sm font-bold py-1 min-h-[24px] flex items-center',
            isLiked ? 'text-red-500' : 'text-gray-700'
          )}>
            {post.likes || 0}
          </span>
        </div>

        {/* Contenido principal */}
        <div className="flex-1">
          <ClickablePostContent postId={post.id || ''}>
            <div className="p-4 hover:bg-gray-50/50 transition-colors">
              {/* Header con usuario y metadata */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Avatar clickeable para ir al perfil */}
                  <Link 
                    href={`/profile/${post.userId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-7 w-7 border border-gray-200 cursor-pointer">
                      <AvatarImage src={post.userAvatar} alt={post.userName} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Nombre clickeable para ir al perfil */}
                    <Link 
                      href={`/profile/${post.userId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-semibold text-gray-900 truncate hover:text-primary transition-colors cursor-pointer"
                    >
                      {post.userName}
                    </Link>
                    <span className="text-xs text-gray-400">•</span>
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-2 py-0.5 font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {categoryLabels[post.category] || post.category}
                    </Badge>
                    {post.isPinned && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs px-1.5 py-0.5 border-0">
                          <Pin className="h-2.5 w-2.5 mr-0.5 inline" />
                          Fijado
                        </Badge>
                      </>
                    )}
                    <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                      {formatDistanceToNow(convertToDate(post.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>

                {/* Dropdown menu si es el dueño del post */}
                {user && user.uid === post.userId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(post);
                      }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Contenido del post */}
              <div className="mb-3">
                <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed">
                  {contentPreview}
                </p>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 font-normal border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      #{tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 font-normal border-gray-300 text-gray-600"
                    >
                      +{post.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Imagen preview */}
              {post.images && post.images.length > 0 && (
                <div className="relative aspect-video w-full rounded-md overflow-hidden mb-3 border border-gray-200 bg-gray-100">
                  <Image
                    src={post.images[0]}
                    alt="Post image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {post.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium backdrop-blur-sm">
                      +{post.images.length - 1} más
                    </div>
                  )}
                </div>
              )}

              {/* Footer con acciones */}
              <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentsCount || 0} comentarios</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Eye className="h-4 w-4" />
                  <span>{post.views || 0} vistas</span>
                </div>
              </div>
            </div>
          </ClickablePostContent>
        </div>
      </div>
    </Card>
    {/* Modal de edición */}
    <EditPostDialog
      post={post}
      open={isEditDialogOpen}
      onOpenChange={setIsEditDialogOpen}
    />
    {/* Modal de confirmación de eliminación */}
    <DeletePostDialog
      post={post}
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      onConfirm={handleConfirmDelete}
    />
  </>
  );
}

