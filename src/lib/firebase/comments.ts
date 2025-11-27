// lib/firebase/comments.ts
import { db } from './config';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, Timestamp  } from 'firebase/firestore';
import type { Comment } from '@/types/comment';
import { logger } from '@/lib/utils/logger';

export const commentService = {
  
  async addComment(data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'comments'), {
        projectId: data.projectId,
        userId: data.userId,
        userDisplayName: data.userDisplayName,
        photoURL: data.photoURL || null,
        content: data.content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      logger.error('Error adding comment', error as Error, { projectId: data.projectId, userId: data.userId });
      throw error;
    }
  },

  async getProjectComments(projectId: string) {
    try {
      const q = query(
        collection(db, 'comments'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        // Convertir timestamps a Date al recuperar los datos
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date()
        };
      }) as Comment[];
    } catch (error) {
      logger.error('Error fetching comments', error as Error, { projectId });
      throw error;
    }
  }
  
};