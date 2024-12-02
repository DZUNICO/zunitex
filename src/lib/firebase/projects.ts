
import { db, storage } from './config';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs,getDoc } from 'firebase/firestore';
import type { Project } from '@/types/project';
import { deleteObject, ref } from 'firebase/storage';

export const projectsService = {
  async createProject(projectData: Omit<Project, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  async updateProject(projectId: string, projectData: Partial<Project>) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, projectData);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  async deleteProject(projectId: string) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      
      // Primero obtener el proyecto para verificar si tiene imágenes
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        
        // Eliminar imágenes asociadas si existen
        if (projectData.images?.length) {
          await Promise.all(
            projectData.images.map(async (imageUrl: string) => {
              try {
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
              } catch (error) {
                console.warn('Error deleting image:', error);
              }
            })
          );
        }
      }

      // Eliminar el documento del proyecto
      await deleteDoc(projectRef);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  async getUserProjects(userId: string) {
    try {
      const q = query(
        collection(db, 'projects'),
        where('createdBy', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },
  // Obtener un proyecto específico por ID
  async getProject(projectId: string): Promise<Project | null> {
    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Project;
      }
      return null;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },
};