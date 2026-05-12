// src/components/shared/admin-route.tsx

'use client';

import { useAuth } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin, userRole, loading } = useAuth();
  const router = useRouter();
  const hasAdminAccess = isAdmin || userRole === 'admin';

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!hasAdminAccess) {
        router.push('/');
      }
    }
  }, [user, hasAdminAccess, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasAdminAccess) {
    return null;
  }

  return <>{children}</>;
}
