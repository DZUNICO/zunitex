import type { Metadata } from 'next';
import { ToastProvider } from '@/components/providers/toast-provider';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/context/auth-context';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ElectricianHub',
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
        <AuthProvider>
          <main className="min-h-screen bg-background">
            {children}
          </main>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}