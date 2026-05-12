'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import {
  getProveedorByFirebaseUid,
  getOfertasProveedor,
  updateOferta,
  deleteOferta,
  type Proveedor,
  type OfertaConProducto,
} from '@/lib/supabase/proveedor-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Package,
  Loader2,
  Trash2,
  ShieldX,
  Building2,
  CheckCircle,
  ShoppingBag,
  DollarSign,
} from 'lucide-react';

const STOCK_OPTIONS = ['En stock', 'A pedido', 'Agotado'];

const normalizar = (texto: string) =>
  texto.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

function filtrarOfertas(ofertas: OfertaConProducto[], query: string): OfertaConProducto[] {
  if (!query || query.trim().length < 2) return ofertas;
  const tokens = normalizar(query).split(/\s+/).filter(Boolean);
  return ofertas.filter((o) => {
    const haystack = normalizar(
      `${o.modelo} ${o.descripcion} ${o.categoria} ${o.codigo_fabricante ?? ''} ${o.marca}`
    );
    return tokens.every((t) => haystack.includes(t));
  });
}

function getStockBadgeClass(stock: string | null) {
  if (stock === 'En stock') return 'bg-green-100 text-green-700';
  if (stock === 'Agotado') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'amber';
}) {
  const colorMap = { green: 'text-green-600', blue: 'text-blue-600', amber: 'text-amber-600' };
  const textColor = color ? colorMap[color] : 'text-foreground';
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{title}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

interface RowProps {
  oferta: OfertaConProducto;
  editingField: { id: string; field: string } | null;
  editValue: string;
  onStartEdit: (id: string, field: string, val: string) => void;
  onSave: (oferta: OfertaConProducto, field: string, value: string) => void;
  onCancel: () => void;
  onEditValueChange: (val: string) => void;
  onToggleActivo: (oferta: OfertaConProducto) => void;
  onDelete: (oferta: OfertaConProducto) => void;
}

function OfertaRow({
  oferta,
  editingField,
  editValue,
  onStartEdit,
  onSave,
  onCancel,
  onEditValueChange,
  onToggleActivo,
  onDelete,
}: RowProps) {
  const isEditing = (field: string) =>
    editingField?.id === oferta.id && editingField.field === field;

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') onSave(oferta, field, editValue);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <tr className="border-b hover:bg-muted/20 group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {oferta.imagen_url ? (
            <img
              src={oferta.imagen_url}
              alt={oferta.modelo}
              className="w-8 h-8 object-contain rounded bg-gray-50 flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-muted flex-shrink-0" />
          )}
          <div>
            <div className="text-sm font-medium leading-snug line-clamp-1">{oferta.descripcion}</div>
            <div className="text-xs text-muted-foreground">
              {oferta.marca} · {oferta.categoria}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-right">
        {isEditing('precio_pen') ? (
          <Input
            autoFocus
            type="number"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onBlur={() => onSave(oferta, 'precio_pen', editValue)}
            onKeyDown={(e) => handleKeyDown(e, 'precio_pen')}
            className="h-7 text-xs text-right w-24 ml-auto"
          />
        ) : (
          <button
            onClick={() =>
              onStartEdit(
                oferta.id,
                'precio_pen',
                oferta.precio_pen != null ? String(oferta.precio_pen) : ''
              )
            }
            className="text-xs hover:underline hover:text-primary transition-colors"
          >
            {oferta.precio_pen != null ? (
              `S/ ${oferta.precio_pen.toFixed(2)}`
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </button>
        )}
      </td>

      <td className="px-4 py-3 text-right">
        {isEditing('precio_minimo_pen') ? (
          <Input
            autoFocus
            type="number"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onBlur={() => onSave(oferta, 'precio_minimo_pen', editValue)}
            onKeyDown={(e) => handleKeyDown(e, 'precio_minimo_pen')}
            className="h-7 text-xs text-right w-24 ml-auto"
          />
        ) : (
          <button
            onClick={() =>
              onStartEdit(
                oferta.id,
                'precio_minimo_pen',
                oferta.precio_minimo_pen != null ? String(oferta.precio_minimo_pen) : ''
              )
            }
            className="text-xs hover:underline hover:text-primary transition-colors"
          >
            {oferta.precio_minimo_pen != null ? (
              `S/ ${oferta.precio_minimo_pen.toFixed(2)}`
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </button>
        )}
      </td>

      <td className="px-4 py-3 text-center">
        {isEditing('stock') ? (
          <Select
            value={editValue}
            onValueChange={(val) => onSave(oferta, 'stock', val)}
          >
            <SelectTrigger className="h-7 text-xs w-28 mx-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STOCK_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <button
            onClick={() =>
              onStartEdit(oferta.id, 'stock', oferta.stock ?? 'A pedido')
            }
          >
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${getStockBadgeClass(oferta.stock)}`}
            >
              {oferta.stock ?? 'A pedido'}
            </span>
          </button>
        )}
      </td>

      <td className="px-4 py-3 text-center">
        <button onClick={() => onToggleActivo(oferta)}>
          {oferta.activo ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Activo
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              Inactivo
            </span>
          )}
        </button>
      </td>

      <td className="px-2 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(oferta)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function OfertaMobileCard({
  oferta,
  editingField,
  editValue,
  onStartEdit,
  onSave,
  onCancel,
  onEditValueChange,
  onToggleActivo,
  onDelete,
}: RowProps) {
  const isEditing = (field: string) =>
    editingField?.id === oferta.id && editingField.field === field;

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') onSave(oferta, field, editValue);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {oferta.imagen_url ? (
            <img
              src={oferta.imagen_url}
              alt={oferta.modelo}
              className="w-12 h-12 object-contain rounded bg-gray-50 flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-muted flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-2 leading-snug">{oferta.descripcion}</p>
            <p className="text-xs text-muted-foreground">
              {oferta.marca} · {oferta.categoria}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isEditing('precio_pen') ? (
            <Input
              autoFocus
              type="number"
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onBlur={() => onSave(oferta, 'precio_pen', editValue)}
              onKeyDown={(e) => handleKeyDown(e, 'precio_pen')}
              className="h-7 text-xs w-28"
            />
          ) : (
            <button
              onClick={() =>
                onStartEdit(
                  oferta.id,
                  'precio_pen',
                  oferta.precio_pen != null ? String(oferta.precio_pen) : ''
                )
              }
              className="text-sm font-semibold hover:underline hover:text-primary"
            >
              {oferta.precio_pen != null ? (
                `S/ ${oferta.precio_pen.toFixed(2)}`
              ) : (
                <span className="text-muted-foreground text-xs">Sin precio</span>
              )}
            </button>
          )}

          {isEditing('stock') ? (
            <Select
              value={editValue}
              onValueChange={(val) => onSave(oferta, 'stock', val)}
            >
              <SelectTrigger className="h-7 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STOCK_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <button
              onClick={() =>
                onStartEdit(oferta.id, 'stock', oferta.stock ?? 'A pedido')
              }
            >
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${getStockBadgeClass(oferta.stock)}`}
              >
                {oferta.stock ?? 'A pedido'}
              </span>
            </button>
          )}

          <button onClick={() => onToggleActivo(oferta)}>
            {oferta.activo ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                Activo
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Inactivo
              </span>
            )}
          </button>

          <button
            onClick={() => onDelete(oferta)}
            className="ml-auto text-destructive hover:text-destructive/80 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ProveedorDashboard() {
  const { user } = useAuth();
  const { canOfferProducts } = useRolePermissions();
  const { toast } = useToast();

  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [ofertas, setOfertas] = useState<OfertaConProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<OfertaConProducto | null>(null);
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!user?.uid || !canOfferProducts) { setLoading(false); return; }
    (async () => {
      const prov = await getProveedorByFirebaseUid(user.uid);
      if (!prov) { setLoading(false); return; }
      setProveedor(prov);
      const rows = await getOfertasProveedor(prov.id);
      setOfertas(rows);
      setLoading(false);
    })();
  }, [user?.uid, canOfferProducts]);

  const filteredOfertas = filtrarOfertas(ofertas, search);

  const metrics = {
    total: ofertas.length,
    activos: ofertas.filter((o) => o.activo).length,
    conStock: ofertas.filter((o) => o.stock === 'En stock').length,
    sinPrecio: ofertas.filter((o) => o.precio_pen == null).length,
  };

  const saveField = async (oferta: OfertaConProducto, field: string, value: string) => {
    const numFields = ['precio_pen', 'precio_minimo_pen', 'precio_lista_usd'];
    const parsed = numFields.includes(field)
      ? value === '' ? null : parseFloat(value)
      : value;

    setOfertas((prev) =>
      prev.map((o) => (o.id === oferta.id ? { ...o, [field]: parsed } : o))
    );
    const { ok, error } = await updateOferta(oferta.id, { [field]: parsed });
    if (!ok) {
      setOfertas((prev) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prev.map((o) => (o.id === oferta.id ? { ...o, [field]: (oferta as any)[field] } : o))
      );
      toast({ title: 'Error al guardar', description: error, variant: 'destructive' });
    }
    setEditingField(null);
  };

  const toggleActivo = async (oferta: OfertaConProducto) => {
    const newActivo = !oferta.activo;
    setOfertas((prev) =>
      prev.map((o) => (o.id === oferta.id ? { ...o, activo: newActivo } : o))
    );
    const { ok, error } = await updateOferta(oferta.id, { activo: newActivo });
    if (!ok) {
      setOfertas((prev) =>
        prev.map((o) => (o.id === oferta.id ? { ...o, activo: oferta.activo } : o))
      );
      toast({ title: 'Error', description: error, variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !proveedor) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setOfertas((prev) => prev.filter((o) => o.id !== target.id));
    const { ok, error } = await deleteOferta(proveedor.id, target.producto_id);
    if (!ok) {
      setOfertas((prev) => [...prev, target]);
      toast({ title: 'Error al eliminar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Producto eliminado', description: `${target.descripcion} removido de tu catálogo.` });
    }
  };

  // Guards
  if (!canOfferProducts) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShieldX className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold mb-2">Acceso restringido</h1>
        <p className="text-muted-foreground">Esta área es exclusiva para proveedores verificados.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold mb-2">Sin perfil de proveedor</h1>
        <p className="text-muted-foreground mb-4">
          Tu cuenta no tiene un proveedor asociado. Contacta al administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{proveedor.nombre}</h1>
          <p className="text-muted-foreground mt-1">
            {proveedor.ciudad && <span>{proveedor.ciudad} · </span>}
            Portal de proveedor
          </p>
        </div>
        <Button asChild>
          <Link href="/proveedor/agregar">
            <Plus className="h-4 w-4 mr-2" />
            Agregar producto
          </Link>
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total productos"
          value={metrics.total}
          icon={<Package className="h-4 w-4" />}
        />
        <MetricCard
          title="Activos"
          value={metrics.activos}
          icon={<CheckCircle className="h-4 w-4" />}
          color="green"
        />
        <MetricCard
          title="En stock"
          value={metrics.conStock}
          icon={<ShoppingBag className="h-4 w-4" />}
          color="blue"
        />
        <MetricCard
          title="Sin precio"
          value={metrics.sinPrecio}
          icon={<DollarSign className="h-4 w-4" />}
          color={metrics.sinPrecio > 0 ? 'amber' : undefined}
        />
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar mis productos..."
          className="pl-9"
        />
      </div>

      {/* Vacío */}
      {filteredOfertas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-25" />
          <p>{search ? 'Sin resultados.' : 'Aún no tienes productos en tu catálogo.'}</p>
          {!search && (
            <Button asChild className="mt-4">
              <Link href="/proveedor/agregar">
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer producto
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Tabla — escritorio */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Producto
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground w-36">
                    Precio PEN
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground w-32">
                    Precio mín.
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground w-32">
                    Stock
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground w-24">
                    Estado
                  </th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {filteredOfertas.map((oferta) => (
                  <OfertaRow
                    key={oferta.id}
                    oferta={oferta}
                    editingField={editingField}
                    editValue={editValue}
                    onStartEdit={(id, field, val) => {
                      setEditingField({ id, field });
                      setEditValue(val);
                    }}
                    onSave={saveField}
                    onCancel={() => setEditingField(null)}
                    onEditValueChange={setEditValue}
                    onToggleActivo={toggleActivo}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — móvil */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredOfertas.map((oferta) => (
              <OfertaMobileCard
                key={oferta.id}
                oferta={oferta}
                editingField={editingField}
                editValue={editValue}
                onStartEdit={(id, field, val) => {
                  setEditingField({ id, field });
                  setEditValue(val);
                }}
                onSave={saveField}
                onCancel={() => setEditingField(null)}
                onEditValueChange={setEditValue}
                onToggleActivo={toggleActivo}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </>
      )}

      {/* Confirmación de eliminación */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará{' '}
              <span className="font-medium">{deleteTarget?.descripcion}</span>{' '}
              de tu catálogo. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
