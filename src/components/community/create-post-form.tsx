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
import { Image as ImageIcon, X, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import Image from 'next/image';

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

  if (!user) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground text-center">
          Debes iniciar sesión para crear un post
        </p>
      </Card>
    );
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
        category: category as 'question' | 'discussion' | 'showcase' | 'tip' | 'news',
        tags,
        images: images.length > 0 ? images : undefined,
        userRole: 'technician', // Por defecto, se puede obtener del perfil
      });

      // Reset form
      setContent('');
      setCategory('discussion');
      setTags([]);
      setImages([]);
      
      toast({
        title: 'Post creado',
        description: 'Tu post ha sido publicado exitosamente.',
      });

      onSuccess?.();
    } catch (error) {
      // Error manejado en el hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="content">¿Qué quieres compartir?</Label>
          <Textarea
            id="content"
            placeholder="Comparte tus experiencias, preguntas o tips con la comunidad..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            disabled={isSubmitting}
            className="resize-none mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {content.length}/1000 caracteres
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
              <SelectTrigger className="mt-2">
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
            <Label htmlFor="tags">Tags (opcional)</Label>
            <div className="flex gap-2 mt-2">
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
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={isSubmitting || tags.length >= 5 || !tagInput.trim()}
              >
                Agregar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
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
          <Label>Imágenes (opcional)</Label>
          <div className="mt-2 space-y-2">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading || isSubmitting}
              className="cursor-pointer"
            />
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <Image
                      src={url}
                      alt={`Imagen ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || uploading || !content.trim()}
          >
            {isSubmitting ? (
              'Publicando...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publicar
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

