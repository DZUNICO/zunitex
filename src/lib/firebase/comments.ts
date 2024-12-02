// lib/firebase/comments.ts
import { db } from './config';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, Timestamp  } from 'firebase/firestore';
import type { Comment } from '@/types/comment';

export const commentService = {
  
  async addComment(data: Omit<Comment, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'comments'), {
        projectId: data.projectId,
        userId: data.userId,
        userDisplayName: data.userDisplayName,
        photoURL: data.photoURL,
        content: data.content,
        createdAt: serverTimestamp(), // Cambiado aquí
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
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
      console.error('Error fetching comments:', error);
      throw error;
    }
  }
};