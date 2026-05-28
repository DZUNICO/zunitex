import { NextRequest, NextResponse } from 'next/server';
import { getPipelineClient }         from '@/lib/supabase/pipeline-client';
import { getVerifiedAdmin }          from '@/lib/firebase/admin';

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/pipeline/reject ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('Autorización requerida', 401);
  const admin = await getVerifiedAdmin(authHeader.slice(7));
  if (!admin) return errorResponse('Acceso denegado: se requiere rol admin', 403);

  let body: { candidato_id?: string; notas?: string };
  try {
    body = await request.json() as { candidato_id?: string; notas?: string };
  } catch {
    return errorResponse('Body JSON inválido', 400);
  }

  if (!body.candidato_id) return errorResponse('candidato_id requerido', 400);

  const patch: Record<string, unknown> = {
    status:      'rejected',
    reviewed_by: admin.uid,
    reviewed_at: new Date().toISOString(),
  };
  if (body.notas !== undefined) patch.notas = body.notas;

  const { error } = await getPipelineClient()
    .from('pipeline_candidatos')
    .update(patch)
    .eq('id', body.candidato_id)
    .eq('status', 'pending');   // solo se puede rechazar si está pendiente

  if (error) return errorResponse(`Error al rechazar: ${error.message}`, 500);

  return NextResponse.json({ rejected: true });
}
