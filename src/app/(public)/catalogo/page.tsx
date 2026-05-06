'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, FileText, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { catalogoClient } from '@/lib/supabase/catalogo-client';
import type { AtributosTecnicos, ProductoCatalogo } from '@/types/catalogo';

// Convierte el jsonb atributos en badges legibles
function getAtributoBadges(atributos: AtributosTecnicos): string[] {
  const badges: string[] = [];
  if (atributos.corriente_a != null)     badges.push(`${atributos.corriente_a}A`);
  if (atributos.polos != null)           badges.push(`${atributos.polos}P`);
  if (atributos.ruptura_ka != null)      badges.push(`${atributos.ruptura_ka}kA`);
  if (atributos.sensibilidad_ma != null) badges.push(`${atributos.sensibilidad_ma}mA`);
  if (atributos.tension_bobina_v != null) badges.push(`${atributos.tension_bobina_v}V bobina`);
  if (atributos.diametro_pulg != null)   badges.push(`${atributos.diametro_pulg}"`);
  if (atributos.con_usb)                 badges.push('USB');
  if (atributos.potencia_kw != null)     badges.push(`${atributos.potencia_kw}kW`);
  return badges;
}

const normalizeText = (text: string): string =>
  text.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();

function processSearchQuery(rawQuery: string): string {
  const words = normalizeText(rawQuery).split(' ').filter(Boolean);
  return words.map(word => {
    if (word.length <= 2) return word;
    const variants: string[] = [];
    for (let len = word.length; len >= 3; len--) variants.push(word.slice(0, len));
    return variants.length > 1 ? `(${variants.join(' | ')})` : variants[0];
  }).join(' & ');
}

