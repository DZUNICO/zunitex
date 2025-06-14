'use client';

import { ProtectedRoute } from '@/components/shared/protected-route';
import { Navbar } from '@/components/shared/protected-navbar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-background">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

/* 'use client';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { Navbar } from '@/components/shared/protected-navbar';
//import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from "@/lib/context/auth-context";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Redirigir usuarios no autenticados al login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-background">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
} */