import { ProtectedRoute } from '@/components/shared/protected-route';
import { Navbar } from '@/components/shared/navbar';

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