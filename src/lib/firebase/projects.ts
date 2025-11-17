
import { db, storage } from './config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  getDoc,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import type { Project } from '@/types/project';
import { deleteObject, ref } from 'firebase/storage';
import { logger } from '@/lib/utils/logger';

export const projectsService = {
  async createProject(projectData: Omit<Project, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating project', error as Error);
      throw error;
    }
  },

  async updateProject(projectId: string, projectData: Partial<Project>) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, projectData);
    } catch (error) {
      logger.error('Error updating project', error as Error, { projectId });
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
                logger.warn('Error deleting image', { imageUrl, projectId });
              }
            })
          );
        }
      }

      // Eliminar el documento del proyecto
      await deleteDoc(projectRef);
      return true;
    } catch (error) {
      logger.error('Error deleting project', error as Error, { projectId });
      throw error;
    }
  },

  async getUserProjects(userId: string) {
    try {
      const q = query(
        collection(db, 'projects'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error fetching projects', error as Error, { userId });
      throw error;
    }
  },

  async getProjects(
    options: {
      limit?: number;
      cursor?: QueryDocumentSnapshot | null;
      userId?: string;
      status?: string;
      category?: string;
    } = {}
  ): Promise<{ projects: Project[]; nextCursor: QueryDocumentSnapshot | null; hasMore: boolean }> {
    try {
      const { limit: pageLimit = 10, cursor, userId, status, category } = options;
      
      let q = query(
        collection(db, 'projects'),
        orderBy('createdAt', 'desc')
      );

      if (userId) {
        q = query(q, where('createdBy', '==', userId));
      }
      if (status) {
        q = query(q, where('status', '==', status));
      }
      if (category) {
        q = query(q, where('category', '==', category));
      }

      q = query(q, limit(pageLimit + 1)); // +1 para saber si hay más páginas
      
      if (cursor) {
        q = query(q, startAfter(cursor));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > pageLimit;
      const projects = (hasMore ? docs.slice(0, pageLimit) : docs).map(doc => ({
        id: doc.id,
        ...doc.data(),
        images: doc.data().images || [],
        tags: doc.data().tags || [],
      })) as Project[];

      return {
        projects,
        nextCursor: hasMore ? docs[pageLimit] : null,
        hasMore,
      };
    } catch (error) {
      logger.error('Error fetching projects', error as Error);
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
      logger.error('Error fetching project', error as Error, { projectId });
      throw error;
    }
  },
};