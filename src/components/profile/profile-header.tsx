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
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(profile.photoURL ?? null);
  const [currentProfile, setCurrentProfile] = useState(profile);
 
  // Actualizamos el avatar cuando cambia el perfil
  useEffect(() => {
    setCurrentAvatar(profile.photoURL ?? null);
  }, [profile.photoURL]);

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
            <ProfileImageUpload 
              currentImageUrl={currentAvatar} 
              onImageUpdate={handleAvatarUpdate}
            />
            <Button 
            variant="outline" 
            onClick={() => setIsEditing(true)}
            className="w-full max-w-[200px] mx-auto my-2"
          >
            Editar Perfil
          </Button>
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
          <ProfileStats />
        </div>
      </Card>

      <ProfileEditDialog 
        open={isEditing} 
        onOpenChange={setIsEditing}
        profile={currentProfile}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}