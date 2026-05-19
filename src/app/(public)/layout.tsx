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

  return (
    <>
      {/* Navbar se oculta durante el check inicial de auth para evitar flash.
          Children se renderizan siempre para no perder estado de formularios
          mientras Firebase resuelve custom claims (claimsStale). */}
      {!loading && (user ? <Navbar /> : <PublicNavbar />)}
      {children}
    </>
  );
}