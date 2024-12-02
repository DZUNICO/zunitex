// components/projects/project-list.tsx
import { 
  MapPin, 
  Calendar, 
  User, 
  ArrowRight, 
  Clock,
  ImageIcon,
  MoreVertical, 
  Edit, 
  Trash2 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Project } from '@/types/project';
import { type BadgeProps } from "@/components/ui/badge";
import Link from 'next/link';
import { useState } from 'react';
import { DeleteProjectDialog } from './project-delete-dialog';

interface ProjectListProps {
  projects: Project[];
  onViewDetails: (projectId: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export function ProjectList({ 
  projects, 
  onViewDetails, 
  onEdit, 
  onDelete 
}: ProjectListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'Pendiente':
        return 'secondary';
      case 'En Progreso':
        return 'default';
      case 'Completado':
        return 'outline';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="flex flex-col h-full">
          {/* Contenedor de imagen con proporción fija */}
          <div className="relative w-full pt-[56.25%]">
            {project.images?.[0] ? (
              <img
                src={project.images[0]}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
            
            {/* Menú de acciones */}
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <Badge variant={getStatusVariant(project.status)}>
                {project.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 bg-white/80 hover:bg-white/90"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedProject(project);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Contenido del proyecto */}
          <div className="flex flex-col flex-1 p-4">
            <div className="flex justify-between items-start gap-2 mb-2">
              <h3 className="font-semibold text-lg line-clamp-2">
                {project.title}
              </h3>
              <span className="font-bold text-lg whitespace-nowrap">
                {formatCurrency(project.budget)}
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {project.description}
            </p>

            <div className="space-y-2 text-sm text-muted-foreground mt-auto">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {new Date(project.createdAt).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{project.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">{project.clientName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Badge variant="secondary">
                {project.category}
              </Badge>
              <Link href={`/projects/${project.id}`} className="inline-flex">
                <Button variant="ghost" size="sm">
                  Ver detalles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ))}

      <DeleteProjectDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        project={selectedProject}
        onConfirm={(project) => {
          onDelete(project);
          setIsDeleteDialogOpen(false);
        }}
      />
    </div>
  );
}