'use client';

import { useEffect, useState } from 'react';
import { projectsService } from '@/lib/firebase/projects';
import { ProjectList } from '@/components/projects/project-list';
import { Button } from '@/components/ui/button';
import { useAuth } from "@/lib/context/auth-context";
import type { Project, CreateProjectData } from '@/types/project';
import type { ProjectStatus } from '@/types/project';
import type { ProjectCategory } from '@/types/project';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProjectForm from '@/components/projects/project-form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


export default function ProjectsPage() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  interface FirebaseProject {
    id: string;
    title: string;
    description: string;
    status: ProjectStatus;
    category: ProjectCategory;
    budget: number;
    location: string;
    clientId: string;
    clientName: string;
    startDate: Date;
    createdBy: string;
    createdAt: Date;
    images?: string[];
    tags?: string[];
  }

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      if (!user) return;
      
      const userProjects = await projectsService.getUserProjects(user.uid) as FirebaseProject[];
      const validProjects = userProjects.map(project => ({
        ...project,
        images: project.images || [],
        tags: project.tags || []
      }));
  
      setProjects(validProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleCreateProject = async (formData: CreateProjectData) => {
    try {
      if (!user) return;

      // Crear un objeto que cumpla con el tipo esperado por createProject
      const newProjectData: Omit<Project, 'id'> = {
        ...formData,
        createdBy: user.uid,
        createdAt: new Date(),
        status: formData.status || 'Pendiente' as ProjectStatus,
        images: formData.images || [],
        tags: formData.tags || [],
        clientId: formData.clientId || user.uid,
        startDate: formData.startDate || new Date()
      };

      await projectsService.createProject(newProjectData);
      setIsOpen(false);
      loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };
  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };
  const handleDelete = async (project: Project) => {
    try {
      await projectsService.deleteProject(project.id);
      // Recargar la lista de proyectos
      await loadProjects();
      router.refresh();
      
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado exitosamente."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el proyecto."
      });
      throw error;
    }
  };

  const handleUpdate = async (projectId: string, data: Partial<Project>) => {
    try {
      await projectsService.updateProject(projectId, data);
      // Recargar la lista de proyectos
      await loadProjects();
      router.refresh();
      
      toast({
        title: "Proyecto actualizado",
        description: "Los cambios han sido guardados exitosamente."
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el proyecto."
      });
    }
  };
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
         onViewDetails={(id) => router.push(`/projects/${id}`)}
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
            onSubmit={(data) => 
              handleUpdate(selectedProject?.id || '', data)
            }
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