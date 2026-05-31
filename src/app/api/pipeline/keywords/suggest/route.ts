import { NextRequest, NextResponse } from 'next/server';
import { getPipelineClient }         from '@/lib/supabase/pipeline-client';
import { verifyAdminToken }          from '@/lib/firebase/admin';
import { normalizarTipoCable }       from '@/lib/pipeline/cable-nomenclature';

// ── Exported types (imported by the review page) ──────────────────────────────

export interface SuggestionItem {
  keyword:              string;
  avg_monthly_searches: number;
  competition:          string | null;
  change_3m:            string | null;
  change_yoy:           string | null;
  priority:             'alta' | 'media' | 'baja';
  tipo:                 'core' | 'variante';
}

export interface SuggestKeywordsResponse {
  core:               SuggestionItem[];
  variante:           SuggestionItem[];
  total_keywords_db:  number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Calibre patterns: numbers like 14, 12, 10, 8, fractions (2/0), sizes (4mm, mm2) etc.
const CALIBRE_RE = /\b(1[024]|[268]|2\.5|1\.5|4\s?mm|6\s?mm|10\s?mm|awg|mm2|mm²|\d+x\d+|\d+\/\d+)\b/i;

function classify(keyword: string): 'core' | 'variante' {
  return CALIBRE_RE.test(keyword) ? 'variante' : 'core';
}

function priority(avg: number): 'alta' | 'media' | 'baja' {
  if (avg >= 500) return 'alta';
  if (avg >= 100) return 'media';
  return 'baja';
}

function parseYoy(raw: string | null): number | null {
  if (!raw) return null;
  const m = raw.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

// ── GET /api/pipeline/keywords/suggest ───────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Autorización requerida' }, { status: 401 });
  }
  const isAdmin = await verifyAdminToken(authHeader.slice(7));
  if (!isAdmin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const rawTipo    = searchParams.get('tipo_cable');
  const existingRaw = searchParams.get('existing_aliases') ?? '';

  if (!rawTipo) {
    return NextResponse.json({ error: 'tipo_cable requerido' }, { status: 400 });
  }

  // Normalize to CABLE_NOMENCLATURE key for consistent lookup
  const tipo_cable = normalizarTipoCable(rawTipo) ?? rawTipo.toUpperCase();

  const existingSet = new Set(
    existingRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  );

  // Count total for this type (for "no keywords loaded" message)
  const { count: totalCount } = await getPipelineClient()
    .from('keyword_stats')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_cable', tipo_cable);

  if ((totalCount ?? 0) === 0) {
    return NextResponse.json({ core: [], variante: [], total_keywords_db: 0 } satisfies SuggestKeywordsResponse);
  }

  // Fetch filtered rows
  const { data, error } = await getPipelineClient()
    .from('keyword_stats')
    .select('keyword, avg_monthly_searches, competition, change_3m, change_yoy')
    .eq('tipo_cable', tipo_cable)
    .gte('avg_monthly_searches', 50)
    .order('avg_monthly_searches', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items: SuggestionItem[] = (data ?? [])
    .filter((row) => {
      if (existingSet.has((row.keyword as string).toLowerCase())) return false;
      const yoy = parseYoy(row.change_yoy as string | null);
      if (yoy !== null && yoy <= -50) return false;
      return true;
    })
    .map((row) => ({
      keyword:              row.keyword as string,
      avg_monthly_searches: row.avg_monthly_searches as number,
      competition:          row.competition as string | null,
      change_3m:            row.change_3m as string | null,
      change_yoy:           row.change_yoy as string | null,
      priority:             priority(row.avg_monthly_searches as number),
      tipo:                 classify(row.keyword as string),
    }))
    .sort((a, b) => {
      const order = { alta: 0, media: 1, baja: 2 };
      const po = order[a.priority] - order[b.priority];
      return po !== 0 ? po : b.avg_monthly_searches - a.avg_monthly_searches;
    });

  return NextResponse.json({
    core:              items.filter((s) => s.tipo === 'core'),
    variante:          items.filter((s) => s.tipo === 'variante'),
    total_keywords_db: totalCount ?? 0,
  } satisfies SuggestKeywordsResponse);
}
