'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth }    from '@/lib/context/auth-context';
import { Button }     from '@/components/ui/button';
import { Badge }      from '@/components/ui/badge';
import { Input }      from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast }   from '@/hooks/use-toast';
import {
  Loader2, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown,
  ExternalLink, Package,
} from 'lucide-react';
import Link from 'next/link';
import { CABLE_NOMENCLATURE } from '@/lib/pipeline/cable-nomenclature';

// ── Types ─────────────────────────────────────────────────────────────────────

type ProductoRow = {
  id:              string;
  marca:           string;
  modelo:          string;
  descripcion:     string | null;
  categoria:       string | null;
  slug:            string;
  disponible_peru: boolean;
  precio_ref_usd:  number | null;
  created_at:      string;
};

type SortCol = 'created_at' | 'marca' | 'categoria' | 'modelo' | 'disponible_peru' | 'precio_ref_usd';

// ── Constants ─────────────────────────────────────────────────────────────────

const MARCAS_CONOCIDAS = ['INDECO', 'CELSA', 'ELCOPE', 'MIGUELEZ', 'NEXANS', 'CHINT'];

const CATEGORIAS_ACTIVAS = Object.entries(CABLE_NOMENCLATURE)
  .filter(([, def]) => def.status !== 'descontinuado')
  .map(([clave, def]) => ({ value: clave, label: def.tipo_mercado_peru }))
  .sort((a, b) => a.label.localeCompare(b.label));

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCatalogoPage() {
  const { user }  = useAuth();
  const { toast } = useToast();

  const [productos,    setProductos]    = useState<ProductoRow[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // Filters
  const [filterMarca,      setFilterMarca]      = useState('all');
  const [filterCategoria,  setFilterCategoria]  = useState('all');
  const [filterDisponible, setFilterDisponible] = useState('all');

  // Sort
  const [sortCol, setSortCol] = useState<SortCol>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Inline price edit
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: string } | null>(null);

  // Busy state per row (for toggle spinner)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const fetchProductos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        page:      String(page),
        order:     sortCol,
        dir:       sortDir,
      });
      if (filterMarca      !== 'all') params.set('marca',      filterMarca);
      if (filterCategoria  !== 'all') params.set('categoria',  filterCategoria);
      if (filterDisponible !== 'all') params.set('disponible', filterDisponible);

      const res = await fetch(`/api/admin/catalogo?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json() as { productos?: ProductoRow[]; total?: number; pages?: number; error?: string };
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      setProductos(d.productos ?? []);
      setTotal(d.total ?? 0);
      setPages(d.pages ?? 1);
      setSelected(new Set());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, page, sortCol, sortDir, filterMarca, filterCategoria, filterDisponible]);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filterMarca, filterCategoria, filterDisponible, sortCol, sortDir]);

  async function patchApi(body: object) {
    if (!user) return false;
    const token = await user.getIdToken();
    const res = await fetch('/api/admin/catalogo', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify(body),
    });
    return res.ok;
  }

  // Toggle single
  async function toggleDisponible(p: ProductoRow) {
    const newVal = !p.disponible_peru;
    // Optimistic update
    setProductos((prev) => prev.map((r) => r.id === p.id ? { ...r, disponible_peru: newVal } : r));
    setBusyIds((s) => new Set([...s, p.id]));
    const ok = await patchApi({ id: p.id, disponible_peru: newVal });
    setBusyIds((s) => { const n = new Set(s); n.delete(p.id); return n; });
    if (!ok) {
      setProductos((prev) => prev.map((r) => r.id === p.id ? { ...r, disponible_peru: p.disponible_peru } : r));
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  }

  // Bulk toggle
  async function bulkToggle(val: boolean) {
    const ids = [...selected];
    if (!ids.length) return;
    setProductos((prev) => prev.map((r) => selected.has(r.id) ? { ...r, disponible_peru: val } : r));
    const ok = await patchApi({ ids, disponible_peru: val });
    if (!ok) {
      toast({ title: 'Error en acción masiva', variant: 'destructive' });
      fetchProductos();
    } else {
      toast({ title: `${ids.length} producto${ids.length > 1 ? 's' : ''} ${val ? 'activado' : 'desactivado'}${ids.length > 1 ? 's' : ''}` });
      setSelected(new Set());
    }
  }

  // Save price
  async function savePrice(id: string, rawValue: string) {
    const precio = rawValue.trim() === '' ? null : parseFloat(rawValue);
    if (rawValue.trim() !== '' && isNaN(precio as number)) {
      toast({ title: 'Precio inválido', variant: 'destructive' });
      return;
    }
    setEditingPrice(null);
    setProductos((prev) => prev.map((r) => r.id === id ? { ...r, precio_ref_usd: precio } : r));
    const ok = await patchApi({ id, precio_ref_usd: precio });
    if (!ok) {
      toast({ title: 'Error al guardar precio', variant: 'destructive' });
      fetchProductos();
    }
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  }

  const allPageSelected = productos.length > 0 && productos.every((p) => selected.has(p.id));

  function toggleSelectAll() {
    if (allPageSelected) setSelected(new Set());
    else setSelected(new Set(productos.map((p) => p.id)));
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Package className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Gestión de Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} productos en `productos_catalogo`
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterMarca} onValueChange={(v) => { setFilterMarca(v); setPage(1); }}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las marcas</SelectItem>
            {MARCAS_CONOCIDAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterCategoria} onValueChange={(v) => { setFilterCategoria(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIAS_ACTIVAS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterDisponible} onValueChange={(v) => { setFilterDisponible(v); setPage(1); }}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>

        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={fetchProductos} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Actualizar'}
        </Button>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l">
            <span className="text-xs text-muted-foreground">{selected.size} seleccionado{selected.size > 1 ? 's' : ''}</span>
            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => bulkToggle(true)}>
              Activar
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkToggle(false)}>
              Desactivar
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b text-xs">
              <th className="px-3 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                  className="rounded"
                  disabled={loading}
                />
              </th>
              <th className="px-3 py-2.5 text-left">
                <button className="flex items-center font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('marca')}>
                  Marca <SortIcon col="marca" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-left">
                <button className="flex items-center font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('categoria')}>
                  Categoría <SortIcon col="categoria" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-left">
                <button className="flex items-center font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('modelo')}>
                  Modelo / Descripción <SortIcon col="modelo" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Slug</th>
              <th className="px-3 py-2.5 text-center">
                <button className="flex items-center font-medium text-muted-foreground hover:text-foreground mx-auto" onClick={() => handleSort('disponible_peru')}>
                  Activo <SortIcon col="disponible_peru" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-right">
                <button className="flex items-center font-medium text-muted-foreground hover:text-foreground ml-auto" onClick={() => handleSort('precio_ref_usd')}>
                  USD <SortIcon col="precio_ref_usd" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-left">
                <button className="flex items-center font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('created_at')}>
                  Creado <SortIcon col="created_at" />
                </button>
              </th>
              <th className="px-3 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td>
              </tr>
            )}
            {!loading && productos.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No hay productos que coincidan con los filtros.
                </td>
              </tr>
            )}
            {!loading && productos.map((p, i) => (
              <tr
                key={p.id}
                className={`border-b last:border-0 ${
                  selected.has(p.id) ? 'bg-primary/5' : i % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                }`}
              >
                {/* Checkbox */}
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="rounded"
                  />
                </td>

                {/* Marca */}
                <td className="px-3 py-2.5 font-medium whitespace-nowrap">{p.marca}</td>

                {/* Categoría */}
                <td className="px-3 py-2.5">
                  {p.categoria && (
                    <Badge variant="outline" className="text-xs font-mono uppercase">
                      {p.categoria}
                    </Badge>
                  )}
                </td>

                {/* Modelo / Descripción */}
                <td className="px-3 py-2.5 max-w-[220px]">
                  <p className="font-medium text-xs truncate" title={p.modelo}>{p.modelo}</p>
                  {p.descripcion && (
                    <p className="text-xs text-muted-foreground truncate" title={p.descripcion}>
                      {p.descripcion.slice(0, 45)}{p.descripcion.length > 45 ? '…' : ''}
                    </p>
                  )}
                </td>

                {/* Slug */}
                <td className="px-3 py-2.5 max-w-[180px]">
                  <span className="text-xs font-mono text-muted-foreground truncate block" title={p.slug}>
                    {p.slug}
                  </span>
                </td>

                {/* Toggle disponible_peru */}
                <td className="px-3 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => toggleDisponible(p)}
                    disabled={busyIds.has(p.id)}
                    className={`inline-flex items-center justify-center w-10 h-5 rounded-full transition-colors ${
                      p.disponible_peru
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    title={p.disponible_peru ? 'Activo — click para desactivar' : 'Inactivo — click para activar'}
                  >
                    {busyIds.has(p.id)
                      ? <Loader2 className="h-2.5 w-2.5 text-white animate-spin" />
                      : <span className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${p.disponible_peru ? 'translate-x-[10px]' : '-translate-x-[6px]'}`} />
                    }
                  </button>
                </td>

                {/* Precio USD — inline editable */}
                <td className="px-3 py-2.5 text-right">
                  {editingPrice?.id === p.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editingPrice.value}
                      onChange={(e) => setEditingPrice({ id: p.id, value: e.target.value })}
                      onBlur={() => savePrice(p.id, editingPrice.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') savePrice(p.id, editingPrice.value);
                        if (e.key === 'Escape') setEditingPrice(null);
                      }}
                      className="h-6 w-20 text-xs text-right px-1.5 ml-auto"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingPrice({ id: p.id, value: p.precio_ref_usd?.toString() ?? '' })}
                      className="text-xs font-mono text-right hover:text-primary transition-colors min-w-[48px] inline-block"
                      title="Click para editar precio"
                    >
                      {p.precio_ref_usd != null ? `$${p.precio_ref_usd.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                    </button>
                  )}
                </td>

                {/* Fecha */}
                <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {formatFecha(p.created_at)}
                </td>

                {/* Ver en catálogo */}
                <td className="px-3 py-2.5">
                  {p.slug && (
                    <a
                      href={`/catalogo/${p.marca.toLowerCase().replace(/\s+/g, '-')}/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      title="Ver en catálogo"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total.toLocaleString()} productos · página {page} de {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Anterior
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Siguiente →
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
