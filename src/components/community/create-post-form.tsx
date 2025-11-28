'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCommunityPost } from '@/lib/react-query/queries';
import { useAuth } from '@/lib/context/auth-context';
import type { PostCategory } from '@/types/community';
import { Image as ImageIcon, X, Send, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'question', label: 'Pregunta' },
  { value: 'discussion', label: 'Discusión' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'tip', label: 'Tip' },
  { value: 'news', label: 'Noticias' },
];

export function CreatePostForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createPostMutation = useCreateCommunityPost();
  
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('discussion');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!user) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground text-center">
          Debes iniciar sesión para crear un post
        </p>
      </Card>
    );
  }

  const userInitials = user.displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

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

  const removeImage = (index: number) => {
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
      await createPostMutation.mutateAsync({
        content: content.trim(),
        category: category as PostCategory,
        tags,
        images: images.length > 0 ? images : undefined,
        userRole: 'technician', // Valor por defecto
        isPinned: false,
      });

      // Reset form
      setContent('');
      setCategory('discussion');
      setTags([]);
      setImages([]);
      setIsExpanded(false);
      
      // El toast de éxito ya se maneja en el hook useCreateCommunityPost
      onSuccess?.();
    } catch (_error) {
      // Error manejado en el hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-0">
        {/* Header compacto - siempre visible */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'Usuario'} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="flex-1 text-left"
            >
              <Textarea
                id="content"
                placeholder="¿Qué quieres compartir con la comunidad?"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (e.target.value.length > 0) setIsExpanded(true);
                }}
                onFocus={() => setIsExpanded(true)}
                rows={isExpanded ? 4 : 1}
                disabled={isSubmitting}
                className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[40px] bg-transparent"
              />
            </button>
          </div>
        </div>

        {/* Contenido expandido */}
        {isExpanded && (
          <div className="p-4 space-y-4 border-b bg-gray-50/50">
            {/* Categoría y Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="category" className="text-xs text-muted-foreground mb-1 block">
                  Categoría
                </Label>
                <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                  <SelectTrigger className="h-9">
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

              <div>
                <Label htmlFor="tags" className="text-xs text-muted-foreground mb-1 block">
                  Tags {tags.length > 0 && `(${tags.length}/5)`}
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tags"
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
                      className="pl-7 h-9"
                    />
                  </div>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
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
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Imágenes {images.length > 0 && `(${images.length})`}
              </Label>
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
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

            <p className="text-xs text-muted-foreground text-right">
              {content.length}/1000 caracteres
            </p>
          </div>
        )}

        {/* Footer con acciones */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isExpanded && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Foto</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isExpanded && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExpanded(false);
                  if (!content.trim()) {
                    setContent('');
                    setCategory('discussion');
                    setTags([]);
                    setImages([]);
                  }
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || uploading || !content.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

