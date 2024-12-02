import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const storageService = {
  async uploadProjectImages(projectId: string, files: File[]): Promise<string[]> {
    const urls: string[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `projects/${projectId}/${fileName}`);
      
      try {
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        urls.push(url);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    return urls;
  }
};