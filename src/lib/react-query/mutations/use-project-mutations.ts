/**
 * Mutations relacionadas con proyectos
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "../keys";
import { projectsService } from "@/lib/firebase/projects";
import { logger } from "@/lib/utils/logger";
import { getFirebaseErrorMessage } from "@/lib/utils/logger";
import type { Project, CreateProjectData } from "@/types/project";

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
        // createdAt se maneja con serverTimestamp() en projectsService
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

