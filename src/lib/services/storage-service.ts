import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const storageService = {
  /**
   * Sube una imagen de perfil al Storage
   * @param userId - ID del usuario
   * @param file - Archivo a subir
   * @param currentImageUrl - URL de la imagen actual (opcional, para eliminarla antes de subir)
   */
  async uploadProfileImage(userId: string, file: File, currentImageUrl?: string | null) {
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no debe superar los 5MB');
      }

      // Obtener la extensión real del archivo (más confiable que derivar del MIME type)
      const fileName = file.name;
      const fileExt = fileName.includes('.') 
        ? fileName.split('.').pop()?.toLowerCase() || 'jpg'
        : file.type.split('/')[1] || 'jpg';
      
      // Normalizar extensiones comunes
      const normalizedExt = fileExt === 'jpeg' ? 'jpg' : fileExt;

      // Solo eliminar imagen anterior si se proporciona una URL válida
      if (currentImageUrl && currentImageUrl.includes('firebasestorage.googleapis.com')) {
        try {
          await this.deleteProfileImage(userId, currentImageUrl);
        } catch {
          // Ignorar silenciosamente - puede que la imagen ya no exista
        }
      }

      // Subir nueva imagen
      const storageRef = ref(storage, `profiles/${userId}/profile.${normalizedExt}`);
      
      const metadata = {
        contentType: file.type,
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;

    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      if (error.code === 'storage/unauthorized') {
        throw new Error('No tienes permiso para realizar esta acción');
      }
      throw new Error(error.message || 'Error al subir la imagen');
    }
  },

  async deleteProfileImage(userId: string, imageUrl: string) {
    try {
      // Extraer el nombre del archivo de la URL
      // Decodificar la URL para manejar caracteres especiales
      const decodedUrl = decodeURIComponent(imageUrl);
      const pathMatch = decodedUrl.match(/profiles%2F[^?]+|profiles\/[^?]+/);
      
      if (!pathMatch) {
        // Intentar extraer de otra forma
        const fileName = imageUrl.split('/').pop()?.split('?')[0];
        if (!fileName) return;
        
        const storageRef = ref(storage, `profiles/${userId}/${fileName}`);
        await deleteObject(storageRef);
        return;
      }

      // Usar el path extraído directamente
      const path = pathMatch[0].replace('%2F', '/');
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        // Ignorar silenciosamente si el archivo ya no existe
        return;
      }
      throw error;
    }
  }
};