import * as admin from "firebase-admin";

// Tipos para Post Likes
export interface PostLikeData {
  userId: string;
  postId: string;
  createdAt: admin.firestore.FieldValue;
}

// Tipos para Blog Likes
export interface BlogLikeData {
  userId: string;
  postId: string;
  createdAt: admin.firestore.FieldValue;
}

// Tipos para Resource Likes
export interface ResourceLikeData {
  userId: string;
  resourceId: string;
  createdAt: admin.firestore.FieldValue;
}

// Tipos para Followers
export interface FollowerData {
  followerId: string;
  followingId: string;
  followerName: string;
  followingAvatar?: string;
  followingName: string;
  createdAt: admin.firestore.FieldValue;
}

// Tipos para Reviews
export interface ReviewData {
  reviewerId: string;
  reviewedUserId: string;
  rating: number;
  comment: string;
  category: string;
  createdAt: admin.firestore.FieldValue;
}

// Tipo genérico para respuestas
export interface CloudFunctionResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}


