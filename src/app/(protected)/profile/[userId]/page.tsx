'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { useUserProfileById } from '@/lib/react-query/queries';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileSidebar } from '@/components/profile/profile-sidebar';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { FollowButton } from '@/components/followers/follow-button';
import { transformUserToProfileHeader } from '@/types/profile';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

/**
 * Página para visualizar el perfil de otro usuario
 * 
 * Validaciones:
 * - Si [userId] === user.uid → redirige a /profile
 * - Si usuario no existe → mostrar 404 con enlace a /profile
 * - Si usuario no autenticado → redirige a /login (manejado por ProtectedRoute)
 * - Solo mostrar botón "Seguir" si NO eres el dueño del perfil
 */
export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = params?.userId as string | undefined;

  // Obtener perfil del usuario visitado
  const { 
    data: visitedUserProfile, 
    isLoading, 
    error 
  } = useUserProfileById(userId);

  // Validación 1: Verificar si es tu propio perfil
  useEffect(() => {
    if (userId && user?.uid && userId === user.uid) {
      router.replace('/profile');
    }
  }, [userId, user?.uid, router]);

  // Manejo de errores con toast
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error al cargar perfil',
        description: error instanceof Error 
          ? error.message 
          : 'No se pudo cargar el perfil del usuario',
      });
    }
  }, [error, toast]);

  // Loading state
  if (isLoading || !userId || (user?.uid && userId === user.uid)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state: Usuario no encontrado
  if (error || !visitedUserProfile) {
    return (
      <div className="container max-w-4xl mx-auto p-4 sm:p-6">
        <Card className="p-8 text-center space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Usuario no encontrado</h1>
          <p className="text-muted-foreground">
            El perfil que estás buscando no existe o ha sido eliminado.
          </p>
          <div className="flex gap-4 justify-center mt-6">
            <Link href="/profile">
              <Button variant="default">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir a mi perfil
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">
                Volver al inicio
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Verificar que no es el propio perfil (validación adicional)
  const isOwnProfile = user?.uid === visitedUserProfile.id;

  if (isOwnProfile) {
    return null; // La redirección se manejará en el useEffect
  }

  // Transformar perfil para ProfileHeader
  const profileHeaderData = transformUserToProfileHeader({
    ...visitedUserProfile,
    id: visitedUserProfile.id || userId || '',
  });

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header con botón de volver */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* ProfileHeader sin botones de edición */}
      <div className="space-y-4">
        <ProfileHeader 
          profile={profileHeaderData} 
          isOwnProfile={false}
          userId={visitedUserProfile.id || userId}
        />
        
        {/* Botón Seguir - Solo si no eres el dueño */}
        <div className="flex justify-end">
          <FollowButton
            userId={visitedUserProfile.id || userId}
            userName={visitedUserProfile.displayName}
            userAvatar={visitedUserProfile.photoURL || undefined}
            variant="default"
            size="lg"
          />
        </div>
      </div>

      {/* Layout con Sidebar y Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Información adicional */}
        <div className="lg:col-span-1">
          <ProfileSidebar profile={visitedUserProfile} />
        </div>

        {/* Tabs - Proyectos, Reseñas, Actividad */}
        <div className="lg:col-span-3">
          <ProfileTabs 
            profile={visitedUserProfile} 
            userId={visitedUserProfile.id || userId}
          />
        </div>
      </div>
    </div>
  );
}
