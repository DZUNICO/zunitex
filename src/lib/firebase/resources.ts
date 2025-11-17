import { db } from './config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  getDocs,
  getDoc,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';

export interface Resource {
  id?: string;
  title: string;
  description: string;
  type: 'guia' | 'plantilla' | 'herramienta' | 'video' | 'otro';
  userId: string;
  fileUrl?: string;
  downloads: number;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  tags?: string[];
  category?: string;
}

export interface ResourcePage {
  resources: Resource[];
  nextCursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export const resourcesService = {
  async getResources(
    options: {
      limit?: number;
      cursor?: QueryDocumentSnapshot | null;
      userId?: string;
      type?: Resource['type'];
      category?: string;
    } = {}
  ): Promise<ResourcePage> {
    try {
      const { limit: pageLimit = 10, cursor, userId, type, category } = options;
      
      let q = query(
        collection(db, 'resources'),
        orderBy('createdAt', 'desc')
      );

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }
      if (type) {
        q = query(q, where('type', '==', type));
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
      const resources = (hasMore ? docs.slice(0, pageLimit) : docs).map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt 
          ? ((doc.data().updatedAt as Timestamp)?.toDate() || new Date())
          : undefined,
      })) as Resource[];

      return {
        resources,
        nextCursor: hasMore ? docs[pageLimit] : null,
        hasMore,
      };
    } catch (error) {
      logger.error('Error fetching resources', error as Error);
      throw error;
    }
  },

  async getResource(resourceId: string): Promise<Resource | null> {
    try {
      const docRef = doc(db, 'resources', resourceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt 
          ? ((docSnap.data().updatedAt as Timestamp)?.toDate() || new Date())
          : undefined,
      } as Resource;
    } catch (error) {
      logger.error('Error fetching resource', error as Error, { resourceId });
      throw error;
    }
  },

  async createResource(data: Omit<Resource, 'id' | 'createdAt' | 'downloads'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'resources'), {
        ...data,
        downloads: 0,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating resource', error as Error);
      throw error;
    }
  },

  async updateResource(resourceId: string, data: Partial<Resource>): Promise<void> {
    try {
      const docRef = doc(db, 'resources', resourceId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Error updating resource', error as Error, { resourceId });
      throw error;
    }
  },

  async deleteResource(resourceId: string): Promise<void> {
    try {
      const docRef = doc(db, 'resources', resourceId);
      await deleteDoc(docRef);
    } catch (error) {
      logger.error('Error deleting resource', error as Error, { resourceId });
      throw error;
    }
  },
};

