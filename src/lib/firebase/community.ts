import { db, storage } from './config';
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
  increment,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { logger } from '@/lib/utils/logger';
import type { CommunityPost, PostComment, PostLike, CommunityFilters } from '@/types/community';

export interface CommunityPostPage {
  posts: CommunityPost[];
  nextCursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export const communityService = {
  async getPosts(
    options: {
      limit?: number;
      cursor?: QueryDocumentSnapshot | null;
      filters?: CommunityFilters;
    } = {}
  ): Promise<CommunityPostPage> {
    try {
      const { limit: pageLimit = 10, cursor, filters = {} } = options;
      
      let q = query(
        collection(db, 'community-posts'),
        orderBy('isPinned', 'desc'), // Posts fijados primero
        orderBy('createdAt', 'desc')
      );

      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.isPinned !== undefined) {
        q = query(q, where('isPinned', '==', filters.isPinned));
      }

      q = query(q, limit(pageLimit + 1));
      
      if (cursor) {
        q = query(q, startAfter(cursor));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > pageLimit;
      let posts = (hasMore ? docs.slice(0, pageLimit) : docs).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar || undefined,
          userRole: data.userRole,
          content: data.content,
          images: data.images || [],
          category: data.category,
          tags: data.tags || [],
          likes: data.likes || 0,
          commentsCount: data.commentsCount || 0,
          views: data.views || 0,
          isPinned: data.isPinned || false,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: data.updatedAt 
            ? ((data.updatedAt as Timestamp)?.toDate() || new Date())
            : new Date(),
        } as CommunityPost;
      });

      // Filtrar por tags o búsqueda si se especifica
      if (filters.tags && filters.tags.length > 0) {
        posts = posts.filter(p => 
          filters.tags!.some(tag => p.tags.includes(tag))
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        posts = posts.filter(p => 
          p.content.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return {
        posts,
        nextCursor: hasMore ? docs[pageLimit] : null,
        hasMore,
      };
    } catch (error) {
      logger.error('Error fetching community posts', error as Error);
      throw error;
    }
  },

  async getPost(postId: string): Promise<CommunityPost | null> {
    try {
      const docRef = doc(db, 'community-posts', postId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        images: data.images || [],
        tags: data.tags || [],
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: data.updatedAt 
          ? ((data.updatedAt as Timestamp)?.toDate() || new Date())
          : new Date(),
      } as CommunityPost;
    } catch (error) {
      logger.error('Error fetching post', error as Error, { postId });
      throw error;
    }
  },

  async createPost(data: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'commentsCount' | 'views'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'community-posts'), {
        ...data,
        likes: 0,
        commentsCount: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating post', error as Error);
      throw error;
    }
  },

  async updatePost(postId: string, data: Partial<CommunityPost>): Promise<void> {
    try {
      const docRef = doc(db, 'community-posts', postId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Error updating post', error as Error, { postId });
      throw error;
    }
  },

  async deletePost(postId: string): Promise<void> {
    try {
      // Obtener el post para eliminar imágenes de Storage
      const postRef = doc(db, 'community-posts', postId);
      const postDoc = await getDoc(postRef);

      if (postDoc.exists()) {
        const postData = postDoc.data() as CommunityPost;
        
        // Eliminar imágenes de Storage
        if (postData.images && postData.images.length > 0) {
          await Promise.all(
            postData.images.map(async (imageUrl) => {
              try {
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
              } catch (error) {
                logger.warn('Error deleting image from storage', { imageUrl });
              }
            })
          );
        }
      }

      // Eliminar documento
      await deleteDoc(postRef);
    } catch (error) {
      logger.error('Error deleting post', error as Error, { postId });
      throw error;
    }
  },

  async likePost(userId: string, postId: string): Promise<void> {
    try {
      const likeQuery = query(
        collection(db, 'post-likes'),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const existingLike = await getDocs(likeQuery);

      if (!existingLike.empty) {
        throw new Error('Ya has dado like a este post');
      }

      await Promise.all([
        addDoc(collection(db, 'post-likes'), {
          userId,
          postId,
          createdAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'community-posts', postId), {
          likes: increment(1),
        }),
      ]);
    } catch (error) {
      logger.error('Error liking post', error as Error, { userId, postId });
      throw error;
    }
  },

  async unlikePost(userId: string, postId: string): Promise<void> {
    try {
      const likeQuery = query(
        collection(db, 'post-likes'),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const existingLike = await getDocs(likeQuery);

      if (existingLike.empty) {
        throw new Error('No has dado like a este post');
      }

      await Promise.all([
        ...existingLike.docs.map(doc => deleteDoc(doc.ref)),
        updateDoc(doc(db, 'community-posts', postId), {
          likes: increment(-1),
        }),
      ]);
    } catch (error) {
      logger.error('Error unliking post', error as Error, { userId, postId });
      throw error;
    }
  },

  async isPostLiked(userId: string, postId: string): Promise<boolean> {
    try {
      const likeQuery = query(
        collection(db, 'post-likes'),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(likeQuery);
      return !snapshot.empty;
    } catch (error) {
      logger.error('Error checking post like status', error as Error);
      return false;
    }
  },

  async incrementPostView(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'community-posts', postId);
      await updateDoc(postRef, {
        views: increment(1),
      });
    } catch (error) {
      logger.error('Error incrementing post view', error as Error, { postId });
      throw error;
    }
  },

  // ============================================================================
  // COMMENTS
  // ============================================================================

  async getPostComments(postId: string): Promise<PostComment[]> {
    try {
      const q = query(
        collection(db, 'post-comments'),
        where('postId', '==', postId),
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
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: data.updatedAt 
            ? ((data.updatedAt as Timestamp)?.toDate() || new Date())
            : undefined,
        } as PostComment;
      });
    } catch (error) {
      logger.error('Error fetching post comments', error as Error, { postId });
      throw error;
    }
  },

  async addPostComment(data: Omit<PostComment, 'id' | 'createdAt' | 'likes'>): Promise<string> {
    try {
      const commentRef = await addDoc(collection(db, 'post-comments'), {
        ...data,
        likes: 0,
        createdAt: serverTimestamp(),
      });

      // Incrementar contador de comentarios del post
      await updateDoc(doc(db, 'community-posts', data.postId), {
        commentsCount: increment(1),
      });

      return commentRef.id;
    } catch (error) {
      logger.error('Error adding post comment', error as Error);
      throw error;
    }
  },

  async updatePostComment(commentId: string, content: string): Promise<void> {
    try {
      const commentRef = doc(db, 'post-comments', commentId);
      await updateDoc(commentRef, {
        content,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Error updating post comment', error as Error, { commentId });
      throw error;
    }
  },

  async deletePostComment(commentId: string, postId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'post-comments', commentId));

      // Decrementar contador de comentarios del post
      await updateDoc(doc(db, 'community-posts', postId), {
        commentsCount: increment(-1),
      });
    } catch (error) {
      logger.error('Error deleting post comment', error as Error, { commentId });
      throw error;
    }
  },
};

