/**
 * Archivo centralizado de queries de React Query
 * Todas las queries de Firestore están aquí organizadas por entidad
 */

import { 
  useQuery, 
  useInfiniteQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { useAuth } from '@/lib/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/utils/logger';
import { getFirebaseErrorMessage } from '@/lib/utils/logger';

// Services
import { projectsService } from '@/lib/firebase/projects';
import { commentService } from '@/lib/firebase/comments';
import { blogService } from '@/lib/firebase/blog';
import { blogCommentsService } from '@/lib/firebase/blog-comments';
import { blogLikesService } from '@/lib/firebase/blog-likes';
import { followersService } from '@/lib/firebase/followers';
import { resourcesService } from '@/lib/firebase/resources';
import { reviewsService } from '@/lib/firebase/reviews';
import { communityService } from '@/lib/firebase/community';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Types
import type { Project, CreateProjectData } from '@/types/project';
import type { Comment } from '@/types/comment';
import type { BlogPost, CreateBlogPostData } from '@/types/blog';
import type { BlogComment } from '@/lib/firebase/blog-comments';
import type { UserProfile } from '@/types/profile';
import type { Follower } from '@/types/followers';
import type { Resource, ResourceFilters } from '@/types/resources';
import type { Review, ReviewFilters } from '@/types/reviews';
import type { CommunityPost, PostComment, CommunityFilters } from '@/types/community';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

// ============================================================================
// QUERY KEYS - Organizados por entidad
// ============================================================================

export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: ProjectFilters) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
  comments: {
    all: ['comments'] as const,
    lists: () => [...queryKeys.comments.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.comments.lists(), projectId] as const,
  },
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
  profile: {
    all: ['profile'] as const,
    detail: (userId: string) => [...queryKeys.profile.all, userId] as const,
  },
  followers: {
    all: ['followers'] as const,
    lists: () => [...queryKeys.followers.all, 'list'] as const,
    followers: (userId: string) => [...queryKeys.followers.lists(), 'followers', userId] as const,
    following: (userId: string) => [...queryKeys.followers.lists(), 'following', userId] as const,
    status: (followerId: string, followingId: string) => 
      [...queryKeys.followers.all, 'status', followerId, followingId] as const,
  },
  resources: {
    all: ['resources'] as const,
    lists: () => [...queryKeys.resources.all, 'list'] as const,
    list: (filters?: ResourceFilters) => [...queryKeys.resources.lists(), filters] as const,
    details: () => [...queryKeys.resources.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.resources.details(), id] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (filters?: ReviewFilters) => [...queryKeys.reviews.lists(), filters] as const,
    details: () => [...queryKeys.reviews.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reviews.details(), id] as const,
  },
};

// ============================================================================
// TYPES PARA FILTROS
// ============================================================================

export interface ProjectFilters {
  userId?: string;
  status?: string;
  category?: string;
}

export interface BlogFilters {
  category?: string;
  status?: 'published' | 'draft';
}

export interface ResourceFilters {
  userId?: string;
  type?: Resource['type'];
  category?: string;
}

export interface ReviewFilters {
  userId?: string;
  projectId?: string;
  reviewedUserId?: string;
  reviewerId?: string;
  category?: string;
  minRating?: number;
}

// ============================================================================
// PROJECTS QUERIES
// ============================================================================

/**
 * Hook para obtener proyectos con paginación infinita
 */
export function useProjects(filters?: ProjectFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: async ({ pageParam = null }) => {
      logger.debug('Fetching projects page', { filters, pageParam: !!pageParam });
      return await projectsService.getProjects({
        limit: 10,
        cursor: pageParam as QueryDocumentSnapshot | null,
        ...filters,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as QueryDocumentSnapshot | null,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos relativamente estáticos
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
  });
}

/**
 * Hook para obtener proyectos del usuario (sin paginación infinita)
 */
export function useUserProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.projects.list({ userId: user?.uid }),
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }
      
      logger.debug('Fetching user projects', { userId: user.uid });
      const projects = await projectsService.getUserProjects(user.uid);
      
      return projects.map((project) => ({
        ...project,
        images: project.images || [],
        tags: project.tags || [],
      })) as Project[];
    },
    enabled: !!user?.uid,
    staleTime: 2 * 60 * 1000, // 2 minutos - datos del usuario cambian más frecuentemente
  });
}

