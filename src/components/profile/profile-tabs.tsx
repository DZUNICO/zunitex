'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { 
  Menu, 
  FileText, 
  Star, 
  Image, 
  Activity, 
  Award,
  Calendar,
  MapPin,
  User,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { ProfileTabsProps } from '@/types/profile';
import { useUserProjects, useUserProjectsById } from '@/lib/react-query/queries';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/types/project';
import { Timestamp } from 'firebase/firestore';

const tabItems = [
  { id: 'projects', label: 'Proyectos', icon: FileText },
  { id: 'reviews', label: 'Reseñas', icon: Star },
  { id: 'certifications', label: 'Certificaciones', icon: Award },
  { id: 'gallery', label: 'Galería', icon: Image },
  { id: 'activity', label: 'Actividad', icon: Activity }
];

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  /**
   * Función helper para convertir diferentes tipos de fechas a Date
   * Maneja: Date, string, Timestamp de Firestore, y objetos con seconds/nanoseconds
   */
  const convertToDate = (date: any): Date => {
    // Si es un Timestamp de Firestore con método toDate
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      return date.toDate();
    }
    // Si es un objeto con seconds (Timestamp serializado)
    if (date && typeof date === 'object' && ('seconds' in date || '_seconds' in date)) {
      const seconds = date.seconds || date._seconds || 0;
      const nanoseconds = date.nanoseconds || date._nanoseconds || 0;
      return new Timestamp(seconds, nanoseconds).toDate();
    }
    // Si ya es un Date
    if (date instanceof Date) {
      return date;
    }
    // Si es un string
    if (typeof date === 'string') {
      return new Date(date);
    }
    // Si es un número (timestamp)
    if (typeof date === 'number') {
      return new Date(date);
    }
    // Fallback: fecha actual
    return new Date();
  };

  const formatDate = (date: any) => {
    try {
      const dateObj = convertToDate(date);
      // Verificar que la fecha sea válida
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      return dateObj.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Fecha inválida';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Pendiente';
    const statusMap: Record<string, string> = {
      'pendiente': 'Pendiente',
      'Pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'En Progreso': 'En Progreso',
      'completado': 'Completado',
      'Completado': 'Completado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string | undefined) => {
    const normalizedStatus = status?.toLowerCase() || 'pendiente';
    const colorMap: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'en_progreso': 'bg-blue-100 text-blue-800',
      'completado': 'bg-green-100 text-green-800'
    };
    return colorMap[normalizedStatus] || 'bg-gray-100 text-gray-800';
  };

  const formatBudget = (budget: number | string | undefined) => {
    if (!budget) return 'No especificado';
    if (typeof budget === 'string') return budget;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(budget);
  };

  return (
    <Card className="p-4 space-y-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-lg">{project.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
          {getStatusLabel(project.status)}
        </span>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {project.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{project.location}</span>
          </div>
        )}
        {project.category && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{project.category}</span>
          </div>
        )}
        {project.clientName && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{project.clientName}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatBudget(project.budget)}</span>
        </div>
        <Link href={`/projects/${project.id}`}>
          <Button variant="outline" size="sm">
            Ver detalles
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function ProfileTabs({ profile, userId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('projects');
  
  // Usar el hook apropiado según si tenemos userId o no
  const { data: projects, isLoading: isLoadingProjects } = userId 
    ? useUserProjectsById(userId)
    : useUserProjects();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      {/* Tabs para desktop */}
      <div className="hidden sm:block">
        <TabsList className="flex min-w-max gap-12">
          {tabItems.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>{label}</TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Menú desplegable para móvil */}
      <div className="sm:hidden flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {tabItems.find(t => t.id === activeTab)?.label}
        </h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-2 mt-8">
              {tabItems.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={activeTab === id ? "default" : "ghost"}
                  className="justify-start"
                  onClick={() => setActiveTab(id)}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {label}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Contenido de las tabs */}
      <TabsContent value="projects" className="space-y-4">
        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              No hay proyectos disponibles
            </div>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="reviews">
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            No hay reseñas disponibles
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="certifications">
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            No hay certificaciones disponibles
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="gallery">
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            No hay imágenes en la galería
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="activity">
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            No hay actividad reciente
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}