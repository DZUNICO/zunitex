'use client';

import { useAuth } from '@/lib/context/auth-context';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

// Lista de correos autorizados
const ADMIN_EMAILS = ['diego.zuni@gmail.com']; // Reemplaza con tu correo

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !ADMIN_EMAILS.includes(user.email!))) {
      redirect('/dashboard');
    }
  }, [user, loading]);

  if (loading) return null;

  return <>{children}</>;
}