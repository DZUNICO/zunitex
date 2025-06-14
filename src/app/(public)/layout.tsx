'use client';

import { PublicNavbar } from '@/components/shared/public-navbar';
import { Navbar } from '@/components/shared/protected-navbar';
import { useAuth } from '@/lib/context/auth-context';  // Asegúrate de tener este hook

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <>
      {user ? <Navbar /> : <PublicNavbar />}
      {children}
    </>
  );
}