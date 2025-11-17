import { db } from './config';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  getDocs,
  getDoc,
  getCountFromServer,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';
import type { Follower, FollowerStats } from '@/types/followers';
import { followUserSchema, type FollowUserInput } from '@/lib/validations/followers';

export const followersService = {
  async followUser(data: FollowUserInput): Promise<string> {
    try {
      // Validar con Zod
      const validatedData = followUserSchema.parse(data);
      
      // Verificar si ya existe la relación
      const q = query(
        collection(db, 'followers'),
        where('followerId', '==', validatedData.followerId),
        where('followingId', '==', validatedData.followingId)
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        throw new Error('Ya sigues a este usuario');
      }

      // No permitir seguirse a sí mismo
      if (validatedData.followerId === validatedData.followingId) {
        throw new Error('No puedes seguirte a ti mismo');
      }

      const docRef = await addDoc(collection(db, 'followers'), {
        followerId: validatedData.followerId,
        followingId: validatedData.followingId,
        followerName: validatedData.followerName,
        followerAvatar: validatedData.followerAvatar || null,
        followingName: validatedData.followingName,
        followingAvatar: validatedData.followingAvatar || null,
        createdAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      logger.error('Error following user', error as Error, { 
        followerId: data.followerId, 
        followingId: data.followingId 
      });
      throw error;
    }
  },

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'followers'),
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('No sigues a este usuario');
      }

      await Promise.all(
        snapshot.docs.map(doc => deleteDoc(doc.ref))
      );
    } catch (error) {
      logger.error('Error unfollowing user', error as Error, { followerId, followingId });
      throw error;
    }
  },

  async getUserFollowers(userId: string, pageLimit?: number): Promise<Follower[]> {
    try {
      let q = query(
        collection(db, 'followers'),
        where('followingId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (pageLimit) {
        q = query(q, limit(pageLimit));
      }

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          followerId: data.followerId,
          followingId: data.followingId,
          followerName: data.followerName || '',
          followerAvatar: data.followerAvatar || undefined,
          followingName: data.followingName || '',
          followingAvatar: data.followingAvatar || undefined,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as Follower;
      });
    } catch (error) {
      logger.error('Error fetching followers', error as Error, { userId });
      throw error;
    }
  },

  async getUserFollowing(userId: string, pageLimit?: number): Promise<Follower[]> {
    try {
      let q = query(
        collection(db, 'followers'),
        where('followerId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (pageLimit) {
        q = query(q, limit(pageLimit));
      }

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          followerId: data.followerId,
          followingId: data.followingId,
          followerName: data.followerName || '',
          followerAvatar: data.followerAvatar || undefined,
          followingName: data.followingName || '',
          followingAvatar: data.followingAvatar || undefined,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as Follower;
      });
    } catch (error) {
      logger.error('Error fetching following', error as Error, { userId });
      throw error;
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'followers'),
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      logger.error('Error checking follow status', error as Error);
      return false;
    }
  },

  async getFollowerCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'followers'),
        where('followingId', '==', userId)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      logger.error('Error getting follower count', error as Error, { userId });
      throw error;
    }
  },

  async getFollowingCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'followers'),
        where('followerId', '==', userId)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      logger.error('Error getting following count', error as Error, { userId });
      throw error;
    }
  },

  async getFollowerStats(userId: string): Promise<FollowerStats> {
    try {
      const [followersCount, followingCount] = await Promise.all([
        this.getFollowerCount(userId),
        this.getFollowingCount(userId),
      ]);

      return {
        followersCount,
        followingCount,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Error getting follower stats', error as Error, { userId });
      throw error;
    }
  },
};

