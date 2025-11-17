import { Timestamp } from 'firebase/firestore';

export type UserRole = 'technician' | 'engineer' | 'vendor' | 'company';
export type PostCategory = 'question' | 'discussion' | 'showcase' | 'tip' | 'news';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: UserRole;
  content: string;
  images?: string[];         // URLs de imágenes
  category: PostCategory;
  tags: string[];
  likes: number;
  commentsCount: number;
  views: number;
  isPinned: boolean;         // Para posts destacados
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Timestamp | Date;
}

export interface CommunityFilters {
  category?: PostCategory;
  userId?: string;
  tags?: string[];
  isPinned?: boolean;
  search?: string;
}

