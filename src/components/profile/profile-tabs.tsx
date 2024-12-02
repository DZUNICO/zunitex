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
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { ProfileTabsProps } from '@/types/profile';

const tabItems = [
  { id: 'projects', label: 'Proyectos', icon: FileText },
  { id: 'reviews', label: 'Reseñas', icon: Star },
  { id: 'certifications', label: 'Certificaciones', icon: Award },
  { id: 'gallery', label: 'Galería', icon: Image },
  { id: 'activity', label: 'Actividad', icon: Activity }
];

function ProjectCard({ project }: any) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{project.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>{project.date}</span>
          </div>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          {project.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{project.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{project.clientName}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{project.budget}</span>
        </div>
        <Button variant="outline" size="sm">Ver detalles</Button>
      </div>
    </Card>
  );
}

export function ProfileTabs({ profile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('projects');

  // Datos de ejemplo
  const projects = [
    {
      title: 'Instalación Eléctrica Residencial',
      status: 'En Progreso',
      date: '14 de noviembre de 2024',
      location: 'Santiago Centro',
      clientName: 'Juan Pérez',
      budget: '$2,500,000',
      type: 'Residencial'
    },
    // Puedes agregar más proyectos aquí
  ];

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
        {/* {projects.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))} */}
        <RecentProjects />
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