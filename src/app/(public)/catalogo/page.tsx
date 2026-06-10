'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, FileText, Zap, Plus, ChevronDown, X,
  ExternalLink, Loader2, ArrowLeft, CheckCircle,
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
import { useAuth } from '@/lib/context/auth-context';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import {
  getProveedorByFirebaseUid,
  getProductosOfrecidosMap,
} from '@/lib/supabase/proveedor-client';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getConductorBadges(atributos: Record<string, any>): string[] {
  const badges: string[] = [];
  if (atributos.configuracion_display)
    badges.push(String(atributos.configuracion_display));
  const amp = atributos?.performance_electrica?.ampacidad;
  const corriente = amp?.ducto_a ?? amp?.aire_a ?? amp?.enterrado_a;
  if (corriente != null) badges.push(`${corriente}A`);
  const nHilos = atributos?.conductores?.n_hilos;
  if (nHilos != null) badges.push(`${nHilos}H`);
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

const PRODUCTO_SELECT =
  'id, codigo_fabricante, marca, modelo, descripcion, categoria, slug, ' +
  'atributos, precio_ref_usd, imagen_url, ficha_tecnica_pdf, disponible_peru';

// Virtual category key used only in the frontend — never stored in DB
const CONDUCTOR_VIRTUAL_KEY = 'conductores';

// Cable types that belong to "Cables BT" in the category explorer
const CATEGORIAS_CONDUCTORES = new Set([
  'NH-90', 'TW-80', 'THW-90', 'N2XOH', 'NYY', 'N2XY',
  'RV-K', 'NLT', 'NMT', 'NPT', 'CTM', 'GPT', 'NHX-90', 'SOLAR_DC',
]);

// Cable cross-section icon — standard visual representation in the electrical industry
function CableIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="3"  x2="12" y2="7" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="3"  y1="12" x2="7"  y2="12" />
      <line x1="17" y1="12" x2="21" y2="12" />
    </svg>
  );
}

interface CategoriaPreview {
  categoria: string;
  imagen_url: string | null;
}

