'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { catalogoClient } from '@/lib/supabase/catalogo-client';

interface Proveedor {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  logo_url: string | null;
  ciudad: string | null;
  region: string | null;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogoClient
      .from('proveedores')
      .select('*')
      .order('nombre', { ascending: true })
      .then(({ data }) => {
        setProveedores((data ?? []) as Proveedor[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Proveedores</h1>
        <p className="text-muted-foreground">
          Distribuidores y ferreterías verificadas en Perú
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex gap-4 mb-4">
                  <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-muted rounded w-full mb-1" />
                <div className="h-3 bg-muted rounded w-4/5 mb-4" />
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded w-28" />
                  <div className="h-8 bg-muted rounded w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && proveedores.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-medium">No hay proveedores registrados aún.</p>
        </div>
      )}

      {!loading && proveedores.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proveedores.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex gap-4 mb-4">
                  {p.logo_url ? (
                    <img
                      src={p.logo_url}
                      alt={p.nombre}
                      className="w-20 h-20 rounded-lg object-contain flex-shrink-0 bg-gray-50"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                      {p.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-base leading-snug">{p.nombre}</h3>
                    {(p.ciudad || p.region) && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {[p.ciudad, p.region].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {p.descripcion && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {p.descripcion}
                  </p>
                )}

                <div className="flex gap-2 mt-auto pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="#">Ver catálogo</a>
                  </Button>
                  {p.sitio_web && (
                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                      <a href={p.sitio_web} target="_blank" rel="noopener noreferrer">
                        Sitio web
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
