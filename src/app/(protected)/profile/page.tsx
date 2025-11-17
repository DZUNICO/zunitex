'use client';

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { Loader2 } from "lucide-react";
import { useUserProfile } from '@/hooks/queries/use-profile';
import { transformUserToProfileHeader } from '@/types/profile';

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useUserProfile();

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
      <ProfileHeader profile={transformUserToProfileHeader(profile)} />
      <ProfileTabs profile={profile} />
    </div>
  );
}