'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateCommunityPost } from '@/lib/react-query/queries';
import { useAuth } from '@/lib/context/auth-context';
import type { CommunityPost, PostCategory } from '@/types/community';
import { Image as ImageIcon, X, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import Image from 'next/image';

const categories = [
  { value: 'question', label: 'Pregunta' },
  { value: 'discussion', label: 'Discusión' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'tip', label: 'Tip' },
  { value: 'news', label: 'Noticias' },
];

interface EditPostDialogProps {
  post: CommunityPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPostDialog({ post, open, onOpenChange }: EditPostDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const updatePostMutation = useUpdateCommunityPost();
  
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('discussion');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del post cuando se abre el modal
  useEffect(() => {
    if (post && open) {
      setContent(post.content || '');
      setCategory(post.category || 'discussion');
      setTags(post.tags || []);
      setImages(post.images || []);
    }
  }, [post, open]);

  if (!user || !post) {
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          throw new Error('Solo se permiten imágenes');
        }

        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('La imagen no puede exceder 5MB');
        }

        const storageRef = ref(storage, `community-posts/${user.uid}/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return url;
      });

      const urls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...urls]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al subir imagen',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    
    // Eliminar imagen de Storage si es una URL nueva (no la original del post)
    // Las imágenes originales se mantendrán en Storage hasta que el post se actualice
    try {
      // Intentar eliminar de Storage solo si la URL es válida y está en nuestro Storage
      if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          // Si falla, no es crítico - puede ser que la imagen ya no exista o sea de otro lugar
          console.warn('No se pudo eliminar la imagen de Storage:', error);
        }
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
    }

    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags((prev) => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El contenido no puede estar vacío',
      });
      return;
    }

    if (content.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El contenido debe tener al menos 10 caracteres',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePostMutation.mutateAsync({
        postId: post.id,
        data: {
          content: content.trim(),
          category: category as PostCategory,
          tags,
          images: images.length > 0 ? images : [],
        },
      });

      // Cerrar modal y resetear
      onOpenChange(false);
      // El toast de éxito ya se maneja en el hook useUpdateCommunityPost
    } catch (_error) {
      // Error manejado en el hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar post</DialogTitle>
          <DialogDescription>
            Modifica el contenido, categoría, tags o imágenes de tu post.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contenido */}
          <div className="space-y-2">
            <Label htmlFor="edit-content">Contenido</Label>
            <Textarea
              id="edit-content"
              placeholder="¿Qué quieres compartir con la comunidad?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              rows={6}
              className="resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/1000 caracteres
            </p>
          </div>

          {/* Categoría y Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tags">
                Tags {tags.length > 0 && `(${tags.length}/5)`}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-tags"
                    placeholder="Agregar tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    disabled={isSubmitting || tags.length >= 5}
                    className="pl-7"
                  />
                </div>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        disabled={isSubmitting}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Imágenes */}
          <div className="space-y-2">
            <Label>Imágenes {images.length > 0 && `(${images.length})`}</Label>
            <div className="space-y-3">
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Subiendo...' : 'Agregar imágenes'}
                </span>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading || isSubmitting}
                  className="hidden"
                />
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
                      <Image
                        src={url}
                        alt={`Imagen ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 150px"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={isSubmitting}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploading || !content.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