/**
 * Hook para obtener un proyecto específico
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId || ''),
    queryFn: async () => {
      if (!projectId) {
        throw new Error('ID de proyecto requerido');
      }
      
      logger.debug('Fetching project', { projectId });
      const project = await projectsService.getProject(projectId);
      
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }
      
      return project;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutos - detalles de proyecto son estáticos
  });
}

/**
 * Hook para crear un proyecto con optimistic update
 */
export function useCreateProject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProjectData) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      logger.info('Creating project', { userId: user.uid });
      
      const newProjectData: Omit<Project, 'id'> = {
        ...data,
        createdBy: user.uid,
        createdAt: new Date(),
        status: data.status || 'Pendiente',
        images: data.images || [],
        tags: data.tags || [],
        clientId: data.clientId || user.uid,
        startDate: data.startDate || new Date(),
      };

      const projectId = await projectsService.createProject(newProjectData);
      return { projectId, project: { ...newProjectData, id: projectId } as Project };
    },
    onMutate: async (newData) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.lists() });

      // Snapshot del estado anterior
      const previousProjects = queryClient.getQueryData<Project[]>(
        queryKeys.projects.list({ userId: user?.uid })
      );

      // Optimistic update
      if (previousProjects && user?.uid) {
        const optimisticProject: Project = {
          ...newData as any,
          id: 'temp-' + Date.now(),
          createdBy: user.uid,
          createdAt: new Date(),
          status: newData.status || 'Pendiente',
          images: newData.images || [],
          tags: newData.tags || [],
        };

        queryClient.setQueryData<Project[]>(
          queryKeys.projects.list({ userId: user.uid }),
          [optimisticProject, ...previousProjects]
        );
      }

      return { previousProjects };
    },
    onError: (error, variables, context) => {
      // Rollback en caso de error
      if (context?.previousProjects && user?.uid) {
        queryClient.setQueryData(
          queryKeys.projects.list({ userId: user.uid }),
          context.previousProjects
        );
      }
      logger.error('Error creating project', error as Error, { userId: user?.uid });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (data) => {
      // Invalidar y refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      toast({
        title: 'Proyecto creado',
        description: 'El proyecto ha sido creado exitosamente.',
      });
    },
  });
}

/**
 * Hook para actualizar un proyecto
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: Partial<Project> }) => {
      logger.info('Updating project', { projectId });
      await projectsService.updateProject(projectId, data);
      return { projectId, data };
    },
    onMutate: async ({ projectId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.detail(projectId) });
      
      const previousProject = queryClient.getQueryData<Project>(
        queryKeys.projects.detail(projectId)
      );

      if (previousProject) {
        queryClient.setQueryData<Project>(
          queryKeys.projects.detail(projectId),
          { ...previousProject, ...data }
        );
      }

      return { previousProject };
    },
    onError: (error, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          queryKeys.projects.detail(variables.projectId),
          context.previousProject
        );
      }
      logger.error('Error updating project', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
      toast({
        title: 'Proyecto actualizado',
        description: 'Los cambios han sido guardados exitosamente.',
      });
    },
  });
}

/**
 * Hook para eliminar un proyecto
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (projectId: string) => {
      logger.info('Deleting project', { projectId });
      await projectsService.deleteProject(projectId);
      return projectId;
    },
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.lists() });
      
      const previousProjects = queryClient.getQueriesData<Project[]>({
        queryKey: queryKeys.projects.lists(),
      });

      // Remover optimísticamente
      previousProjects.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(
            queryKey,
            data.filter(p => p.id !== projectId)
          );
        }
      });

      return { previousProjects };
    },
    onError: (error, projectId, context) => {
      // Rollback
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      logger.error('Error deleting project', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto ha sido eliminado exitosamente.',
      });
    },
  });
}

// ============================================================================
// COMMENTS QUERIES
// ============================================================================

/**
 * Hook para obtener comentarios de un proyecto
 */
