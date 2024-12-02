// app/(protected)/projects/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, User, ArrowLeft, Clock } from 'lucide-react';
import type { Project } from '@/types/project';
import { projectsService } from '@/lib/firebase/projects';
import Link from 'next/link';
import { commentService } from '@/lib/firebase/comments';
import { useAuth } from '@/lib/context/auth-context';
import { useToast } from '@/hooks/use-toast';  // Añadir esta importación
import type { Comment } from '@/types/comment'; 
import { CommentSection } from '@/components/projects/project-comment-section';
import { UserProfile } from '@/types/profile';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function ProjectDetailsPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const { toast } = useToast(); // Añadir esto
  const { user } = useAuth();
  const { id } = useParams();
  //cargar profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.uid]);
  //cargar proyectos
  useEffect(() => {
    const loadProject = async () => {
      try {
        if (typeof id === 'string') {
          const data = await projectsService.getProject(id);
          setProject(data);
        }
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);
   
  useEffect(() => {
    if (project?.id) {
      loadComments();
    }
  }, [project?.id]);

  if (loading) {
    return <ProjectDetailsSkeleton />;
  }
  
  if (!project) {
    return (
      <div className="container mx-auto p-4">
        <h1>Proyecto no encontrado</h1>
        <Link href="/projects">
          <Button>Volver a proyectos</Button>
        </Link>
      </div>
    );
  }

  const loadComments = async () => {
    if (!project?.id) return;

    try {
      const projectComments = await commentService.getProjectComments(project.id);
      setComments(projectComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los comentarios"
      });
    }
  };
  const handleAddComment = async (content: string): Promise<void> => {
    if (!user || !project) return;
  
  try {
    await commentService.addComment({
      projectId: project.id,
      userId: user.uid,
      userDisplayName: profile?.displayName || 'Usuario',
      photoURL: profile?.photoURL || null,
      content,
      createdAt: new Date()
    });
    
    await loadComments();
    
    toast({
      title: "Comentario añadido",
      description: "Tu comentario ha sido publicado."
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "No se pudo añadir el comentario"
    });
  }
  };

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
                <span className="text-xl font-bold">
                  {new Intl.NumberFormat('es-PE', {
                    style: 'currency',
                    currency: 'PEN'
                  }).format(project.budget)}
                </span>
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
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
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