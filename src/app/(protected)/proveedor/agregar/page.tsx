'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { catalogoClient } from '@/lib/supabase/catalogo-client';
import {
  getProveedorByFirebaseUid,
  getProductosOfrecidosMap,
  insertOferta,
  type Proveedor,
} from '@/lib/supabase/proveedor-client';
import type { ProductoCatalogo } from '@/types/catalogo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, Zap, Loader2, CheckCircle } from 'lucide-react';

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function processSearchQuery(rawQuery: string): string {
  const words = normalizeText(rawQuery).split(' ').filter(Boolean);
  return words
    .map((word) => {
      if (word.length <= 2) return word;
      const variants: string[] = [];
      for (let len = word.length; len >= 3; len--) variants.push(word.slice(0, len));
      return variants.length > 1 ? `(${variants.join(' | ')})` : variants[0];
    })
    .join(' & ');
}

// ─── Inner (requiere Suspense por useSearchParams) ────────────────────────────

function AgregarInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { canOfferProducts } = useRolePermissions();
  const { toast } = useToast();

  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [ofrecidosMap, setOfrecidosMap] = useState<Map<string, number | null>>(new Map());
  const [loadingInit, setLoadingInit] = useState(true);

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductoCatalogo | null>(null);
  const [formData, setFormData] = useState({
    precio_pen: '',
    precio_minimo_pen: '',
    stock: 'En stock',
    codigo_proveedor_origen: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Cargar proveedor + mapa de ofertas existentes
  useEffect(() => {
    if (!user?.uid || !canOfferProducts) { setLoadingInit(false); return; }
    (async () => {
      const prov = await getProveedorByFirebaseUid(user.uid);
      if (prov) {
        setProveedor(prov);
        const map = await getProductosOfrecidosMap(prov.id);
        setOfrecidosMap(map);
      }
      setLoadingInit(false);
    })();
  }, [user?.uid, canOfferProducts]);

  // Búsqueda con debounce 400ms
  useEffect(() => {
    if (search.trim().length < 2) { setProductos([]); return; }
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const ftsQuery = processSearchQuery(search.trim());
        const PRODUCTO_SELECT =
          'id, codigo_fabricante, marca, modelo, descripcion, categoria, slug, ' +
          'atributos, precio_ref_usd, imagen_url, ficha_tecnica_pdf, disponible_peru';
        const { data, error } = await catalogoClient
          .from('productos_catalogo')
          .select(PRODUCTO_SELECT)
          .textSearch('search_vector', ftsQuery, { type: 'plain', config: 'spanish' })
          .eq('disponible_peru', true)
          .order('marca')
          .limit(24);

        if (!error && data && data.length > 0) {
          setProductos(data as unknown as ProductoCatalogo[]);
        } else {
          const { data: d2 } = await catalogoClient
            .from('productos_catalogo')
            .select(PRODUCTO_SELECT)
            .or(`descripcion.ilike.%${search.trim()}%,modelo.ilike.%${search.trim()}%`)
            .eq('disponible_peru', true)
            .order('marca')
            .limit(24);
          setProductos((d2 as unknown as ProductoCatalogo[]) ?? []);
        }
      } finally {
        setLoadingSearch(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const openSheet = (producto: ProductoCatalogo) => {
    setSelectedProduct(producto);
    setFormData({
      precio_pen: '',
      precio_minimo_pen: '',
      stock: 'En stock',
      codigo_proveedor_origen: '',
    });
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!proveedor || !selectedProduct) return;
    setSubmitting(true);
    const { ok, error } = await insertOferta({
      proveedor_id: proveedor.id,
      producto_id: selectedProduct.id,
      precio_pen: formData.precio_pen ? parseFloat(formData.precio_pen) : null,
      precio_minimo_pen: formData.precio_minimo_pen
        ? parseFloat(formData.precio_minimo_pen)
        : null,
      stock: formData.stock || null,
      activo: true,
      codigo_proveedor_origen: formData.codigo_proveedor_origen || null,
    });
    setSubmitting(false);

    if (ok) {
      setOfrecidosMap((prev) => {
        const next = new Map(prev);
        next.set(
          selectedProduct.id,
          formData.precio_pen ? parseFloat(formData.precio_pen) : null
        );
        return next;
      });
      toast({
        title: 'Producto agregado',
        description: `${selectedProduct.descripcion} añadido a tu catálogo.`,
      });
      setSheetOpen(false);
    } else {
      toast({ title: 'Error al agregar', description: error, variant: 'destructive' });
    }
  };

  if (!canOfferProducts) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Acceso restringido.</p>
      </div>
    );
  }

  if (loadingInit) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/proveedor">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Agregar producto</h1>
          <p className="text-muted-foreground text-sm">
            Busca en el catálogo y publica tu precio
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ej: termomagnetico 32A, llave diferencial 2P..."
          className="pl-9"
          autoFocus
        />
      </div>

      {loadingSearch && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loadingSearch && search.trim().length < 2 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-25" />
          <p className="text-sm">Escribe al menos 2 caracteres para buscar</p>
        </div>
      )}

      {!loadingSearch && search.trim().length >= 2 && productos.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>Sin resultados para &quot;{search.trim()}&quot;</p>
        </div>
      )}

      {!loadingSearch && productos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {productos.map((prod) => {
            const yaOfrecido = ofrecidosMap.has(prod.id);
            return (
              <Card key={prod.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-14 h-14 flex-shrink-0 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                      {prod.imagen_url ? (
                        <img
                          src={prod.imagen_url}
                          alt={prod.modelo}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <Zap className="h-5 w-5 text-muted-foreground/25" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {prod.marca}
                      </p>
                      <p className="text-sm font-semibold leading-snug line-clamp-2">
                        {prod.descripcion}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{prod.modelo}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <Badge variant="secondary" className="text-xs">
                      {prod.categoria}
                    </Badge>
                    {yaOfrecido ? (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Ya ofrecido</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openSheet(prod)}
                      >
                        Ofrecer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sheet con formulario */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nueva oferta</SheetTitle>
          </SheetHeader>

          {selectedProduct && (
            <div className="mt-6 space-y-5">
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-12 h-12 flex-shrink-0 rounded bg-white flex items-center justify-center overflow-hidden">
                  {selectedProduct.imagen_url ? (
                    <img
                      src={selectedProduct.imagen_url}
                      alt={selectedProduct.modelo}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Zap className="h-5 w-5 text-muted-foreground/25" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug">
                    {selectedProduct.descripcion}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProduct.marca} · {selectedProduct.modelo}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Precio (S/)</label>
                  <Input
                    type="number"
                    placeholder="Ej: 45.00"
                    value={formData.precio_pen}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, precio_pen: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Precio mínimo (S/){' '}
                    <span className="text-muted-foreground font-normal">opcional</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Precio por volumen"
                    value={formData.precio_minimo_pen}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, precio_minimo_pen: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Stock</label>
                  <Select
                    value={formData.stock}
                    onValueChange={(val) => setFormData((f) => ({ ...f, stock: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="En stock">En stock</SelectItem>
                      <SelectItem value="A pedido">A pedido</SelectItem>
                      <SelectItem value="Agotado">Agotado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Código interno{' '}
                    <span className="text-muted-foreground font-normal">opcional</span>
                  </label>
                  <Input
                    placeholder="Tu código de referencia"
                    value={formData.codigo_proveedor_origen}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        codigo_proveedor_origen: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="mt-6 flex gap-2">
            <SheetClose asChild>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
            </SheetClose>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Agregar al catálogo
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Export con Suspense requerido por useSearchParams ────────────────────────

export default function AgregarProductoPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AgregarInner />
    </Suspense>
  );
}
