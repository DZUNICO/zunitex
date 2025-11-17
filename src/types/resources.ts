import { Timestamp } from 'firebase/firestore';

export type ResourceCategory = 'diagram' | 'document' | 'photo' | 'video' | 'tool' | 'guide';
export type ResourceSubcategory = 'residential' | 'industrial' | 'solar' | 'commercial' | 'maintenance' | 'safety';

export interface Resource {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  category: ResourceCategory;
  subcategory?: ResourceSubcategory;
  fileUrl: string;           // Firebase Storage URL
  fileName: string;
  fileSize: number;
  fileType: string;          // MIME type
  thumbnailUrl?: string;
  tags: string[];
  downloads: number;
  likes: number;
  views: number;
  isPublic: boolean;
  isPremium: boolean;        // Para futuro sistema premium
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface ResourceLike {
  id: string;
  userId: string;
  resourceId: string;
  createdAt: Timestamp | Date;
}

export interface ResourceFilters {
  userId?: string;
  category?: ResourceCategory;
  subcategory?: ResourceSubcategory;
  tags?: string[];
  isPublic?: boolean;
  search?: string;
}

