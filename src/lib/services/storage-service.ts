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

      // Eliminar imagen anterior si existe
      const oldImageRef = ref(storage, `profiles/${userId}/profile.${file.type.split('/')[1]}`);
      try {
        await deleteObject(oldImageRef);
      } catch (error) {
        // Ignorar error si no existe imagen anterior
      }

      // Subir nueva imagen
      const fileExt = file.type.split('/')[1];
      const storageRef = ref(storage, `profiles/${userId}/profile.${fileExt}`);
      
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