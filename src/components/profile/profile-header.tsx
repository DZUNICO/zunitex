'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileImageUpload } from './profile-image-upload';
import { ProfileStats } from './profile-stats';
import { MapPin, Calendar, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProfileEditDialog } from './profile-edit-dialog';
//import { UserProfile, transformUserToProfileHeader } from '@/types/profile';

interface ProfileHeaderProps {
  profile: {
    id: string;
    displayName: string;
    email: string;
    about?: string;
    location?: string;
    specialties: string[];
    rating: number;
    projectsCount: number;
    createdAt: string;
    role: string;
    photoURL?: string | null;
  };
  isOwnProfile?: boolean; // Si es true, muestra botones de edición
  userId?: string; // ID del usuario para ProfileStats
}

export function ProfileHeader({ profile, isOwnProfile = true, userId }: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(profile.photoURL ?? null);
  const [currentProfile, setCurrentProfile] = useState(profile);
 
  // Actualizamos el avatar cuando cambia el perfil
  useEffect(() => {
    setCurrentAvatar(profile.photoURL ?? null);
  }, [profile.photoURL]);

  // Sincronizar el estado local con el prop profile cuando cambie
  useEffect(() => {
    setCurrentProfile(profile);
    setCurrentAvatar(profile.photoURL ?? null);
  }, [profile]);

  const handleProfileUpdate = (updatedProfile: typeof profile) => {
    setCurrentProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleAvatarUpdate = (newUrl: string | null) => {
    setCurrentAvatar(newUrl);
    setCurrentProfile(prev => ({
      ...prev,
      photoURL: newUrl
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {/* Contenedor principal que cambia según el viewport */}
        <div className="flex flex-col md:flex-row md:gap-8">
          {/* Columna izquierda con foto y botones */}
          <div className="flex flex-col items-center md:items-start">
            {/* Mostrar Avatar sin edición si no es perfil propio */}
            {isOwnProfile ? (
              <ProfileImageUpload 
                currentImageUrl={currentAvatar} 
                onImageUpdate={handleAvatarUpdate}
              />
            ) : (
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-background shadow-lg">
                {currentAvatar ? (
                  <img 
                    src={currentAvatar} 
                    alt={currentProfile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {currentProfile.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Botón editar solo si es perfil propio */}
            {isOwnProfile && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="w-full max-w-[200px] mx-auto my-2"
              >
                Editar Perfil
              </Button>
            )}
          </div>

          {/* Columna derecha con información del perfil */}
          <div className="flex-1 text-center md:text-left mt-6 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <h1 className="text-2xl font-bold">{currentProfile.displayName}{' '}{"("+currentProfile.role+")"}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{currentProfile.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({currentProfile.projectsCount} proyectos)
                </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
              {currentProfile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {currentProfile.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Miembro desde {formatDate(currentProfile.createdAt)}
              </div>
            </div>

            {currentProfile.about && (
              <p className="text-sm text-muted-foreground mb-4">
                {currentProfile.about}
              </p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {currentProfile.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Stats se mantienen abajo */}
        <div className="mt-8">
          <ProfileStats userId={isOwnProfile ? undefined : userId} />
        </div>
      </Card>

      {/* Dialog de edición solo si es perfil propio */}
      {isOwnProfile && (
        <ProfileEditDialog 
          open={isEditing} 
          onOpenChange={setIsEditing}
          profile={currentProfile}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}