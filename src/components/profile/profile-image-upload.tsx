'use client';

import { useState,useCallback,useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/context/auth-context';
import { storageService } from '@/lib/services/storage-service';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { UploadErrorFallback } from '@/components/shared/error-fallbacks';

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  onImageUpdate?: (newUrl: string | null) => void;
}

export function ProfileImageUpload({ currentImageUrl, onImageUpdate }: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  //const [imageUrl, setImageUrl] = useState<string | null | undefined>(currentImageUrl);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Validación de archivo
  const validateFile = (file: File): boolean => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tipo de archivo no permitido. Use JPG, PNG o WebP"
      });
      return false;
    }

    if (file.size > MAX_SIZE) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 5MB"
      });
      return false;
    }

    return true;
  };
  
  const updateUserProfile = useCallback(async (avatarUrl: string | null) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    
    try {
      // Actualizar en Firestore
      await updateDoc(userRef, { photoURL: avatarUrl });
      
      /* // Actualizar en Auth
      if (user) {
        await updateProfile(user, {
          photoURL: avatarUrl || undefined
        });
      } */
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la foto de perfil"
      });
    }
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log(file)
    if (!file || !user) return;

    if (!validateFile(file)) {
      // Resetear el valor del input después de una validación fallida
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setUploading(true);

      if (currentImageUrl) {
        try {
          await storageService.deleteProfileImage(user.uid, currentImageUrl);
        } catch (error) {
          console.warn('Error al eliminar imagen anterior:', error);
        }
      }

      const newImageUrl = await storageService.uploadProfileImage(user.uid, file);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: newImageUrl
      });

      onImageUpdate?.(newImageUrl);

      toast({
        title: "Éxito",
        description: "Imagen de perfil actualizada"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al subir la imagen"
      });
      console.log(error)
    } finally {
      setUploading(false);
      // Resetear el valor del input después de la subida
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!user || !currentImageUrl) return;

    try {
      setUploading(true);
      await storageService.deleteProfileImage(user.uid, currentImageUrl);
      await updateUserProfile(null);
      onImageUpdate?.(null);

      toast({
        title: "Éxito",
        description: "Imagen de perfil eliminada"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar la imagen"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ErrorBoundary
      scope="component"
      fallback={(reset) => <UploadErrorFallback onReset={reset} />}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Solo el Avatar centrado */}
        <div className="relative flex justify-center w-full">
          <Avatar className="h-24 w-24">
            {currentImageUrl ? (
              <AvatarImage src={currentImageUrl} alt="Foto de perfil" />
            ) : (
              <AvatarFallback>
                {user?.email?.[0].toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          {uploading && (
            <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </div>

        {/* Botones abajo */}
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="relative"
            disabled={uploading}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImageUpload}
              accept="image/*"
              disabled={uploading}
            />
            <Upload className="h-4 w-4 mr-2" />
            Cambiar foto
          </Button>

          {currentImageUrl && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={uploading}
            >
              <X className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}