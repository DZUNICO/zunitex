'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Award, Briefcase, Calendar } from 'lucide-react';
import { UserProfile } from '@/types/profile';

interface ProfileSidebarProps {
  profile: UserProfile;
}

/**
 * Componente Sidebar para mostrar información adicional del perfil
 * - Ubicación
 * - Experiencia
 * - Especialidades
 * - Certificaciones
 */
export function ProfileSidebar({ profile }: ProfileSidebarProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Ubicación */}
      {profile.location && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{profile.location}</p>
          </CardContent>
        </Card>
      )}

      {/* Experiencia / Miembro desde */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Experiencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Miembro desde {formatDate(profile.createdAt)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {profile.projectsCount} proyecto{profile.projectsCount !== 1 ? 's' : ''} completado{profile.projectsCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Especialidades */}
      {profile.specialties && profile.specialties.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Especialidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificaciones */}
      {profile.certifications && profile.certifications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              Certificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile.certifications.map((certification, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Award className="h-3 w-3 text-yellow-500" />
                  <span>{certification}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Si no hay información adicional, mostrar mensaje */}
      {!profile.location && 
       (!profile.specialties || profile.specialties.length === 0) &&
       (!profile.certifications || profile.certifications.length === 0) && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No hay información adicional disponible
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