export function useProjectComments(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.comments.list(projectId || ''),
    queryFn: async () => {
      if (!projectId) {
        throw new Error('ID de proyecto requerido');
      }

      logger.debug('Fetching project comments', { projectId });
      return await commentService.getProjectComments(projectId);
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutos - comentarios pueden cambiar frecuentemente
  });
}

/**
 * Hook para agregar un comentario con optimistic update
 */
export function useAddComment() {
  const { user } = useAuth();
  // useUserProfile se define más abajo, pero está bien porque se ejecuta en runtime
  const profileQuery = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, content }: { projectId: string; content: string }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      logger.info('Adding comment', { projectId, userId: user.uid });
      
      await commentService.addComment({
        projectId,
        userId: user.uid,
        userDisplayName: profileQuery.data?.displayName || 'Usuario',
        photoURL: profileQuery.data?.photoURL || null,
        content,
        createdAt: new Date(),
      });
    },
    onMutate: async ({ projectId, content }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.list(projectId) });

      const previousComments = queryClient.getQueryData<Comment[]>(
        queryKeys.comments.list(projectId)
      );

      if (previousComments && user?.uid && profileQuery.data) {
        const optimisticComment: Comment = {
          id: 'temp-' + Date.now(),
          projectId,
          userId: user.uid,
          userDisplayName: profileQuery.data.displayName || 'Usuario',
          photoURL: profileQuery.data.photoURL || null,
          content,
          createdAt: new Date(),
        };

        queryClient.setQueryData<Comment[]>(
          queryKeys.comments.list(projectId),
          [...previousComments, optimisticComment]
        );
      }

      return { previousComments };
    },
    onError: (error, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.comments.list(variables.projectId),
          context.previousComments
        );
      }
      logger.error('Error adding comment', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(variables.projectId) });
      toast({
        title: 'Comentario añadido',
        description: 'Tu comentario ha sido publicado.',
      });
    },
  });
}

// ============================================================================
// BLOG QUERIES
// ============================================================================

/**
 * Hook para obtener posts del blog con paginación infinita
 */
export function useBlogPosts(filters?: BlogFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.blog.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      logger.debug('Fetching blog posts', { filters, page: pageParam });
      const posts = await blogService.getPublishedPosts({ limit: 10 });
      // Nota: blogService actual no tiene paginación, esto es un placeholder
      return {
        posts,
        nextCursor: posts.length === 10 ? (pageParam as number) + 1 : null,
        hasMore: posts.length === 10,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 10 * 60 * 1000, // 10 minutos - posts del blog son muy estáticos
    gcTime: 30 * 60 * 1000, // 30 minutos en caché
  });
}

/**
 * Hook para obtener comentarios de un post del blog
 */
export function useBlogComments(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blog.commentsList(postId || ''),
    queryFn: async () => {
      if (!postId) {
        throw new Error('ID de post requerido');
      }

      logger.debug('Fetching blog comments', { postId });
      return await blogCommentsService.getPostComments(postId);
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para agregar comentario a un post del blog
 */
export function useAddBlogComment() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      logger.info('Adding blog comment', { postId, userId: user.uid });
      
      return await blogCommentsService.addComment({
        postId,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Usuario',
        userAvatar: profile?.photoURL || user.photoURL || null,
        content,
        parentId,
      });
    },
    onMutate: async ({ postId, content, parentId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.blog.commentsList(postId) });

      const previousComments = queryClient.getQueryData<BlogComment[]>(
        queryKeys.blog.commentsList(postId)
      );

      if (previousComments && user?.uid && profile) {
        const optimisticComment: BlogComment = {
          id: 'temp-' + Date.now(),
          postId,
          userId: user.uid,
          userName: profile.displayName || 'Usuario',
          userAvatar: profile.photoURL || undefined,
          content,
          parentId,
          likes: 0,
          createdAt: new Date(),
        };

        queryClient.setQueryData<BlogComment[]>(
          queryKeys.blog.commentsList(postId),
          [...previousComments, optimisticComment]
        );
      }

      return { previousComments };
    },
    onError: (error, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.blog.commentsList(variables.postId),
          context.previousComments
        );
      }
      logger.error('Error adding blog comment', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blog.commentsList(variables.postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blog.detail(variables.postId) });
      toast({
        title: 'Comentario añadido',
        description: 'Tu comentario ha sido publicado.',
      });
    },
  });
}

