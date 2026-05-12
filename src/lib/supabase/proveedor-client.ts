import { catalogoClient } from './catalogo-client';

export interface Proveedor {
  id: string;
  nombre: string;
  slug: string;
  firebase_uid: string | null;
  ciudad: string | null;
  web: string | null;
  telefono: string | null;
  logo_url: string | null;
  descripcion: string | null;
  region: string | null;
  email: string | null;
}

export interface OfertaConProducto {
  id: string;
  proveedor_id: string;
  producto_id: string;
  precio_pen: number | null;
  precio_minimo_pen: number | null;
  precio_lista_usd: number | null;
  stock: string | null;
  activo: boolean | null;
  codigo_proveedor_origen: string | null;
  marca: string;
  modelo: string;
  descripcion: string;
  categoria: string;
  imagen_url: string | null;
  precio_ref_usd: number | null;
  slug: string | null;
  codigo_fabricante: string | null;
}

export interface OfertaInput {
  proveedor_id: string;
  producto_id: string;
  precio_pen?: number | null;
  precio_minimo_pen?: number | null;
  precio_lista_usd?: number | null;
  stock?: string | null;
  activo?: boolean;
  codigo_proveedor_origen?: string | null;
}

export async function getProveedorByFirebaseUid(uid: string): Promise<Proveedor | null> {
  const { data, error } = await catalogoClient
    .from('proveedores')
    .select('id, nombre, slug, firebase_uid, ciudad, web, telefono, logo_url, descripcion, region, email')
    .eq('firebase_uid', uid)
    .maybeSingle();
  if (error || !data) return null;
  return data as Proveedor;
}

// Dos queries separadas — FK embedding no funciona sin FK registrado en Supabase
export async function getOfertasProveedor(proveedorId: string): Promise<OfertaConProducto[]> {
  const { data: ppRows, error: err1 } = await catalogoClient
    .from('proveedor_producto')
    .select('id, proveedor_id, producto_id, precio_pen, precio_minimo_pen, precio_lista_usd, stock, activo, codigo_proveedor_origen')
    .eq('proveedor_id', proveedorId);
  if (err1 || !ppRows || ppRows.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ids = (ppRows as any[]).map((r: any) => r.producto_id);
  const { data: productos, error: err2 } = await catalogoClient
    .from('productos_catalogo')
    .select('id, marca, modelo, descripcion, categoria, imagen_url, precio_ref_usd, slug, codigo_fabricante')
    .in('id', ids);
  if (err2 || !productos) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prodMap: Record<string, any> = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (productos as any[]).map((p: any) => [p.id, p])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ppRows as any[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => {
      const prod = prodMap[row.producto_id];
      if (!prod) return null;
      return {
        id: row.id,
        proveedor_id: row.proveedor_id,
        producto_id: row.producto_id,
        precio_pen: row.precio_pen ?? null,
        precio_minimo_pen: row.precio_minimo_pen ?? null,
        precio_lista_usd: row.precio_lista_usd ?? null,
        stock: row.stock ?? null,
        activo: row.activo ?? null,
        codigo_proveedor_origen: row.codigo_proveedor_origen ?? null,
        marca: prod.marca ?? '',
        modelo: prod.modelo ?? '',
        descripcion: prod.descripcion ?? '',
        categoria: prod.categoria ?? '',
        imagen_url: prod.imagen_url ?? null,
        precio_ref_usd: prod.precio_ref_usd ?? null,
        slug: prod.slug ?? null,
        codigo_fabricante: prod.codigo_fabricante ?? null,
      } as OfertaConProducto;
    })
    .filter(Boolean) as OfertaConProducto[];
}

// Map<producto_id, precio_pen> para lookups O(1) en el catálogo
export async function getProductosOfrecidosMap(proveedorId: string): Promise<Map<string, number | null>> {
  const { data, error } = await catalogoClient
    .from('proveedor_producto')
    .select('producto_id, precio_pen')
    .eq('proveedor_id', proveedorId);
  if (error || !data) return new Map();
  const map = new Map<string, number | null>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of data as any[]) map.set(r.producto_id, r.precio_pen ?? null);
  return map;
}

export async function insertOferta(data: OfertaInput): Promise<{ ok: boolean; error?: string }> {
  const { error } = await catalogoClient.from('proveedor_producto').insert(data);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateOferta(
  id: string,
  data: Partial<Omit<OfertaInput, 'proveedor_id' | 'producto_id'>>
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await catalogoClient.from('proveedor_producto').update(data).eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteOferta(
  proveedorId: string,
  productoId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await catalogoClient
    .from('proveedor_producto')
    .delete()
    .eq('proveedor_id', proveedorId)
    .eq('producto_id', productoId);
  return error ? { ok: false, error: error.message } : { ok: true };
}
