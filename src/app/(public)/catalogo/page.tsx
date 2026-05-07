'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search, FileText, Zap, Plus, ChevronDown, ChevronUp, X,
  ExternalLink, Loader2, ArrowLeft,
} from 'lucide-react';
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

function getAtributoBadges(atributos: AtributosTecnicos): string[] {
  const badges: string[] = [];
  if (atributos.corriente_a != null)      badges.push(`${atributos.corriente_a}A`);
  if (atributos.polos != null)            badges.push(`${atributos.polos}P`);
  if (atributos.ruptura_ka != null)       badges.push(`${atributos.ruptura_ka}kA`);
  if (atributos.sensibilidad_ma != null)  badges.push(`${atributos.sensibilidad_ma}mA`);
  if (atributos.tension_bobina_v != null) badges.push(`${atributos.tension_bobina_v}V bobina`);
  if (atributos.diametro_pulg != null)    badges.push(`${atributos.diametro_pulg}"`);
  if (atributos.con_usb)                  badges.push('USB');
  if (atributos.potencia_kw != null)      badges.push(`${atributos.potencia_kw}kW`);
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

interface CategoriaPreview {
  categoria: string;
  imagen_url: string | null;
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
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [categoriasPreview, setCategoriasPreview] = useState<CategoriaPreview[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Restaurar posición de scroll al volver desde detalle
  useEffect(() => {
    const saved = sessionStorage.getItem('catalogo_scroll');
    if (saved) {
      window.scrollTo({ top: Number(saved), behavior: 'instant' });
      sessionStorage.removeItem('catalogo_scroll');
    }
  }, []);

  // Cerrar zoom con Escape
  useEffect(() => {
    if (!zoomUrl) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomUrl(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomUrl]);

  // Botón scroll-to-top
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setShowScrollTop(scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Cargar filtros + preview de categorías en paralelo
  useEffect(() => {
    Promise.all([
      catalogoClient
        .from('productos_catalogo')
        .select('categoria, marca')
        .eq('disponible_peru', true),
      catalogoClient
        .from('productos_catalogo')
        .select('categoria, imagen_url')
        .eq('disponible_peru', true)
        .not('imagen_url', 'is', null)
        .neq('imagen_url', '')
        .order('categoria', { ascending: true })
        .order('id', { ascending: true }),
    ]).then(([{ data: filterData }, { data: imgData }]) => {
      if (filterData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = filterData as any[];
        setCategorias([...new Set(rows.map((d) => d.categoria).filter(Boolean))].sort() as string[]);
        setMarcas([...new Set(rows.map((d) => d.marca).filter(Boolean))].sort() as string[]);
      }
      if (imgData) {
        const seen = new Set<string>();
        const preview: CategoriaPreview[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of imgData as any[]) {
          if (row.categoria && !seen.has(row.categoria)) {
            seen.add(row.categoria);
            preview.push({ categoria: row.categoria, imagen_url: row.imagen_url });
          }
        }
        setCategoriasPreview(preview.sort((a, b) => a.categoria.localeCompare(b.categoria)));
      }
    });
  }, []);

  // Búsqueda con debounce 400ms — capa 0 código + FTS + ILIKE x2
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const trimmed = search.trim();

        if (trimmed.length < 2) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q: any = catalogoClient.from('productos_catalogo').select('*')
            .eq('disponible_peru', true);
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
          qq = qq.eq('disponible_peru', true);
          if (categoriaFiltro !== 'all') qq = qq.eq('categoria', categoriaFiltro);
          if (marcaFiltro !== 'all')     qq = qq.eq('marca', marcaFiltro);
          return qq;
        };

        // Capa 0 — código de fabricante exacto (solo dígitos 5-8 chars)
        if (/^\d{5,8}$/.test(trimmed)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: dataCod } = await (catalogoClient.from('productos_catalogo').select('*') as any)
            .eq('codigo_fabricante', trimmed)
            .eq('disponible_peru', true)
            .limit(10);
          if (dataCod && dataCod.length > 0) {
            console.log('[catalogo] capa 0 (código) hit:', dataCod.length);
            setProductos(dataCod);
            return;
          }
        }

        // Capa 1 — FTS con variantes de prefijos
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

        // Capa 2 — ILIKE por token
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

        // Capa 3 — ILIKE full query
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

  const showCategoryView = search === '' && categoriaFiltro === 'all' && marcaFiltro === 'all';
  const saveScroll = () => sessionStorage.setItem('catalogo_scroll', String(window.scrollY));
  //console.log('[render] showScrollTop:', showScrollTop);

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

      {/* Breadcrumb cuando hay categoría activa */}
      {categoriaFiltro !== 'all' && (
        <button
          onClick={() => setCategoriaFiltro('all')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="h-4 w-4" />
          Todas las categorías
        </button>
      )}

      {/* Grid de categorías — solo cuando no hay búsqueda ni filtros */}
      {showCategoryView && !loading && categoriasPreview.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Explorar por categoría
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoriasPreview.map((cat) => (
              <button
                key={cat.categoria}
                onClick={() => setCategoriaFiltro(cat.categoria)}
                className="flex items-center gap-3 rounded-lg border p-3 text-left hover:shadow-md hover:border-primary/40 transition-all duration-200 bg-card"
              >
                <div className="w-[60px] h-[60px] flex-shrink-0 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden">
                  {cat.imagen_url ? (
                    <img
                      src={cat.imagen_url}
                      alt={cat.categoria}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Zap className="h-6 w-6 text-muted-foreground/25" />
                  )}
                </div>
                <span className="text-sm font-medium leading-snug">{cat.categoria}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* Grid de productos — solo cuando hay búsqueda o filtro activo */}
      {!showCategoryView && !loading && !error && productos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p) => (
            <ProductoCard key={p.id} producto={p} onImageClick={setZoomUrl} onDetailsClick={saveScroll} />
          ))}
        </div>
      )}

      {/* Modal zoom imagen */}
      {zoomUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center transition-opacity"
          onClick={() => setZoomUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl leading-none p-2 hover:opacity-70"
            onClick={() => setZoomUrl(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={zoomUrl}
            alt="Zoom"
            className="max-w-sm max-h-[80vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Botón scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '50%',
            transform: 'translateX(50%)',
            zIndex: 99999,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#374151',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(4px)',
            transition: 'opacity 0.2s ease',
          }}
          aria-label="Volver arriba"
        >
          ↑
        </button>
      )}
    </div>
  );
}

