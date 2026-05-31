import { NextRequest, NextResponse } from 'next/server';
import { getPipelineClient }         from '@/lib/supabase/pipeline-client';
import { verifyAdminToken }          from '@/lib/firebase/admin';
import { normalizarTipoCable }       from '@/lib/pipeline/cable-nomenclature';

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/pipeline/keywords/upload  (stats por tipo_cable) ─────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('Autorización requerida', 401);
  const isAdmin = await verifyAdminToken(authHeader.slice(7));
  if (!isAdmin) return errorResponse('Acceso denegado: se requiere rol admin', 403);

  const { data, error } = await getPipelineClient()
    .from('keyword_stats')
    .select('tipo_cable, uploaded_at')
    .order('uploaded_at', { ascending: false });

  if (error) return errorResponse(error.message, 500);

  // Group by tipo_cable in JS (dataset small, admin use)
  const statsMap: Record<string, { tipo_cable: string; count: number; last_uploaded: string }> = {};
  for (const row of data ?? []) {
    const tc = row.tipo_cable as string;
    if (!statsMap[tc]) {
      statsMap[tc] = { tipo_cable: tc, count: 1, last_uploaded: row.uploaded_at as string };
    } else {
      statsMap[tc].count++;
      if ((row.uploaded_at as string) > statsMap[tc].last_uploaded) {
        statsMap[tc].last_uploaded = row.uploaded_at as string;
      }
    }
  }

  return NextResponse.json({ stats: Object.values(statsMap).sort((a, b) => b.count - a.count) });
}

// ── POST /api/pipeline/keywords/upload ───────────────────────────────────────

function parseAvgSearches(raw: string): number {
  const s = raw.trim().replace(/^"|"$/g, '');
  // Handle range "100 - 1,000" → take lower bound
  const range = s.match(/^([\d,]+)\s*[-–]\s*([\d,]+)$/);
  if (range) return parseInt(range[1].replace(/,/g, ''), 10) || 0;
  return parseInt(s.replace(/,/g, ''), 10) || 0;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('Autorización requerida', 401);
  const isAdmin = await verifyAdminToken(authHeader.slice(7));
  if (!isAdmin) return errorResponse('Acceso denegado: se requiere rol admin', 403);

  let body: { csv_text?: string; tipo_cable?: string };
  try {
    body = await request.json() as { csv_text?: string; tipo_cable?: string };
  } catch {
    return errorResponse('Body JSON inválido', 400);
  }

  const { csv_text, tipo_cable } = body;
  if (!csv_text?.trim()) return errorResponse('csv_text requerido', 400);
  if (!tipo_cable?.trim()) return errorResponse('tipo_cable requerido', 400);

  // Normalize tipo_cable to CABLE_NOMENCLATURE key
  const tipoCableNorm = normalizarTipoCable(tipo_cable.trim()) ?? tipo_cable.trim().toUpperCase();

  // Skip first 3 header rows; split on newlines
  const lines = csv_text.split(/\r?\n/).slice(3);
  const rows: {
    keyword: string; tipo_cable: string;
    avg_monthly_searches: number;
    competition: string | null; change_3m: string | null; change_yoy: string | null;
  }[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = line.split('\t');
    if (cols.length < 3) continue;

    const keyword = cols[0]?.trim().replace(/^"|"$/g, '').toLowerCase();
    if (!keyword) continue;

    const avgRaw = cols[2]?.trim().replace(/^"|"$/g, '') ?? '';
    const avg = parseAvgSearches(avgRaw);
    if (isNaN(avg)) { errors.push(`Fila ${i + 4}: valor inválido "${avgRaw}"`); continue; }

    rows.push({
      keyword,
      tipo_cable:            tipoCableNorm,
      avg_monthly_searches:  avg,
      competition:           cols[5]?.trim().replace(/^"|"$/g, '') || null,
      change_3m:             cols[3]?.trim().replace(/^"|"$/g, '') || null,
      change_yoy:            cols[4]?.trim().replace(/^"|"$/g, '') || null,
    });
  }

  if (rows.length === 0) return errorResponse('No se encontraron filas válidas en el CSV', 400);

  const { data: upserted, error: dbError } = await getPipelineClient()
    .from('keyword_stats')
    .upsert(rows, { onConflict: 'keyword,tipo_cable' })
    .select('id');

  if (dbError) return errorResponse(`Error al guardar: ${dbError.message}`, 500);

  return NextResponse.json({ inserted: upserted?.length ?? rows.length, updated: 0, errors });
}
