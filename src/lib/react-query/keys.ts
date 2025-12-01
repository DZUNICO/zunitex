/**
 * Query Keys centralizados para React Query
 * Uso: import { queryKeys } from '@/lib/react-query/keys'
 */

import type { ProjectFilters, BlogFilters, ResourceFilters, ReviewFilters, CommunityFilters } from './types';

export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: ProjectFilters) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },

  // Comments
  comments: {
    all: ['comments'] as const,
    lists: () => [...queryKeys.comments.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.comments.lists(), projectId] as const,
  },

  // Blog
  blog: {
    all: ['blog'] as const,
    lists: () => [...queryKeys.blog.all, 'list'] as const,
    list: (filters?: BlogFilters) => [...queryKeys.blog.lists(), filters] as const,
    details: () => [...queryKeys.blog.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.blog.details(), id] as const,
    comments: () => [...queryKeys.blog.all, 'comments'] as const,
    commentsList: (postId: string) => [...queryKeys.blog.comments(), postId] as const,
    likes: () => [...queryKeys.blog.all, 'likes'] as const,
    likeStatus: (postId: string, userId: string) => [...queryKeys.blog.likes(), postId, userId] as const,
  },

  // Community
  community: {
    all: ['community'] as const,
    lists: () => [...queryKeys.community.all, 'list'] as const,
    list: (filters?: CommunityFilters) => [...queryKeys.community.lists(), filters] as const,
    details: () => [...queryKeys.community.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.community.details(), id] as const,
    comments: () => [...queryKeys.community.all, 'comments'] as const,
    commentsList: (postId: string) => [...queryKeys.community.comments(), postId] as const,
    likes: () => [...queryKeys.community.all, 'likes'] as const,
    likeStatus: (postId: string, userId: string) => [...queryKeys.community.likes(), postId, userId] as const,
  },

  // Profile
  profile: {
    all: ['profile'] as const,
    detail: (userId: string) => [...queryKeys.profile.all, userId] as const,
  },

  // Followers
  followers: {
    all: ['followers'] as const,
    lists: () => [...queryKeys.followers.all, 'list'] as const,
    followers: (userId: string) => [...queryKeys.followers.lists(), 'followers', userId] as const,
    following: (userId: string) => [...queryKeys.followers.lists(), 'following', userId] as const,
    status: (followerId: string, followingId: string) => 
      [...queryKeys.followers.all, 'status', followerId, followingId] as const,
  },

  // Resources
  resources: {
    all: ['resources'] as const,
    lists: () => [...queryKeys.resources.all, 'list'] as const,
    list: (filters?: ResourceFilters) => [...queryKeys.resources.lists(), filters] as const,
    details: () => [...queryKeys.resources.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.resources.details(), id] as const,
  },

  // Reviews
  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (filters?: ReviewFilters) => [...queryKeys.reviews.lists(), filters] as const,
    details: () => [...queryKeys.reviews.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reviews.details(), id] as const,
  },
} as const;

