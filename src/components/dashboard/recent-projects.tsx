'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, MoreVertical, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Project {
  id: string;
  title: string;
  status: 'pendiente' | 'en_progreso' | 'completado';
  date: string;
  location: string;
  client: {
    name: string;
    avatar?: string;
  };
  budget: string;
  type: string;
}

const projects: Project[] = [
  {
    id: '1',
    title: 'Instalación Eléctrica Residencial',
    status: 'en_progreso',
    date: '2024-11-15',
    location: 'Santiago Centro',
    client: {
      name: 'Juan Pérez',
      avatar: '/avatars/juan.jpg'
    },
    budget: '$2,500,000',
    type: 'Residencial'
  },
  {
    id: '2',
    title: 'Mantenimiento Sistema Solar',
    status: 'pendiente',
    date: '2024-11-20',
    location: 'Las Condes',
    client: {
      name: 'María González',
    },
    budget: '$1,800,000',
    type: 'Solar'
  },
  {
    id: '3',
    title: 'Actualización Tablero Eléctrico',
    status: 'completado',
    date: '2024-11-10',
    location: 'Providencia',
    client: {
      name: 'Carlos Rodríguez',
      avatar: '/avatars/carlos.jpg'
    },
    budget: '$850,000',
    type: 'Comercial'
  }
];

const statusStyles = {
  pendiente: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80',
  en_progreso: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80',
  completado: 'bg-green-100 text-green-800 hover:bg-green-100/80'
};

const statusLabels = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  completado: 'Completado'
};

export function RecentProjects() {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold">Proyectos Recientes</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tus proyectos activos y pendientes
          </p>
        </div>
        <Button variant="outline" size="sm">
          Ver todos
        </Button>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 className="font-medium truncate">{project.title}</h3>
                  <Badge 
                    variant="secondary" 
                    className={statusStyles[project.status]}
                  >
                    {statusLabels[project.status]}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(project.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={project.client.avatar} />
                        <AvatarFallback>{project.client.name[0]}</AvatarFallback>
                      </Avatar>
                      <span>{project.client.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {project.budget}
                    </span>
                    <span className="text-muted-foreground">• {project.type}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button variant="outline" size="sm">
                  Ver detalles
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Abrir menú</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Editar proyecto</DropdownMenuItem>
                    <DropdownMenuItem>Cambiar estado</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}