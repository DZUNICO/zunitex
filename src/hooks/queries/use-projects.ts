import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '@/lib/firebase/projects';
import { useAuth } from '@/lib/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/utils/logger';
import { getFirebaseErrorMessage } from '@/lib/utils/logger';
import type { Project, CreateProjectData } from '@/types/project';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (userId: string) => [...projectKeys.lists(), userId] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

/**
 * Hook para obtener los proyectos del usuario
 */
export function useUserProjects() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: projectKeys.list(user?.uid || ''),
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }
      
      logger.debug('Fetching user projects', { userId: user.uid });
      const projects = await projectsService.getUserProjects(user.uid);
      
      // Normalizar datos
      return projects.map((project) => ({
        ...project,
        images: project.images || [],
        tags: project.tags || [],
      })) as Project[];
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 2, // 2 minutos para proyectos del usuario
  });
}

/**
 * Hook para obtener un proyecto específico
 */
export function useProject(projectId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: projectKeys.detail(projectId || ''),
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
    staleTime: 1000 * 60 * 5, // 5 minutos para detalles
  });
}

/**
 * Hook para crear un proyecto
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
      return projectId;
    },
    onSuccess: () => {
      // Invalidar y refetch la lista de proyectos
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast({
        title: 'Proyecto creado',
        description: 'El proyecto ha sido creado exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error creating project', error as Error, { userId: user?.uid });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
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
    },
    onSuccess: (_, variables) => {
      // Invalidar tanto la lista como el detalle
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      toast({
        title: 'Proyecto actualizado',
        description: 'Los cambios han sido guardados exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error updating project', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
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
    },
    onSuccess: () => {
      // Invalidar la lista de proyectos
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto ha sido eliminado exitosamente.',
      });
    },
    onError: (error) => {
      logger.error('Error deleting project', error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    },
  });
}

