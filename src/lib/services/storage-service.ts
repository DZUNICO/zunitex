import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const storageService = {
  async uploadProfileImage(userId: string, file: File) {
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

      // Eliminar imagen anterior si existe (buscar cualquier extensión común)
      const commonExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
      for (const ext of commonExtensions) {
        try {
          const oldImageRef = ref(storage, `profiles/${userId}/profile.${ext}`);
          await deleteObject(oldImageRef);
        } catch (error) {
          // Ignorar error si no existe imagen anterior
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
      const fileName = imageUrl.split('/').pop()?.split('?')[0];
      if (!fileName) return;
  
      const storageRef = ref(storage, `profiles/${userId}/${fileName}`);
      await deleteObject(storageRef);
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        // Ignorar error si el archivo ya no existe
        console.warn('Archivo ya no existe:', error);
        return;
      }
      throw error;
    }
  }
};