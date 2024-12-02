'use client';

import { useAuth } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Opcional: para verificar roles específicos
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si no está cargando y no hay usuario, redirigir al login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // No mostrar nada si no hay usuario autenticado
  if (!user) {
    return null;
  }

  // Si hay usuario, mostrar el contenido protegido
  return <>{children}</>;
}