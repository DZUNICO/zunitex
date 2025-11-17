import { db } from './config';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';

export interface BlogLike {
  id?: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export const blogLikesService = {
  async likePost(userId: string, postId: string): Promise<void> {
    try {
      // Verificar si ya existe el like
      const likeQuery = query(
        collection(db, 'blog-likes'),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const existingLike = await getDocs(likeQuery);

      if (!existingLike.empty) {
        throw new Error('Ya has dado like a este post');
      }

      // Crear like y actualizar contador
      await Promise.all([
        addDoc(collection(db, 'blog-likes'), {
          userId,
          postId,
          createdAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'blog-posts', postId), {
          likesCount: increment(1),
        }),
      ]);
    } catch (error) {
      logger.error('Error liking blog post', error as Error, { userId, postId });
      throw error;
    }
  },

  async unlikePost(userId: string, postId: string): Promise<void> {
    try {
      const likeQuery = query(
        collection(db, 'blog-likes'),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const existingLike = await getDocs(likeQuery);

      if (existingLike.empty) {
        throw new Error('No has dado like a este post');
      }

      // Eliminar like y actualizar contador
      await Promise.all([
        ...existingLike.docs.map(doc => deleteDoc(doc.ref)),
        updateDoc(doc(db, 'blog-posts', postId), {
          likesCount: increment(-1),
        }),
      ]);
    } catch (error) {
      logger.error('Error unliking blog post', error as Error, { userId, postId });
      throw error;
    }
  },

  async isPostLiked(userId: string, postId: string): Promise<boolean> {
    try {
      const likeQuery = query(
        collection(db, 'blog-likes'),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(likeQuery);
      return !snapshot.empty;
    } catch (error) {
      logger.error('Error checking blog post like status', error as Error);
      return false;
    }
  },

  async getPostLikesCount(postId: string): Promise<number> {
    try {
      const likeQuery = query(
        collection(db, 'blog-likes'),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(likeQuery);
      return snapshot.size;
    } catch (error) {
      logger.error('Error getting blog post likes count', error as Error, { postId });
      throw error;
    }
  },
};

