'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Zap, ExternalLink, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { catalogoClient } from '@/lib/supabase/catalogo-client';
import type { ProductoCatalogo } from '@/types/catalogo';

interface ProveedorProducto {
  precio: number | null;
  stock: string | null;
  proveedores: {
    nombre: string;
    slug: string;
    ciudad: string | null;
    logo_url: string | null;
    telefono: string | null;
    web: string | null;
  } | null;
}

const ATRIBUTO_LABELS: Record<string, string> = {
  corriente_a:      'Corriente nominal',
  polos:            'Número de polos',
  ruptura_ka:       'Capacidad de ruptura',
  curva:            'Curva de disparo',
  tension_v:        'Tensión nominal',
  sensibilidad_ma:  'Sensibilidad diferencial',
  tipo_diferencial: 'Tipo diferencial',
  tension_bobina_v: 'Tensión de bobina',
  potencia_kw:      'Potencia',
  fases:            'Fases',
  uso:              'Uso',
  diametro_pulg:    'Diámetro',
  tipo:             'Tipo',
  longitud_m:       'Longitud',
  norma:            'Norma',
  con_usb:          'Puertos USB',
  puertos_usb:      'Cantidad USB',
  linea:            'Línea',
};

function formatAtributoValue(key: string, value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (key === 'corriente_a')     return `${value} A`;
  if (key === 'ruptura_ka')      return `${value} kA`;
  if (key === 'sensibilidad_ma') return `${value} mA`;
  if (key === 'tension_v' || key === 'tension_bobina_v') return `${value} V`;
  if (key === 'potencia_kw')     return `${value} kW`;
  if (key === 'diametro_pulg')   return `${value}"`;
  if (key === 'longitud_m')      return `${value} m`;
  return String(value);
}

