import { Timestamp } from 'firebase/firestore';

export interface Follower {
  id: string;
  followerId: string;        // Usuario que sigue
  followingId: string;       // Usuario seguido
  followerName: string;
  followerAvatar?: string;
  followingName: string;
  followingAvatar?: string;
  createdAt: Timestamp | Date;
}

export interface FollowerStats {
  followersCount: number;
  followingCount: number;
  lastUpdated: Timestamp | Date;
}

