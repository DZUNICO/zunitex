import type { Metadata } from 'next';
import { ToastProvider } from '@/components/providers/toast-provider';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/context/auth-context';
import { QueryProvider } from '@/lib/providers/query-provider';
import { NavigationProgress } from '@/components/providers/navigation-progress';
import { GlobalErrorBoundary } from '@/components/shared/global-error-boundary';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'STARLOGIC',
  description: 'Red social profesional para electricistas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <GlobalErrorBoundary>
          <NavigationProgress />
          <QueryProvider>
            <AuthProvider>
              <main className="min-h-screen bg-background">
                {children}
              </main>
              <ToastProvider />
            </AuthProvider>
          </QueryProvider>
        </GlobalErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}