export default function ProductoDetailPage() {
  const params = useParams();
  const marca = decodeURIComponent(params.marca as string);
  const slug  = decodeURIComponent(params.slug  as string);

  const [producto,   setProducto]   = useState<ProductoCatalogo | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [proveedores, setProveedores] = useState<ProveedorProducto[]>([]);

  // SEO: título dinámico
  useEffect(() => {
    if (producto) {
      document.title = `${producto.modelo} — ${producto.marca} | STARLOGIC`;
    }
    return () => { document.title = 'STARLOGIC'; };
  }, [producto]);

  useEffect(() => {
    if (!slug || !marca) return;

    catalogoClient
      .from('productos_catalogo')
      .select('id, codigo_fabricante, marca, modelo, descripcion, categoria, slug, atributos, precio_ref_usd, precio_ref_pen, imagen_url, ficha_tecnica_pdf')
      .eq('slug', slug)
      .ilike('marca', marca)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setProducto(data as ProductoCatalogo);
        setLoading(false);
      });
  }, [slug, marca]);

  useEffect(() => {
    if (!producto?.id) return;

    (async () => {
      const { data: pp, error: ppError } = await catalogoClient
        .from('proveedor_producto')
        .select('precio_pen, stock, proveedor_id')
        .eq('producto_id', producto.id);

      if (ppError || !pp || pp.length === 0) {
        setProveedores([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ids = (pp as any[]).map((r) => r.proveedor_id);

      const { data: provs } = await catalogoClient
        .from('proveedores')
        .select('id, nombre, slug, ciudad, logo_url, telefono, web')
        .in('id', ids);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provMap: Record<string, any> = Object.fromEntries(
        (provs ?? []).map((p: any) => [p.id, p])
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProveedores(
        (pp as any[]).map((row) => ({
          precio:      row.precio_pen     ?? null,
          stock:       row.stock          ?? null,
          proveedores: provMap[row.proveedor_id] ?? null,
        }))
      );
    })();
  }, [producto?.id]);

  if (loading) return <LoadingSkeleton />;

  if (notFound || !producto) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg font-medium mb-6">Producto no encontrado</p>
        <Button variant="outline" asChild>
          <Link href="/catalogo">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Link>
        </Button>
      </div>
    );
  }

  const atributosEntries = producto.atributos
    ? Object.entries(producto.atributos).filter(([, v]) => v != null)
    : [];

  return (
    <div className="container mx-auto px-4 py-8">

      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-8">

        {/* Columna izquierda — Imagen */}
        <div className="md:sticky md:top-8 md:self-start">
          <div className="w-full h-[300px] md:h-[420px] rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
            {producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.modelo}
                className="w-full h-full object-contain"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            ) : (
              <Zap className="h-16 w-16 text-muted-foreground/20" />
            )}
          </div>
        </div>

        {/* Columna derecha — Información */}
        <div>

          {/* Encabezado */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {producto.marca}
              </span>
              <Badge variant="secondary" className="text-xs">{producto.categoria}</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight leading-tight">
              {producto.modelo}
            </h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">{producto.descripcion}</p>
          </div>

          {/* Especificaciones técnicas */}
          {(atributosEntries.length > 0 || producto.codigo_fabricante) && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Especificaciones técnicas
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {producto.codigo_fabricante && (
                      <tr className="bg-muted/30">
                        <td className="px-4 py-2.5 text-muted-foreground w-1/2">
                          Código de fabricante
                        </td>
                        <td className="px-4 py-2.5 font-mono font-medium">
                          {producto.codigo_fabricante}
                        </td>
                      </tr>
                    )}
                    {atributosEntries.map(([key, value], i) => (
                      <tr
                        key={key}
                        className={
                          (i + (producto.codigo_fabricante ? 1 : 0)) % 2 === 0
                            ? 'bg-muted/30'
                            : 'bg-background'
                        }
                      >
                        <td className="px-4 py-2.5 text-muted-foreground w-1/2">
                          {ATRIBUTO_LABELS[key] ?? key}
                        </td>
                        <td className="px-4 py-2.5 font-mono font-medium">
                          {formatAtributoValue(key, value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Precio referencial */}
          {producto.precio_ref_pen != null && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Precio referencial
              </h3>
              <p className="text-3xl font-bold tracking-tight">
                S/. {producto.precio_ref_pen.toFixed(2)}
              </p>
            </div>
          )}

          {/* Acciones */}
          {producto.ficha_tecnica_pdf && (
            <div className="mb-8">
              <Button variant="outline" asChild>
                <a
                  href={producto.ficha_tecnica_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ficha Técnica PDF
                </a>
              </Button>
            </div>
          )}

          {/* Badge de proveedores disponibles */}
          {proveedores.length > 0 && (
            <div className="mb-4">
              <Badge variant="secondary">
                {proveedores.length === 1
                  ? '1 proveedor disponible'
                  : `${proveedores.length} proveedores disponibles`}
              </Badge>
            </div>
          )}

          {/* Dónde comprar */}
          <div id="proveedores" className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Dónde comprar
            </h3>
            {proveedores.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <p>Aún no hay proveedores listados para este producto.</p>
                <p className="mt-1">
                  ¿Eres distribuidor?{' '}
                  <Link href="/registro" className="text-foreground underline underline-offset-4 hover:text-primary">
                    Regístrate como proveedor →
                  </Link>
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {proveedores.map((pp, i) => {
                  const p = pp.proveedores;
                  if (!p) return null;
                  const disponibilidadBadge = (() => {
                    const d = pp.stock?.toLowerCase() ?? '';
                    if (d === 'en_stock' || d === 'en stock')
                      return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 text-xs">En stock</Badge>;
                    if (d === 'agotado')
                      return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 text-xs">Agotado</Badge>;
                    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">Consultar</Badge>;
                  })();
                  const tiendaHref = p.web ?? null;
                  return (
                    <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
                      {/* Logo o inicial */}
                      <div className="flex-shrink-0">
                        {p.logo_url ? (
                          <img src={p.logo_url} alt={p.nombre} className="w-12 h-12 rounded-md object-contain" sizes="48px" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                            {p.nombre.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{p.nombre}</span>
                          {p.ciudad && (
                            <span className="text-xs text-muted-foreground">· {p.ciudad}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium">
                            {pp.precio != null ? `S/. ${pp.precio.toFixed(2)}` : 'Consultar precio'}
                          </span>
                          {disponibilidadBadge}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {tiendaHref && (
                            <Button variant="outline" size="sm" className="text-xs h-7 gap-1" asChild>
                              <a href={tiendaHref} target="_blank" rel="noopener noreferrer">
                                Ver en tienda
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          {p.telefono && (
                            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" asChild>
                              <a href={`tel:${p.telefono}`}>
                                <Phone className="h-3 w-3" />
                                Contactar
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Volver */}
      <Link
        href="/catalogo"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-8">
        <div>
          <div className="w-full h-[300px] md:h-[420px] rounded-xl bg-muted" />
        </div>
        <div>
          <div className="h-3 bg-muted rounded w-1/4 mb-2" />
          <div className="h-8 bg-muted rounded w-2/3 mb-3" />
          <div className="h-4 bg-muted rounded w-full mb-1" />
          <div className="h-4 bg-muted rounded w-4/5 mb-6" />
          <div className="rounded-lg border overflow-hidden mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-0">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
          <div className="h-9 bg-muted rounded w-1/3 mb-6" />
          <div className="h-9 bg-muted rounded w-36" />
        </div>
      </div>
    </div>
  );
}