// ─── Componente interno (requiere Suspense por useSearchParams) ───────────────
function CatalogoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { canOfferProducts } = useRolePermissions();

  const categoriaParam = searchParams.get('categoria') ?? 'all';
  const marcaParam     = searchParams.get('marca')     ?? 'all';

  const [search, setSearch] = useState('');
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas]         = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [zoomUrl, setZoomUrl]       = useState<string | null>(null);
  const [categoriasPreview, setCategoriasPreview] = useState<CategoriaPreview[]>([]);
  const [showScrollTop, setShowScrollTop]         = useState(false);
  const [ofrecidosMap, setOfrecidosMap] = useState<Map<string, number | null>>(new Map());

  // ── Cargar mapa de productos ofrecidos (solo proveedor/admin) ─────────────
  useEffect(() => {
    if (!user?.uid || !canOfferProducts) return;
    getProveedorByFirebaseUid(user.uid).then((prov) => {
      if (!prov) return;
      getProductosOfrecidosMap(prov.id).then(setOfrecidosMap);
    });
  }, [user?.uid, canOfferProducts]);

  // ── Helpers para actualizar URL ────────────────────────────────────────────
  const buildUrl = (cat: string, marc: string) => {
    const p = new URLSearchParams();
    if (cat  !== 'all') p.set('categoria', cat);
    if (marc !== 'all') p.set('marca', marc);
    const q = p.toString();
    return q ? `/catalogo?${q}` : '/catalogo';
  };

  const handleCategoryClick = (cat: string) => {
    setIsFiltering(true);
    router.push(buildUrl(cat, marcaParam), { scroll: false });
  };

  const handleCategoriaChange = (cat: string) => {
    setIsFiltering(true);
    router.push(buildUrl(cat, marcaParam), { scroll: false });
  };

  const handleMarcaChange = (marc: string) => {
    setIsFiltering(true);
    router.push(buildUrl(categoriaParam, marc), { scroll: false });
  };

  const handleClearFilters = () => {
    setSearch('');
    router.push('/catalogo', { scroll: false });
    // No limpiar productos — mantener en memoria (Fix 2)
  };

  // ── Restaurar scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem('catalogo_scroll');
    if (saved) {
      window.scrollTo({ top: Number(saved), behavior: 'instant' });
      sessionStorage.removeItem('catalogo_scroll');
    }
  }, []);

  // ── Cerrar zoom con Escape ─────────────────────────────────────────────────
  useEffect(() => {
    if (!zoomUrl) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomUrl(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomUrl]);

  // ── Botón scroll-to-top ────────────────────────────────────────────────────
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

  // ── Cargar filtros + preview de categorías en paralelo ─────────────────────
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
        const rows = filterData as { categoria: string; marca: string }[];
        const cats = [...new Set(rows.map((d) => d.categoria).filter(Boolean))].sort() as string[];
        setCategorias(cats);
        setMarcas([...new Set(rows.map((d) => d.marca).filter(Boolean))].sort() as string[]);

        // Build image map from imgData (categories without images are still shown)
        const imageMap = new Map<string, string | null>();
        if (imgData) {
          for (const row of imgData as { categoria: string; imagen_url: string | null }[]) {
            if (row.categoria && !imageMap.has(row.categoria)) {
              imageMap.set(row.categoria, row.imagen_url);
            }
          }
        }

        // Every visible category gets a preview entry; image is null if not available
        const preview: CategoriaPreview[] = cats.map((cat) => ({
          categoria:  cat,
          imagen_url: imageMap.get(cat) ?? null,
        }));
        setCategoriasPreview(preview);
      }
    });
  }, []);

  // ── Búsqueda con debounce 400ms ────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const trimmed = search.trim();

        if (trimmed.length < 2) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q: any = catalogoClient.from('productos_catalogo').select(PRODUCTO_SELECT)
            .eq('disponible_peru', true);
          if (categoriaParam === CONDUCTOR_VIRTUAL_KEY)  q = q.in('categoria', [...CATEGORIAS_CONDUCTORES]);
          else if (categoriaParam !== 'all')            q = q.eq('categoria', categoriaParam);
          if (marcaParam !== 'all')                     q = q.eq('marca', marcaParam);
          const { data, error: sbError } = await q.order('marca');
          if (sbError) throw sbError;
          setProductos(data ?? []);
          return;
        }

        const applyFilters = (q: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let qq = q as any;
          qq = qq.eq('disponible_peru', true);
          if (categoriaParam === CONDUCTOR_VIRTUAL_KEY)  qq = qq.in('categoria', [...CATEGORIAS_CONDUCTORES]);
          else if (categoriaParam !== 'all')            qq = qq.eq('categoria', categoriaParam);
          if (marcaParam !== 'all')                     qq = qq.eq('marca', marcaParam);
          return qq;
        };

        // Capa 0 — código de fabricante exacto
        if (/^\d{5,8}$/.test(trimmed)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: dataCod } = await (catalogoClient.from('productos_catalogo').select(PRODUCTO_SELECT) as any)
            .eq('codigo_fabricante', trimmed)
            .eq('disponible_peru', true)
            .limit(10);
          if (dataCod && dataCod.length > 0) {
            setProductos(dataCod);
            return;
          }
        }

        // Capa 1 — FTS
        const ftsQuery = processSearchQuery(trimmed);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q1: any = catalogoClient.from('productos_catalogo').select(PRODUCTO_SELECT)
          .textSearch('search_vector', ftsQuery, { type: 'plain', config: 'spanish' });
        q1 = applyFilters(q1);
        const { data: data1, error: err1 } = await q1.order('marca');
        if (!err1 && data1 && data1.length > 0) { setProductos(data1); return; }

        // Capa 2 — ILIKE por token
        const tokens = normalizeText(trimmed).split(' ').filter(Boolean);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q2: any = catalogoClient.from('productos_catalogo').select(PRODUCTO_SELECT);
        for (const token of tokens) {
          q2 = q2.or(`descripcion.ilike.%${token}%,modelo.ilike.%${token}%,marca.ilike.%${token}%`);
        }
        q2 = applyFilters(q2);
        const { data: data2, error: err2 } = await q2.order('marca');
        if (!err2 && data2 && data2.length > 0) { setProductos(data2); return; }

        // Capa 3 — ILIKE full query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q3: any = catalogoClient.from('productos_catalogo').select(PRODUCTO_SELECT)
          .or(`descripcion.ilike.%${trimmed}%,modelo.ilike.%${trimmed}%,marca.ilike.%${trimmed}%`);
        q3 = applyFilters(q3);
        const { data: data3, error: err3 } = await q3.order('marca');
        if (err3) throw err3;
        setProductos(data3 ?? []);
      } catch {
        setError('No se pudo cargar el catálogo. Intenta de nuevo.');
      } finally {
        setLoading(false);
        setIsFiltering(false); // Fix 1: limpiar isFiltering cuando datos llegan
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, categoriaParam, marcaParam]);

  const showCategoryView = search === '' && categoriaParam === 'all' && marcaParam === 'all';
  const saveScroll = () => sessionStorage.setItem('catalogo_scroll', String(window.scrollY));
  const showSkeleton = loading || isFiltering; // Fix 1: skeleton durante transición

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
        <Select value={categoriaParam} onValueChange={handleCategoriaChange}>
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
        <Select value={marcaParam} onValueChange={handleMarcaChange}>
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

      {/* Breadcrumb — Fix 2: no limpia productos, solo navega a / */}
      {categoriaParam !== 'all' && (
        <button
          onClick={handleClearFilters}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="h-4 w-4" />
          Todas las categorías
        </button>
      )}

      {/* Grid de categorías */}
      {showCategoryView && !showSkeleton && categoriasPreview.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Explorar por categoría
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(() => {
              // Collapse all conductor categories into a single "Cables BT" chip
              const grid: { key: string; label: string; imagen_url: string | null; filterKey: string }[] = [];
              let addedConductores = false;
              for (const cat of categoriasPreview) {
                if (CATEGORIAS_CONDUCTORES.has(cat.categoria)) {
                  if (!addedConductores) {
                    grid.push({ key: CONDUCTOR_VIRTUAL_KEY, label: 'Cables BT', imagen_url: null, filterKey: CONDUCTOR_VIRTUAL_KEY });
                    addedConductores = true;
                  }
                } else {
                  grid.push({ key: cat.categoria, label: cat.categoria, imagen_url: cat.imagen_url, filterKey: cat.categoria });
                }
              }
              return grid.map((entry) => (
                <button
                  key={entry.key}
                  onClick={() => handleCategoryClick(entry.filterKey)}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left hover:shadow-md hover:border-primary/40 transition-all duration-200 bg-card"
                >
                  <div className="w-[60px] h-[60px] flex-shrink-0 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden">
                    {entry.imagen_url ? (
                      <img
                        src={entry.imagen_url}
                        alt={entry.label}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        decoding="async"
                        sizes="60px"
                      />
                    ) : entry.key === CONDUCTOR_VIRTUAL_KEY ? (
                      <CableIcon className="h-7 w-7 text-blue-500/60" />
                    ) : (
                      <Zap className="h-6 w-6 text-muted-foreground/25" />
                    )}
                  </div>
                  <span className="text-sm font-medium leading-snug">{entry.label}</span>
                </button>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Contador */}
      {!showSkeleton && !error && (
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

      {/* Skeleton — Fix 1: visible tanto con loading como isFiltering */}
      {showSkeleton && (
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
      {!showSkeleton && !error && productos.length === 0 && !showCategoryView && (
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

      {/* Grid de productos */}
      {!showSkeleton && !showCategoryView && !error && productos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p) => (
            <ProductoCard
              key={p.id}
              producto={p}
              onImageClick={setZoomUrl}
              onDetailsClick={saveScroll}
              canOfrecer={canOfferProducts}
              isOfrecido={ofrecidosMap.has(p.id)}
            />
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

// ─── Export público — Suspense requerido por useSearchParams ──────────────────
export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-muted rounded w-80 mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-60 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-5 bg-muted rounded w-2/3" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <CatalogoInner />
    </Suspense>
  );
}

// ─── Tipos y componente de card ───────────────────────────────────────────────
interface ProveedorRow {
  precio: number | null;
  url_producto: string | null;
  proveedor_id: string;
  stock: string | null;
  proveedores?: { nombre: string; logo_url: string | null; web: string | null; ciudad?: string | null } | null;
}

function getStockBadge(stock: string | null) {
  if (!stock || stock === '' || stock === '0' || stock.toLowerCase() === 'no') {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">A pedido</span>;
  }
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">En stock</span>;
}

function ProductoCard({
  producto: p,
  onImageClick,
  onDetailsClick,
  canOfrecer = false,
  isOfrecido = false,
}: {
  producto: ProductoCatalogo;
  onImageClick: (url: string) => void;
  onDetailsClick: () => void;
  canOfrecer?: boolean;
  isOfrecido?: boolean;
}) {
  const isConductor    = CATEGORIAS_CONDUCTORES.has(p.categoria);
  const atributoBadges = p.atributos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (isConductor ? getConductorBadges(p.atributos as Record<string, any>) : getAtributoBadges(p.atributos))
    : [];
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
        .select('proveedor_id, precio_pen, precio_minimo_pen, stock')
        .eq('producto_id', p.id);

      if (err1 || !pp || pp.length === 0) { setProveedores([]); return; }

      type PpRow = { proveedor_id: string; precio_pen: number | null; precio_minimo_pen: number | null; stock: string | null };
      type ProvRow = { id: string; nombre: string; slug: string; ciudad: string | null; logo_url: string | null; telefono: string | null; web: string | null };
      const ppRows = pp as PpRow[];
      const ids = ppRows.map((r) => r.proveedor_id).filter(Boolean);
      const { data: provs } = await catalogoClient
        .from('proveedores')
        .select('id, nombre, slug, ciudad, logo_url, telefono, web')
        .in('id', ids);

      if (!provs) { setProveedores([]); return; }

      const provRows = provs as ProvRow[];
      setProveedores(
        ppRows
          .map((row) => ({
            proveedor_id: row.proveedor_id,
            precio:       row.precio_pen ?? row.precio_minimo_pen ?? null,
            url_producto: null as string | null,
            stock:        row.stock ?? null,
            proveedores:  provRows.find((pv) => pv.id === row.proveedor_id) ?? null,
          }))
          .filter((row) => row.proveedores !== null) as ProveedorRow[]
      );
    } catch {
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

        <div className="flex gap-3">
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
                sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 96px"
              />
            ) : (
              <Zap className="h-7 w-7 text-muted-foreground/25" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {p.marca}
              </span>
              <Badge variant="secondary" className="shrink-0 text-xs">{p.categoria}</Badge>
            </div>

            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
              {p.descripcion}
            </p>

            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-gray-500 font-mono truncate">{p.modelo}</span>
              {p.codigo_fabricante && (
                <span className="text-xs text-gray-400 ml-2 shrink-0">
                  Cód: <span className="font-medium text-gray-600">{p.codigo_fabricante}</span>
                </span>
              )}
            </div>

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
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 leading-none">Precio ref.</div>
                    <div className="text-sm font-semibold text-blue-700 whitespace-nowrap">
                      S/ {(Number(p.precio_ref_usd) * 0.75 * 3.6).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
                        <img src={pv.logo_url} alt={pv.nombre} className="w-6 h-6 rounded object-contain flex-shrink-0" loading="lazy" decoding="async" sizes="24px" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {pv?.nombre?.charAt(0) ?? '?'}
                        </div>
                      )}
                      <span className="text-xs font-medium flex-1 truncate">
                        {pv?.nombre ?? '—'}
                        {pv?.ciudad && <span className="text-gray-700 font-normal"> ({pv.ciudad})</span>}
                      </span>
                      {getStockBadge(row.stock)}
                      {row.precio != null && (
                        <span className="text-xs font-mono text-gray-900 font-medium">S/{row.precio.toFixed(2)}</span>
                      )}
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-0.5 flex-shrink-0">
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

        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-3 border-t">
          <Button variant="outline" size="sm" className="text-xs h-7 px-2 gap-1"
            onClick={() => alert('Función próximamente disponible')}>
            <Plus className="h-3 w-3" />
            RFQ
          </Button>

          <Button variant="outline" size="sm" className="text-xs h-7 px-2 gap-1" onClick={toggleProveedores}>
            Proveedores
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showProveedores ? 'rotate-180' : ''}`} />
          </Button>

          {p.ficha_tecnica_pdf && (
            <Button variant="outline" size="sm" className="text-xs h-7 px-2 gap-1" asChild>
              <a href={p.ficha_tecnica_pdf} target="_blank" rel="noopener noreferrer">
                <FileText className="h-3 w-3" />
                PDF
              </a>
            </Button>
          )}

          {canOfrecer && (
            isOfrecido ? (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Ofreciendo</span>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="text-xs h-7 px-2 gap-1" asChild>
                <Link href={`/proveedor/agregar?q=${encodeURIComponent(p.modelo)}`}>
                  <Plus className="h-3 w-3" />
                  Ofrecer
                </Link>
              </Button>
            )
          )}

          {href ? (
            <Button variant="outline" size="sm" className="text-xs h-7 px-2 ml-auto" asChild onClick={onDetailsClick}>
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
