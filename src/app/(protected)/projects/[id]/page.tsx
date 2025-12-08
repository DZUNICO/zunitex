// app/(protected)/projects/[id]/page.tsx
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CommentSection } from '@/components/projects/project-comment-section';
import { useProject } from '@/lib/react-query/queries/use-project-queries';
import { useAddComment } from '@/lib/react-query/mutations/use-comment-mutations';
import { useProjectComments } from '@/lib/react-query/queries/use-follow-queries';
import { useAuth } from '@/lib/context/auth-context';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const projectId = typeof id === 'string' ? id : undefined;
  
  // Usar React Query hooks
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);
  const { data: comments = [], isLoading: commentsLoading } = useProjectComments(projectId);
  const addCommentMutation = useAddComment();
  const { user } = useAuth();

  // Memoizar el handler para evitar re-renders innecesarios
  const handleAddComment = useMemo(
    () => async (content: string): Promise<void> => {
      if (!projectId) return;
      await addCommentMutation.mutateAsync({ projectId, content });
    },
    [projectId, addCommentMutation]
  );

  // Formatear presupuesto memoizado
  const formattedBudget = useMemo(() => {
    if (!project?.budget) return '';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(project.budget);
  }, [project?.budget]);

  // Formatear fecha memoizada
  const formattedDate = useMemo(() => {
    if (!project?.createdAt) return '';
    return new Date(project.createdAt).toLocaleDateString('es-PE');
  }, [project?.createdAt]);

  const loading = projectLoading || commentsLoading;

  if (loading) {
    return <ProjectDetailsSkeleton />;
  }

  if (projectError || !project) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Proyecto no encontrado</h1>
        <Link href="/projects">
          <Button>Volver a proyectos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a proyectos
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contenido principal */}
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            {project.images && project.images.length > 0 ? (
              <div className="aspect-video relative">
                <img
                  src={project.images[0]}
                  alt={project.title}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : null}
            
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">{project.title}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          </Card>

          {/* Galería de imágenes adicionales */}
          {project.images && project.images.length > 1 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Galería</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.images.slice(1).map((image, index) => (
                  <div key={index} className="aspect-square relative">
                    <img
                      src={image}
                      alt={`Imagen ${index + 2}`}
                      className="object-cover w-full h-full rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar con detalles */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Presupuesto</span>
                <span className="text-xl font-bold">{formattedBudget}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estado</span>
                <Badge variant="outline">{project.status}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Categoría</span>
                <Badge variant="secondary">{project.category}</Badge>
              </div>

              <hr className="my-4" />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{project.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{project.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Comentarios</h2>
        <CommentSection
          projectId={project.id}
          comments={comments}
          onAddComment={handleAddComment}
        />
      </div>
    </div>
  );
}

function ProjectDetailsSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        
        <div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
}