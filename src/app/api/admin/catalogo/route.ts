import { NextRequest, NextResponse } from 'next/server';
import { getPipelineClient }         from '@/lib/supabase/pipeline-client';
import { verifyAdminToken }          from '@/lib/firebase/admin';

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const SORT_WHITELIST = new Set([
  'created_at', 'marca', 'categoria', 'modelo',
  'disponible_peru', 'precio_ref_usd',
]);

const PRODUCTO_SELECT =
  'id, marca, modelo, descripcion, categoria, slug, disponible_peru, precio_ref_usd, created_at';

// ── GET /api/admin/catalogo ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('Autorización requerida', 401);
  const isAdmin = await verifyAdminToken(authHeader.slice(7));
  if (!isAdmin) return errorResponse('Acceso denegado', 403);

  const { searchParams } = request.nextUrl;
  const marca      = searchParams.get('marca')      ?? '';
  const categoria  = searchParams.get('categoria')  ?? '';
  const disponible = searchParams.get('disponible') ?? 'all';
  const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage    = 50;
  const orderCol   = SORT_WHITELIST.has(searchParams.get('order') ?? '')
    ? (searchParams.get('order') as string)
    : 'created_at';
  const ascending  = searchParams.get('dir') === 'asc';

  // Distinct brands for the filter dropdown
  if (searchParams.get('action') === 'brands') {
    const { data } = await getPipelineClient()
      .from('productos_catalogo')
      .select('marca')
      .order('marca');
    const brands = [...new Set((data ?? []).map((r: { marca: string }) => r.marca).filter(Boolean))];
    return NextResponse.json({ brands });
  }

  // Count total matching rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let countQ: any = getPipelineClient()
    .from('productos_catalogo')
    .select('id', { count: 'exact', head: true });
  if (marca)                         countQ = countQ.eq('marca', marca);
  if (categoria)                     countQ = countQ.eq('categoria', categoria);
  if (disponible === 'true')         countQ = countQ.eq('disponible_peru', true);
  else if (disponible === 'false')   countQ = countQ.eq('disponible_peru', false);

  const { count: total } = await countQ;

  // Fetch page
  const from = (page - 1) * perPage;
  const to   = from + perPage - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = getPipelineClient()
    .from('productos_catalogo')
    .select(PRODUCTO_SELECT)
    .order(orderCol, { ascending })
    .range(from, to);
  if (marca)                         q = q.eq('marca', marca);
  if (categoria)                     q = q.eq('categoria', categoria);
  if (disponible === 'true')         q = q.eq('disponible_peru', true);
  else if (disponible === 'false')   q = q.eq('disponible_peru', false);

  const { data, error } = await q;
  if (error) return errorResponse(error.message, 500);

  return NextResponse.json({
    productos: data ?? [],
    total:     total ?? 0,
    page,
    pages:     Math.ceil((total ?? 0) / perPage),
  });
}

// ── PATCH /api/admin/catalogo — single price or batch disponible ──────────────

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('Autorización requerida', 401);
  const isAdmin = await verifyAdminToken(authHeader.slice(7));
  if (!isAdmin) return errorResponse('Acceso denegado', 403);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try { body = await request.json(); } catch { return errorResponse('Body inválido', 400); }

  // Batch: { ids: string[], disponible_peru: boolean }
  if (Array.isArray(body.ids)) {
    if (!body.ids.length) return NextResponse.json({ updated: 0 });
    const { error, count } = await getPipelineClient()
      .from('productos_catalogo')
      .update({ disponible_peru: !!body.disponible_peru })
      .in('id', body.ids);
    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ updated: count ?? body.ids.length });
  }

  // Single: { id: string, precio_ref_usd: number | null }
  if (body.id && 'precio_ref_usd' in body) {
    const precio = body.precio_ref_usd != null ? Number(body.precio_ref_usd) : null;
    const { error } = await getPipelineClient()
      .from('productos_catalogo')
      .update({ precio_ref_usd: precio })
      .eq('id', body.id);
    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ updated: 1 });
  }

  // Single: { id: string, disponible_peru: boolean }
  if (body.id && 'disponible_peru' in body) {
    const { error } = await getPipelineClient()
      .from('productos_catalogo')
      .update({ disponible_peru: !!body.disponible_peru })
      .eq('id', body.id);
    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ updated: 1 });
  }

  return errorResponse('Payload inválido', 400);
}
