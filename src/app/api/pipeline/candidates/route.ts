import { NextRequest, NextResponse } from 'next/server';
import { getPipelineClient }         from '@/lib/supabase/pipeline-client';
import { verifyAdminToken }          from '@/lib/firebase/admin';
import type { ExtraccionResult }     from '@/lib/pipeline/types';

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/pipeline/candidates ─────────────────────────────────────────────

export async function GET(request: NextRequest) {

  // ── 1. Autenticación: solo admins ────────────────────────────────────────
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Autorización requerida', 401);
  }
  const token = authHeader.slice(7);
  const isAdmin = await verifyAdminToken(token);
  if (!isAdmin) {
    return errorResponse('Acceso denegado: se requiere rol admin', 403);
  }

  // ── 2. Consultar pipeline_candidatos ────────────────────────────────────
  const { data, error } = await getPipelineClient()
    .from('pipeline_candidatos')
    .select('id, created_at, pdf_filename, fabricante, tipo_cable, status, confidence_score, notas, raw_json')
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse(`Error al consultar candidatos: ${error.message}`, 500);
  }

  // ── 3. Proyectar — calcular variantes_count sin enviar raw_json completo ─
  const candidatos = (data ?? []).map((row) => ({
    id:               row.id,
    created_at:       row.created_at,
    pdf_filename:     row.pdf_filename,
    fabricante:       row.fabricante,
    tipo_cable:       row.tipo_cable,
    status:           row.status,
    confidence_score: row.confidence_score,
    notas:            row.notas,
    variantes_count:  (row.raw_json as ExtraccionResult | null)?.VARIANTES?.length ?? 0,
  }));

  return NextResponse.json({ candidatos });
}
