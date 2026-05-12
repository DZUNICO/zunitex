import { ErrorBoundary } from '@/components/shared/error-boundary';
import Link from 'next/link';

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      scope="section"
      fallback={
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg font-medium mb-4">Error al cargar el catálogo.</p>
          <Link href="/catalogo" className="text-primary hover:underline text-sm">
            Reintentar
          </Link>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
