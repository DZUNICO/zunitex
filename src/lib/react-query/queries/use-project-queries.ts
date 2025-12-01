/**
 * Queries relacionadas con proyectos
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { queryKeys } from "../keys";
import { QUERY_LIMITS } from "../constants";
import { projectsService } from "@/lib/firebase/projects";
import { logger } from "@/lib/utils/logger";
import type { Project } from "@/types/project";
import type { ProjectFilters } from "../types";
import type { QueryDocumentSnapshot } from "firebase/firestore";

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
    maxPages: QUERY_LIMITS.MAX_PAGES,
    staleTime: QUERY_LIMITS.STALE_TIME,
    gcTime: QUERY_LIMITS.GC_TIME,
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
 * Hook para obtener proyectos de cualquier usuario por su ID
 * Útil para visualizar proyectos de otros usuarios en sus perfiles
 */
export function useUserProjectsById(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.list({ userId: userId || '' }),
    queryFn: async () => {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }
      
      logger.debug('Fetching user projects by ID', { userId });
      const projects = await projectsService.getUserProjects(userId);
      
      return projects.map((project) => ({
        ...project,
        images: project.images || [],
        tags: project.tags || [],
      })) as Project[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
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