/**
 * Hook para verificar si un post del blog está liked
 */
export function useIsBlogPostLiked(postId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.blog.likeStatus(postId || '', user?.uid || ''),
    queryFn: async () => {
      if (!postId || !user?.uid) {
        return false;
      }

      return await blogLikesService.isPostLiked(user.uid, postId);
    },
    enabled: !!postId && !!user?.uid,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para dar like/unlike a un post del blog
 */
export function useLikeBlogPost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      if (like) {
        await blogLikesService.likePost(user.uid, postId);
      } else {
        await blogLikesService.unlikePost(user.uid, postId);
      }
      return { postId, like };
    },
    onMutate: async ({ postId, like }) => {
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.blog.likeStatus(postId, user?.uid || '') 
      });

      const previousStatus = queryClient.getQueryData<boolean>(
        queryKeys.blog.likeStatus(postId, user?.uid || '')
      );

      // Optimistic update
      queryClient.setQueryData(
        queryKeys.blog.likeStatus(postId, user?.uid || ''),
        like
      );

      return { previousStatus };
    },
    onError: (error, variables, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          queryKeys.blog.likeStatus(variables.postId, user?.uid || ''),
          context.previousStatus
        );
      }
      logger.error('Error liking/unliking blog post', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.blog.likeStatus(variables.postId, user?.uid || '') 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.blog.detail(variables.postId) 
      });
    },
  });
}

/**
 * Hook para obtener un post específico
 */
export function useBlogPost(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blog.detail(postId || ''),
    queryFn: async () => {
      if (!postId) {
        throw new Error('ID de post requerido');
      }

      logger.debug('Fetching blog post', { postId });
      const post = await blogService.getPostById(postId);
      
      if (!post) {
        throw new Error('Post no encontrado');
      }
      
      return post;
    },
    enabled: !!postId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// ============================================================================
// PROFILE QUERIES
// ============================================================================

/**
 * Hook para obtener el perfil del usuario
 */
export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.profile.detail(user?.uid || ''),
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      logger.debug('Fetching user profile', { userId: user.uid });
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Perfil no encontrado');
      }

      return docSnap.data() as UserProfile;
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para actualizar el perfil
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      logger.info('Updating user profile', { userId: user.uid });
      const docRef = doc(db, 'users', user.uid);
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(user?.uid || '') });
      toast({
        title: 'Perfil actualizado',
        description: 'Los cambios han sido guardados exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error updating profile', error as Error, { userId: user?.uid });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

// ============================================================================
// FOLLOWERS QUERIES
// ============================================================================

/**
 * Hook para obtener seguidores de un usuario
 */
export function useFollowers(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.followers.followers(userId || ''),
    queryFn: async () => {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      logger.debug('Fetching followers', { userId });
      return await followersService.getUserFollowers(userId);
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para obtener usuarios que sigue un usuario
 */
export function useFollowing(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.followers.following(userId || ''),
    queryFn: async () => {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      logger.debug('Fetching following', { userId });
      return await followersService.getUserFollowing(userId);
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para verificar si un usuario sigue a otro
 */
export function useIsFollowing(followerId: string | undefined, followingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.followers.status(followerId || '', followingId || ''),
    queryFn: async () => {
      if (!followerId || !followingId) {
        return false;
      }

      return await followersService.isFollowing(followerId, followingId);
    },
    enabled: !!followerId && !!followingId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para seguir/dejar de seguir un usuario con optimistic update
 */
export function useFollowUser() {
  const { user } = useAuth();
  const { data: currentUserProfile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      followingId, 
      follow, 
      followingName, 
      followingAvatar 
    }: { 
      followingId: string; 
      follow: boolean;
      followingName?: string;
      followingAvatar?: string;
    }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      if (follow) {
        // Obtener datos del usuario a seguir si no se proporcionaron
        let targetUserName = followingName;
        let targetUserAvatar = followingAvatar;

        if (!targetUserName) {
          const targetUserDoc = await getDoc(doc(db, 'users', followingId));
          if (targetUserDoc.exists()) {
            const targetUserData = targetUserDoc.data();
            targetUserName = targetUserData.displayName || 'Usuario';
            targetUserAvatar = targetUserData.photoURL || null;
          }
        }

        await followersService.followUser({
          followerId: user.uid,
          followingId,
          followerName: currentUserProfile?.displayName || user.displayName || 'Usuario',
          followerAvatar: currentUserProfile?.photoURL || user.photoURL || null,
          followingName: targetUserName || 'Usuario',
          followingAvatar: targetUserAvatar || null,
        });
      } else {
        await followersService.unfollowUser(user.uid, followingId);
      }
      return { followingId, follow };
    },
    onMutate: async ({ followingId, follow }) => {
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.followers.status(user?.uid || '', followingId) 
      });

      const previousStatus = queryClient.getQueryData<boolean>(
        queryKeys.followers.status(user?.uid || '', followingId)
      );

      // Optimistic update
      queryClient.setQueryData(
        queryKeys.followers.status(user?.uid || '', followingId),
        follow
      );

      return { previousStatus };
    },
    onError: (error, variables, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          queryKeys.followers.status(user?.uid || '', variables.followingId),
          context.previousStatus
        );
      }
      logger.error('Error following/unfollowing user', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.followers.status(user?.uid || '', variables.followingId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.followers.followers(variables.followingId) 
      });
      toast({
        title: variables.follow ? 'Usuario seguido' : 'Dejaste de seguir',
        description: variables.follow 
          ? 'Ahora sigues a este usuario.' 
          : 'Ya no sigues a este usuario.',
      });
    },
  });
}

