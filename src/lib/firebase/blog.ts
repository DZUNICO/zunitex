import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  limit,
  Timestamp,
  serverTimestamp,
  addDoc,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './config';
import type { BlogPost, CreateBlogPostData } from '@/types/blog';
import { logger } from '@/lib/utils/logger';

// Helper para convertir Timestamp a Date
const convertTimestampToDate = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else if (timestamp?._seconds) {
    // Para manejar timestamps serializados
    return new Timestamp(timestamp._seconds, timestamp._nanoseconds).toDate();
  }
  return new Date();
};

// Helper para convertir los datos del documento
const convertDocData = (doc: any): BlogPost => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: convertTimestampToDate(data.createdAt),
    updatedAt: data.updatedAt ? convertTimestampToDate(data.updatedAt) : convertTimestampToDate(data.createdAt)
  } as BlogPost;
};

export const blogService = {
  async getPublishedPosts(options = { limit: 10 }) {
    try {
      const q = query(
        collection(db, 'blog-posts'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(options.limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(convertDocData);
    } catch (error) {
      logger.error('Error fetching published posts', error as Error);
      throw error;
    }
  },

  async getPosts(options = { limit: 10 }) {
    try {
      const q = query(
        collection(db, 'blog-posts'),
        orderBy('createdAt', 'desc'),
        limit(options.limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(convertDocData);
    } catch (error) {
      logger.error('Error fetching posts', error as Error);
      throw error;
    }
  },

  async createPost(data: CreateBlogPostData): Promise<string> {
    try {
      const postData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0
      };

      const docRef = await addDoc(collection(db, 'blog-posts'), postData);
      return docRef.id;
    } catch (error) {
      logger.error('Error creating post', error as Error, { authorId: data.authorId });
      throw error;
    }
  },

  async updatePost(id: string, postData: Partial<BlogPost>) {
    try {
      const postRef = doc(db, 'blog-posts', id);
      const updateData = {
        ...postData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(postRef, updateData);
      
      // Obtener el documento actualizado
      const updatedDoc = await getDoc(postRef);
      return convertDocData(updatedDoc);
    } catch (error) {
      logger.error('Error updating post', error as Error, { postId: id });
      throw error;
    }
  },

  async getPostById(id: string): Promise<BlogPost | null> {
    try {
      const docRef = doc(db, 'blog-posts', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return convertDocData(docSnap);
    } catch (error) {
      logger.error('Error fetching post', error as Error, { postId: id });
      throw error;
    }
  },
};