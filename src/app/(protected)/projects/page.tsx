'use client';

import { useState, useCallback, useMemo } from 'react';
import { ProjectList } from '@/components/projects/project-list';
import { Button } from '@/components/ui/button';
import { useAuth } from "@/lib/context/auth-context";
import type { Project, CreateProjectData } from '@/types/project';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProjectForm from '@/components/projects/project-form';
import { useRouter } from 'next/navigation';
import { 
  useUserProjects, 
  useCreateProject, 
  useUpdateProject, 
  useDeleteProject 
} from '@/hooks/queries/use-projects';

export default function ProjectsPage() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // React Query hooks
  const { data: projects = [], isLoading } = useUserProjects();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  // Handlers memoizados con useCallback
  const handleCreateProject = useCallback(
    async (formData: CreateProjectData) => {
      await createProjectMutation.mutateAsync(formData);
      setIsOpen(false);
    },
    [createProjectMutation]
  );

  const handleEdit = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (project: Project) => {
      await deleteProjectMutation.mutateAsync(project.id);
      router.refresh();
    },
    [deleteProjectMutation, router]
  );

  const handleUpdate = useCallback(
    async (projectId: string, data: Partial<Project>) => {
      await updateProjectMutation.mutateAsync({ projectId, data });
      setIsEditDialogOpen(false);
    },
    [updateProjectMutation]
  );

  const handleViewDetails = useCallback(
    (id: string) => {
      router.push(`/projects/${id}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Mis Proyectos</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mis Proyectos</h1>
        <Button onClick={() => setIsOpen(true)} variant="default">
          Nuevo Proyecto
        </Button>
      </div>

      <ProjectList 
         projects={projects}
         onViewDetails={handleViewDetails}
         onEdit={handleEdit}
         onDelete={handleDelete}
      />

      {/* Diálogo para editar proyecto */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Proyecto</DialogTitle>
          </DialogHeader>
          <ProjectForm
            initialData={selectedProject || undefined}
            onSubmit={(data) => {
              if (selectedProject?.id) {
                handleUpdate(selectedProject.id, data);
              }
            }}
          />
        </DialogContent>
      </Dialog>
     {/* Diálogo de Nuevo Proyecto */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] p-0">
        <DialogHeader className="px-4 py-2 border-b">
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
        </DialogHeader>
        <ProjectForm onSubmit={handleCreateProject} />
      </DialogContent>
    </Dialog>
    </div>
  );
}