interface ProveedorRow {
  precio: number | null;
  url_producto: string | null;
  proveedor_id: string;
  proveedores?: { nombre: string; logo_url: string | null; web: string | null; ciudad?: string | null } | null;
}

function ProductoCard({
  producto: p,
  onImageClick,
  onDetailsClick,
}: {
  producto: ProductoCatalogo;
  onImageClick: (url: string) => void;
  onDetailsClick: () => void;
}) {
  const atributoBadges = p.atributos ? getAtributoBadges(p.atributos) : [];
  const href = p.slug
    ? `/catalogo/${p.marca.toLowerCase().replace(/\s+/g, '-')}/${p.slug}`
    : null;

  const [showProveedores, setShowProveedores] = useState(false);
  const [proveedores, setProveedores] = useState<ProveedorRow[]>([]);
  const [loadingProv, setLoadingProv] = useState(false);
  const fetchedRef = useRef(false);

  const fetchProveedores = async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoadingProv(true);

    try {
      const { data: pp, error: err1 } = await catalogoClient
        .from('proveedor_producto')
        .select('proveedor_id, precio_pen, precio_minimo_pen, activo')
        .eq('producto_id', p.id);

      //console.log('[prov] pp:', pp, err1);

      if (err1 || !pp || pp.length === 0) {
        setProveedores([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ids = (pp as any[]).map((r: any) => r.proveedor_id).filter(Boolean);
      const { data: provs, error: err2 } = await catalogoClient
        .from('proveedores')
        .select('id, nombre, slug, ciudad, logo_url, telefono, web')
        .in('id', ids);

      //console.log('[prov] provs:', provs, err2);

      if (!provs) {
        setProveedores([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (pp as any[])
        .map((row: any) => ({
          proveedor_id: row.proveedor_id,
          precio:       row.precio_pen ?? row.precio_minimo_pen ?? null,
          url_producto: null,
          proveedores:  provs.find((pv: any) => pv.id === row.proveedor_id) ?? null,
        }))
        .filter((row: any) => row.proveedores !== null);

      setProveedores(result);
    } catch (e) {
      console.error('[prov] error:', e);
      setProveedores([]);
    } finally {
      setLoadingProv(false);
    }
  };

  const toggleProveedores = () => {
    setShowProveedores((v) => !v);
    fetchProveedores();
  };

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex flex-col flex-1 gap-3">

        {/* Fila principal: imagen + contenido */}
        <div className="flex gap-3">
          {/* Imagen */}
          <div
            className={`flex-shrink-0 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 ${p.imagen_url ? 'cursor-zoom-in' : ''}`}
            onClick={() => p.imagen_url && onImageClick(p.imagen_url)}
          >
            {p.imagen_url ? (
              <img
                src={p.imagen_url}
                alt={p.modelo}
                className="w-full h-full object-contain"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <Zap className="h-7 w-7 text-muted-foreground/25" />
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {/* Marca + Categoría */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {p.marca}
              </span>
              <Badge variant="secondary" className="shrink-0 text-xs">{p.categoria}</Badge>
            </div>

            {/* Descripción */}
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
              {p.descripcion}
            </p>

            {/* Modelo + código fabricante */}
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-gray-500 font-mono truncate">{p.modelo}</span>
              {p.codigo_fabricante && (
                <span className="text-xs text-gray-400 ml-2 shrink-0">
                  Cód: <span className="font-medium text-gray-600">{p.codigo_fabricante}</span>
                </span>
              )}
            </div>

            {/* Badges técnicos + precio referencial */}
            {(atributoBadges.length > 0 || (p.precio_ref_usd && Number(p.precio_ref_usd) > 0)) && (
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <div className="flex flex-wrap gap-1">
                  {atributoBadges.map((badge) => (
                    <Badge key={badge} variant="outline" className="text-xs font-mono px-1.5 py-0">
                      {badge}
                    </Badge>
                  ))}
                </div>
                {p.precio_ref_usd && Number(p.precio_ref_usd) > 0 && (
                  <span className="text-sm font-semibold text-blue-700 whitespace-nowrap">
                    S/ {(Number(p.precio_ref_usd) * 0.75 * 3.6).toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panel de proveedores expandible */}
        {showProveedores && (
          <div className="border rounded-md p-3 bg-muted/30 text-sm">
            {loadingProv ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">Cargando proveedores...</span>
              </div>
            ) : proveedores.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin proveedores listados aún.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {proveedores.map((row, i) => {
                  const pv = row.proveedores;
                  const link = row.url_producto ?? pv?.web ?? null;
                  return (
                    <li key={i} className="flex items-center gap-2">
                      {pv?.logo_url ? (
                        <img
                          src={pv.logo_url}
                          alt={pv.nombre}
                          className="w-6 h-6 rounded object-contain flex-shrink-0"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {pv?.nombre?.charAt(0) ?? '?'}
                        </div>
                      )}
                      <span className="text-xs font-medium flex-1 truncate">
                        {pv?.nombre ?? '—'}
                        {pv?.ciudad && (
                          <span className="text-gray-400 font-normal"> ({pv.ciudad})</span>
                        )}
                      </span>
                      {row.precio != null && (
                        <span className="text-xs font-mono">S/ {row.precio.toFixed(2)}</span>
                      )}
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-0.5 flex-shrink-0"
                        >
                          Ver <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Footer: 4 botones */}
        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-3 border-t">
          {/* RFQ */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2 gap-1"
            onClick={() => alert('Función próximamente disponible')}
          >
            <Plus className="h-3 w-3" />
            RFQ
          </Button>

          {/* Proveedores */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2 gap-1"
            onClick={toggleProveedores}
          >
            Proveedores
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showProveedores ? 'rotate-180' : ''}`} />
          </Button>

          {/* PDF */}
          {p.ficha_tecnica_pdf && (
            <Button variant="outline" size="sm" className="text-xs h-7 px-2 gap-1" asChild>
              <a href={p.ficha_tecnica_pdf} target="_blank" rel="noopener noreferrer">
                <FileText className="h-3 w-3" />
                PDF
              </a>
            </Button>
          )}

          {/* Ver detalles */}
          {href ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2 ml-auto"
              asChild
              onClick={onDetailsClick}
            >
              <Link href={href}>Ver detalles</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="text-xs h-7 px-2 ml-auto" disabled>
              Ver detalles
            </Button>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
