import { NextRequest, NextResponse }  from 'next/server';
import { getPipelineClient }          from '@/lib/supabase/pipeline-client';
import { verifyAdminToken }           from '@/lib/firebase/admin';

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/pipeline/candidates/[id] ────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('Autorización requerida', 401);
  const isAdmin = await verifyAdminToken(authHeader.slice(7));
  if (!isAdmin) return errorResponse('Acceso denegado: se requiere rol admin', 403);

  const { id } = await params;

  const { data, error } = await getPipelineClient()
    .from('pipeline_candidatos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return errorResponse(error?.message ?? 'Candidato no encontrado', error ? 500 : 404);
  }

  return NextResponse.json({ candidato: data });
}

// ── PATCH /api/pipeline/candidates/[id] ──────────────────────────────────────
// Auto-save del editor: actualiza edited_json y/o notas.

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('Autorización requerida', 401);
  const isAdmin = await verifyAdminToken(authHeader.slice(7));
  if (!isAdmin) return errorResponse('Acceso denegado: se requiere rol admin', 403);

  const { id } = await params;

  let body: { edited_json?: unknown; notas?: string | null };
  try {
    body = await request.json() as { edited_json?: unknown; notas?: string | null };
  } catch {
    return errorResponse('Body JSON inválido', 400);
  }

  const patch: Record<string, unknown> = {};
  if ('edited_json' in body) patch.edited_json = body.edited_json;
  if ('notas'       in body) patch.notas       = body.notas;

  if (Object.keys(patch).length === 0) {
    return errorResponse('Nada que actualizar', 400);
  }

  const { error } = await getPipelineClient()
    .from('pipeline_candidatos')
    .update(patch)
    .eq('id', id);

  if (error) return errorResponse(`Error al guardar: ${error.message}`, 500);

  return NextResponse.json({ saved: true });
}
