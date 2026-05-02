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
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';

export interface BlogComment {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  parentId?: string; // Para comentarios anidados (respuestas)
}

export const blogCommentsService = {
  async getPostComments(postId: string): Promise<BlogComment[]> {
    try {
      const q = query(
        collection(db, 'blog-comments'),
        where('postId', '==', postId),
        where('parentId', '==', null), // Solo comentarios principales
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          postId: data.postId,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar || undefined,
          content: data.content,
          likes: data.likes || 0,
          parentId: data.parentId || undefined,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: data.updatedAt 
            ? ((data.updatedAt as Timestamp)?.toDate() || new Date())
            : undefined,
        } as BlogComment;
      });
    } catch (error) {
      logger.error('Error fetching blog comments', error as Error, { postId });
      throw error;
    }
  },

  async getCommentReplies(commentId: string): Promise<BlogComment[]> {
    try {
      const q = query(
        collection(db, 'blog-comments'),
        where('parentId', '==', commentId),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: data.updatedAt 
            ? ((data.updatedAt as Timestamp)?.toDate() || new Date())
            : undefined,
        } as BlogComment;
      });
    } catch (error) {
      logger.error('Error fetching comment replies', error as Error, { commentId });
      throw error;
    }
  },

  async addComment(data: Omit<BlogComment, 'id' | 'createdAt' | 'likes'>): Promise<string> {
    try {
      const commentRef = await addDoc(collection(db, 'blog-comments'), {
        ...data,
        likes: 0,
        parentId: data.parentId || null,
        createdAt: serverTimestamp(),
      });

      // Intentar incrementar contador de comentarios del post
      // Si falla por permisos, no revertimos la creación del comentario
      try {
        await updateDoc(doc(db, 'blog-posts', data.postId), {
          commentsCount: increment(1),
        });
      } catch (counterError) {
        // Log del error pero no revertir la creación del comentario
        logger.error('Error incrementing blog post commentsCount', counterError as Error, { 
          postId: data.postId,
          commentId: commentRef.id 
        });
      }

      return commentRef.id;
    } catch (error) {
      logger.error('Error adding blog comment', error as Error);
      throw error;
    }
  },

  async updateComment(commentId: string, content: string): Promise<void> {
    try {
      const commentRef = doc(db, 'blog-comments', commentId);
      await updateDoc(commentRef, {
        content,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Error updating blog comment', error as Error, { commentId });
      throw error;
    }
  },

  async deleteComment(commentId: string, postId: string): Promise<void> {
    try {
      // Eliminar el comentario y sus respuestas
      const repliesQuery = query(
        collection(db, 'blog-comments'),
        where('parentId', '==', commentId)
      );
      const replies = await getDocs(repliesQuery);
      
      await Promise.all([
        deleteDoc(doc(db, 'blog-comments', commentId)),
        ...replies.docs.map(doc => deleteDoc(doc.ref)),
      ]);

      // Intentar decrementar contador de comentarios del post
      // Si falla por permisos, no revertimos la eliminación del comentario
      const totalToDecrement = 1 + replies.docs.length;
      try {
        await updateDoc(doc(db, 'blog-posts', postId), {
          commentsCount: increment(-totalToDecrement),
        });
      } catch (counterError) {
        // Log del error pero no revertir la eliminación del comentario
        logger.error('Error decrementing blog post commentsCount', counterError as Error, { 
          postId,
          commentId 
        });
      }
    } catch (error) {
      logger.error('Error deleting blog comment', error as Error, { commentId });
      throw error;
    }
  },
};

