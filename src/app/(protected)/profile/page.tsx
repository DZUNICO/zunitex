'use client';

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { Loader2 } from "lucide-react";
import { useUserProfile } from '@/lib/react-query/queries';
import { transformUserToProfileHeader } from '@/types/profile';
import { useAuth } from '@/lib/context/auth-context';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading, error } = useUserProfile();

  // Esperar a que la autenticación termine de cargar
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar error
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">
          Debes iniciar sesión para ver tu perfil
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">
          {error ? 'Error al cargar el perfil' : 'No se encontró el perfil'}
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <ProfileHeader 
        profile={transformUserToProfileHeader(profile)} 
        isOwnProfile={true}
      />
      <ProfileTabs profile={profile} />
    </div>
  );
}