export default function CatalogoPage() {
  const [search, setSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('all');
  const [marcaFiltro, setMarcaFiltro] = useState('all');
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar opciones de filtros al montar (una sola llamada, dos campos)
  useEffect(() => {
    catalogoClient
      .from('productos_catalogo')
      .select('categoria, marca')
      .then(({ data }) => {
        if (!data) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = data as any[];
        setCategorias(
          [...new Set(rows.map((d) => d.categoria).filter(Boolean))].sort() as string[]
        );
        setMarcas(
          [...new Set(rows.map((d) => d.marca).filter(Boolean))].sort() as string[]
        );
      });
  }, []);

  // Búsqueda con debounce 400ms — 3 capas: FTS prefijos → ILIKE por token → ILIKE full
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const trimmed = search.trim();

        if (trimmed.length < 2) {
          // Sin filtro de texto — muestra todo
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q: any = catalogoClient.from('productos_catalogo').select('*');
          if (categoriaFiltro !== 'all') q = q.eq('categoria', categoriaFiltro);
          if (marcaFiltro !== 'all')     q = q.eq('marca', marcaFiltro);
          const { data, error: sbError } = await q.order('marca');
          if (sbError) throw sbError;
          setProductos(data ?? []);
          return;
        }

        const applyFilters = (q: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let qq = q as any;
          if (categoriaFiltro !== 'all') qq = qq.eq('categoria', categoriaFiltro);
          if (marcaFiltro !== 'all')     qq = qq.eq('marca', marcaFiltro);
          return qq;
        };

        // Capa 1 — FTS con variantes de prefijos (plain permite & y |)
        const ftsQuery = processSearchQuery(trimmed);
        console.log('[catalogo] FTS query:', ftsQuery);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q1: any = catalogoClient.from('productos_catalogo').select('*')
          .textSearch('search_vector', ftsQuery, { type: 'plain', config: 'spanish' });
        q1 = applyFilters(q1);
        const { data: data1, error: err1 } = await q1.order('marca');

        if (!err1 && data1 && data1.length > 0) {
          console.log('[catalogo] capa 1 hit:', data1.length);
          setProductos(data1);
          return;
        }

        // Capa 2 — ILIKE por cada token normalizado (AND implícito vía .or encadenado)
        const tokens = normalizeText(trimmed).split(' ').filter(Boolean);
        console.log('[catalogo] capa 2 tokens:', tokens);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q2: any = catalogoClient.from('productos_catalogo').select('*');
        for (const token of tokens) {
          q2 = q2.or(`descripcion.ilike.%${token}%,modelo.ilike.%${token}%,marca.ilike.%${token}%`);
        }
        q2 = applyFilters(q2);
        const { data: data2, error: err2 } = await q2.order('marca');

        if (!err2 && data2 && data2.length > 0) {
          console.log('[catalogo] capa 2 hit:', data2.length);
          setProductos(data2);
          return;
        }

        // Capa 3 — ILIKE del query completo como fallback final
        console.log('[catalogo] capa 3 fallback');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q3: any = catalogoClient.from('productos_catalogo').select('*')
          .or(`descripcion.ilike.%${trimmed}%,modelo.ilike.%${trimmed}%,marca.ilike.%${trimmed}%`);
        q3 = applyFilters(q3);
        const { data: data3, error: err3 } = await q3.order('marca');
        if (err3) throw err3;
        console.log('[catalogo] capa 3 hit:', data3?.length ?? 0);
        setProductos(data3 ?? []);
      } catch {
        setError('No se pudo cargar el catálogo. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, categoriaFiltro, marcaFiltro]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Catálogo de Productos Eléctricos
        </h1>
        <p className="text-muted-foreground">
          Buscador técnico de productos y equipos eléctricos
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por modelo o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={marcaFiltro} onValueChange={setMarcaFiltro}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las marcas</SelectItem>
            {marcas.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contador */}
      {!loading && !error && (
        <p className="text-sm text-muted-foreground mb-5">
          {productos.length}{' '}
          {productos.length === 1 ? 'producto encontrado' : 'productos encontrados'}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16 text-destructive">
          <p>{error}</p>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex justify-between mb-2">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-5 bg-muted rounded w-1/4" />
                </div>
                <div className="h-5 bg-muted rounded w-2/3" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-4/5" />
                <div className="flex gap-2 pt-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-5 bg-muted rounded w-10" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && !error && productos.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-25" />
          <p className="font-medium">
            {search.trim()
              ? `No se encontraron productos para "${search.trim()}"`
              : 'Sin productos disponibles'}
          </p>
          {search.trim() && (
            <p className="text-sm mt-2">
              Intenta con términos como{' '}
              <span className="font-medium text-foreground">"termomagnetico 32A"</span>
              {' '}o{' '}
              <span className="font-medium text-foreground">"llave termica 2 polos"</span>
            </p>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && productos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p) => (
            <ProductoCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductoCard({ producto: p }: { producto: ProductoCatalogo }) {
  const atributoBadges = p.atributos ? getAtributoBadges(p.atributos) : [];
  const href = p.slug
    ? `/catalogo/${p.marca.toLowerCase().replace(/\s+/g, '-')}/${p.slug}`
    : null;

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        {/* Desktop: marca + badge en fila superior */}
        <div className="hidden md:flex items-start justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {p.marca}
          </span>
          <Badge variant="secondary" className="shrink-0 text-xs">{p.categoria}</Badge>
        </div>

        {/* Mobile: row [imagen | texto]; Desktop: col [imagen / texto] */}
        <div className="flex flex-row gap-3 md:flex-col md:gap-2">
          {/* Imagen */}
          <div className="flex-shrink-0 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center w-20 h-20 md:w-full md:h-[90px]">
            {p.imagen_url ? (
              <img
                src={p.imagen_url}
                alt={p.modelo}
                className="w-full h-full object-contain"
              />
            ) : (
              <Zap className="h-7 w-7 text-muted-foreground/25" />
            )}
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            {/* Mobile: marca + badge junto al texto */}
            <div className="flex md:hidden items-start justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {p.marca}
              </span>
              <Badge variant="secondary" className="shrink-0 text-xs">{p.categoria}</Badge>
            </div>
            <h3 className="font-semibold text-sm leading-snug">{p.modelo}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.descripcion}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-3 pt-0">
        {/* Badges técnicos */}
        {atributoBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {atributoBadges.map((badge) => (
              <Badge key={badge} variant="outline" className="text-xs font-mono px-1.5 py-0">
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer: precio + PDF + Ver detalles */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t">
          <div className="flex items-center gap-3">
            {p.precio_ref_pen != null && (
              <span className="text-sm font-semibold">
                S/. {p.precio_ref_pen.toFixed(2)}
              </span>
            )}
            {p.ficha_tecnica_pdf && (
              <a
                href={p.ficha_tecnica_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors"
                title="Ficha técnica PDF"
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </a>
            )}
          </div>
          {href ? (
            <Button variant="outline" size="sm" className="text-xs h-7" asChild>
              <Link href={href}>Ver detalles</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="text-xs h-7" disabled>
              Ver detalles
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
