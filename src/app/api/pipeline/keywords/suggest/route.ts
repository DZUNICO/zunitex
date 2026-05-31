import { NextRequest, NextResponse } from 'next/server';
import { getPipelineClient }         from '@/lib/supabase/pipeline-client';
import { verifyAdminToken }          from '@/lib/firebase/admin';
import { normalizarTipoCable, CABLE_NOMENCLATURE } from '@/lib/pipeline/cable-nomenclature';

// ── Exported types ────────────────────────────────────────────────────────────

export interface SuggestionItem {
  keyword:              string;
  avg_monthly_searches: number;
  competition:          string | null;
  change_3m:            string | null;
  change_yoy:           string | null;
  priority:             'alta' | 'media' | 'baja';
  tipo:                 'core' | 'variante';
  relevancia:           'directa' | 'generica';
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

function priorityTier(avg: number): 'alta' | 'media' | 'baja' {
  if (avg >= 500) return 'alta';
  if (avg >= 100) return 'media';
  return 'baja';
}

function parseYoy(raw: string | null): number | null {
  if (!raw) return null;
  const m = raw.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

// Build inclusive (propios) and exclusive (excluidos) term sets from the dictionary.
// propios  — terms that belong to tipoCable: aliases + tipo_mercado_peru + tipo_tecnico_ntp
// excluidos — terms belonging to ALL OTHER types: aliases + tipo_mercado_peru
function buildTerminos(tipoCable: string): { propios: string[]; excluidos: string[] } {
  const propios:   string[] = [];
  const excluidos: string[] = [];

  for (const [key, def] of Object.entries(CABLE_NOMENCLATURE)) {
    const aliases = def.aliases_busqueda_peru.map((a) => a.toLowerCase());
    const mercado = def.tipo_mercado_peru.toLowerCase();
    const tecnico = def.tipo_tecnico_ntp?.toLowerCase();

    if (key === tipoCable) {
      propios.push(...aliases, mercado);
      if (tecnico) propios.push(tecnico);
    } else {
      excluidos.push(...aliases, mercado);
    }
  }

  // Deduplicate and sort longest-first so longer terms match before their sub-terms
  const dedup = (arr: string[]) =>
    [...new Set(arr.filter(Boolean))].sort((a, b) => b.length - a.length);

  return { propios: dedup(propios), excluidos: dedup(excluidos) };
}

// Classify a keyword's relevance to the requested cable type.
// Returns { relevant: false } for keywords that clearly belong to another type.
function getRelevancia(
  keyword: string,
  propios: string[],
  excluidos: string[],
): { relevant: boolean; relevancia: 'directa' | 'generica' } {
  const kw = keyword.toLowerCase();

  // Direct hit — keyword contains a term specific to this cable type
  for (const t of propios) {
    if (kw.includes(t)) return { relevant: true, relevancia: 'directa' };
  }

  // Exclusion — keyword contains a term belonging to another cable type
  for (const t of excluidos) {
    if (kw.includes(t)) return { relevant: false, relevancia: 'generica' };
  }

  // Generic — brand/price keyword with no type-specific term; valid for any type
  return { relevant: true, relevancia: 'generica' };
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
  const rawTipo      = searchParams.get('tipo_cable');
  const existingRaw  = searchParams.get('existing_aliases') ?? '';

  if (!rawTipo) {
    return NextResponse.json({ error: 'tipo_cable requerido' }, { status: 400 });
  }

  const tipo_cable = normalizarTipoCable(rawTipo) ?? rawTipo.toUpperCase();

  const existingSet = new Set(
    existingRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  );

  // Count total for this type
  const { count: totalCount } = await getPipelineClient()
    .from('keyword_stats')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_cable', tipo_cable);

  if ((totalCount ?? 0) === 0) {
    return NextResponse.json({ core: [], variante: [], total_keywords_db: 0 } satisfies SuggestKeywordsResponse);
  }

  // Fetch rows above minimum volume threshold
  const { data, error } = await getPipelineClient()
    .from('keyword_stats')
    .select('keyword, avg_monthly_searches, competition, change_3m, change_yoy')
    .eq('tipo_cable', tipo_cable)
    .gte('avg_monthly_searches', 50)
    .order('avg_monthly_searches', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build relevance term sets from the cable dictionary
  const { propios, excluidos } = buildTerminos(tipo_cable);

  const items: SuggestionItem[] = (data ?? [])
    .filter((row) => {
      // Drop already-accepted aliases
      if (existingSet.has((row.keyword as string).toLowerCase())) return false;
      // Drop keywords in strong year-over-year decline
      const yoy = parseYoy(row.change_yoy as string | null);
      if (yoy !== null && yoy <= -50) return false;
      return true;
    })
    .flatMap((row) => {
      const keyword = row.keyword as string;
      const { relevant, relevancia } = getRelevancia(keyword, propios, excluidos);
      if (!relevant) return [];
      return [{
        keyword,
        avg_monthly_searches: row.avg_monthly_searches as number,
        competition:          row.competition as string | null,
        change_3m:            row.change_3m as string | null,
        change_yoy:           row.change_yoy as string | null,
        priority:             priorityTier(row.avg_monthly_searches as number),
        tipo:                 classify(keyword),
        relevancia,
      }];
    })
    .sort((a, b) => {
      // directa before generica, then alta before media before baja, then volume desc
      if (a.relevancia !== b.relevancia) return a.relevancia === 'directa' ? -1 : 1;
      const order = { alta: 0, media: 1, baja: 2 };
      const po    = order[a.priority] - order[b.priority];
      return po !== 0 ? po : b.avg_monthly_searches - a.avg_monthly_searches;
    });

  return NextResponse.json({
    core:              items.filter((s) => s.tipo === 'core'),
    variante:          items.filter((s) => s.tipo === 'variante'),
    total_keywords_db: totalCount ?? 0,
  } satisfies SuggestKeywordsResponse);
}