// ============================================================================
// RESOURCES QUERIES
// ============================================================================

/**
 * Hook para obtener recursos con paginación infinita
 */
export function useResources(filters?: ResourceFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.resources.list(filters),
    queryFn: async ({ pageParam = null }) => {
      logger.debug('Fetching resources page', { filters, pageParam: !!pageParam });
      return await resourcesService.getResources({
        limit: 10,
        cursor: pageParam as QueryDocumentSnapshot | null,
        filters,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as QueryDocumentSnapshot | null,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos en caché
  });
}

/**
 * Hook para dar like/unlike a un recurso
 */
export function useLikeResource() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ resourceId, like }: { resourceId: string; like: boolean }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      if (like) {
        await resourcesService.likeResource(user.uid, resourceId);
      } else {
        await resourcesService.unlikeResource(user.uid, resourceId);
      }
      return { resourceId, like };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.detail(variables.resourceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.lists() });
    },
    onError: (error) => {
      logger.error('Error liking/unliking resource', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

/**
 * Hook para obtener un recurso específico
 */
export function useResource(resourceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.resources.detail(resourceId || ''),
    queryFn: async () => {
      if (!resourceId) {
        throw new Error('ID de recurso requerido');
      }

      logger.debug('Fetching resource', { resourceId });
      const resource = await resourcesService.getResource(resourceId);
      
      if (!resource) {
        throw new Error('Recurso no encontrado');
      }
      
      return resource;
    },
    enabled: !!resourceId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================================================
// REVIEWS QUERIES
// ============================================================================

/**
 * Hook para obtener reviews con paginación infinita
 */
export function useReviews(filters?: ReviewFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.reviews.list(filters),
    queryFn: async ({ pageParam = null }) => {
      logger.debug('Fetching reviews page', { filters, pageParam: !!pageParam });
      return await reviewsService.getReviews({
        limit: 10,
        cursor: pageParam as QueryDocumentSnapshot | null,
        filters,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as QueryDocumentSnapshot | null,
    staleTime: 3 * 60 * 1000, // 3 minutos - reviews pueden cambiar
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
  });
}

/**
 * Hook para crear una review
 */
export function useCreateReview() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'reviewerName' | 'reviewerAvatar'>) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      return await reviewsService.createReview({
        ...data,
        reviewerId: user.uid,
        reviewerName: profile?.displayName || user.displayName || 'Usuario',
        reviewerAvatar: profile?.photoURL || user.photoURL || null,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.lists() });
      if (variables.reviewedUserId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.reviews.list({ reviewedUserId: variables.reviewedUserId }) 
        });
      }
      toast({
        title: 'Reseña creada',
        description: 'Tu reseña ha sido publicada exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error creating review', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

/**
 * Hook para obtener el rating de un usuario
 */
export function useUserRating(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-rating', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      return await reviewsService.getUserRating(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un review específico
 */
export function useReview(reviewId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews.detail(reviewId || ''),
    queryFn: async () => {
      if (!reviewId) {
        throw new Error('ID de review requerido');
      }

      logger.debug('Fetching review', { reviewId });
      const review = await reviewsService.getReview(reviewId);
      
      if (!review) {
        throw new Error('Review no encontrado');
      }
      
      return review;
    },
    enabled: !!reviewId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================================================
// COMMUNITY QUERIES
// ============================================================================

/**
 * Hook para obtener posts de comunidad con paginación infinita
 */
export function useCommunityPosts(filters?: CommunityFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.community.list(filters),
    queryFn: async ({ pageParam = null }) => {
      logger.debug('Fetching community posts page', { filters, pageParam: !!pageParam });
      return await communityService.getPosts({
        limit: 10,
        cursor: pageParam as QueryDocumentSnapshot | null,
        filters,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as QueryDocumentSnapshot | null,
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
  });
}

/**
 * Hook para obtener un post de comunidad específico
 */
export function useCommunityPost(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.community.detail(postId || ''),
    queryFn: async () => {
      if (!postId) {
        throw new Error('ID de post requerido');
      }

      logger.debug('Fetching community post', { postId });
      const post = await communityService.getPost(postId);
      
      if (!post) {
        throw new Error('Post no encontrado');
      }
      
      return post;
    },
    enabled: !!postId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para crear un post de comunidad
 */
export function useCreateCommunityPost() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'commentsCount' | 'views' | 'userId' | 'userName' | 'userAvatar'>) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      return await communityService.createPost({
        ...data,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Usuario',
        userAvatar: profile?.photoURL || user.photoURL || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.lists() });
      toast({
        title: 'Post creado',
        description: 'Tu post ha sido publicado exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error creating community post', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

/**
 * Hook para obtener comentarios de un post de comunidad
 */
export function useCommunityPostComments(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.community.commentsList(postId || ''),
    queryFn: async () => {
      if (!postId) {
        throw new Error('ID de post requerido');
      }

      logger.debug('Fetching community post comments', { postId });
      return await communityService.getPostComments(postId);
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para agregar comentario a un post de comunidad
 */
export function useAddCommunityComment() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      return await communityService.addPostComment({
        postId,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Usuario',
        userAvatar: profile?.photoURL || user.photoURL || undefined,
        content,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.commentsList(variables.postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.community.detail(variables.postId) });
      toast({
        title: 'Comentario añadido',
        description: 'Tu comentario ha sido publicado.',
      });
    },
    onError: (error) => {
      logger.error('Error adding community comment', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

/**
 * Hook para verificar si un post de comunidad está liked
 */
export function useIsCommunityPostLiked(postId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.community.likeStatus(postId || '', user?.uid || ''),
    queryFn: async () => {
      if (!postId || !user?.uid) {
        return false;
      }

      return await communityService.isPostLiked(user.uid, postId);
    },
    enabled: !!postId && !!user?.uid,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para dar like/unlike a un post de comunidad
 */
export function useLikeCommunityPost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      if (like) {
        await communityService.likePost(user.uid, postId);
      } else {
        await communityService.unlikePost(user.uid, postId);
      }
      return { postId, like };
    },
    onMutate: async ({ postId, like }) => {
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.community.likeStatus(postId, user?.uid || '') 
      });

      const previousStatus = queryClient.getQueryData<boolean>(
        queryKeys.community.likeStatus(postId, user?.uid || '')
      );

      // Optimistic update
      queryClient.setQueryData(
        queryKeys.community.likeStatus(postId, user?.uid || ''),
        like
      );

      return { previousStatus };
    },
    onError: (error, variables, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          queryKeys.community.likeStatus(variables.postId, user?.uid || ''),
          context.previousStatus
        );
      }
      logger.error('Error liking/unliking community post', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.community.likeStatus(variables.postId, user?.uid || '') 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.community.detail(variables.postId) 
      });
    },
  });
}

