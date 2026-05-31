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
  score:                number;
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

function parseChange(raw: string | null): number | null {
  if (!raw) return null;
  const m = raw.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

// Composite score (0–120+ pts): volume 50% · competition 25% · trend 25% · relevancia bonus
function computeScore(
  avg: number,
  competition: string | null,
  change_yoy: string | null,
  change_3m: string | null,
  relevancia: 'directa' | 'generica',
): number {
  const volPts  = avg >= 5000 ? 50 : avg >= 1000 ? 40 : avg >= 500 ? 30 : avg >= 100 ? 20 : 10;
  const compPts = competition === 'Baja' ? 25 : competition === 'Media' ? 15 : competition === 'Alta' ? 5 : 10;

  const yoy = parseChange(change_yoy);
  let trendPts = yoy === null ? 15 : yoy >= 0 ? 25 : yoy >= -30 ? 15 : yoy >= -60 ? 5 : 0;
  const m3 = parseChange(change_3m);
  if (m3 !== null) {
    if (m3 > 0)    trendPts += 5;
    if (m3 <= -50) trendPts -= 5;
  }

  return volPts + compPts + trendPts + (relevancia === 'directa' ? 20 : 0);
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

// Brand/price terms that are universally relevant — skip all type-specific checks
const GENERIC_BRAND_TERMS = new Set([
  'cable indeco', 'cables indeco precios', 'indeco by nexans',
  'indeco nexans', 'precio cable indeco', 'precio de cable indeco',
  'sodimac cable indeco', 'promart cable indeco', 'maestro cable indeco',
  'cables electricos indeco precios', 'cables electricos indeco',
  'cables eléctricos indeco', 'indeco cables precios',
  'indeco precios de cables', 'precio de cables electricos indeco',
  'ficha tecnica de cables indeco', 'cables indeco ficha tecnica',
  'amperaje de cables indeco', 'amperaje de cables electricos indeco',
  'tipos de cable indeco', 'tipos de cables indeco',
  'tipos de cable electrico indeco', 'awg a mm2 indeco',
  'cables indeco amperaje', 'indeco cable',
]);

// Cable-type nouns not yet in CABLE_NOMENCLATURE — block them as foreign-type noise
// Sorted longest-first so multi-word phrases match before their sub-terms
const GENERIC_BLOCKERS = [
  'libre de halogeno', 'puesta a tierra', 'autosoportado',
  'autoportante', 'concentrico', 'soldadura', 'automotriz',
  'aluminio', 'desnudo', 'control', 'flexible', 'soldar',
  'tierra', 'lsohx', 'n2xsy', 'n2xh', 'n2xy', 'halogeno',
  'lsoh', 'ttrf', 'caai', 'seco', 'rvk', 'nyy', 'nmt',
  'npt', 'cpt', 'cpi', 'nlt', 'sgt', 'gpt', 'ws',
  '4mm2',
];

// Classify a keyword's relevance to the requested cable type.
// Returns { relevant: false } for keywords that clearly belong to another type.
function getRelevancia(
  keyword: string,
  propios: string[],
  excluidos: string[],
): { relevant: boolean; relevancia: 'directa' | 'generica' } {
  const kw = keyword.toLowerCase();

  // Step 0: Known brand/price term — universally relevant, skip all type checks
  if (GENERIC_BRAND_TERMS.has(kw)) return { relevant: true, relevancia: 'generica' };

  // Step 1: Contains a term belonging to another cable type — exclude
  for (const t of excluidos) {
    if (kw.includes(t)) return { relevant: false, relevancia: 'generica' };
  }

  // Step 2: Contains a term specific to this cable type — direct hit
  for (const t of propios) {
    if (kw.includes(t)) return { relevant: true, relevancia: 'directa' };
  }

  // Step 3: Contains a cable-type noun not in the dictionary — exclude as noise
  for (const t of GENERIC_BLOCKERS) {
    if (kw.includes(t)) return { relevant: false, relevancia: 'generica' };
  }

  // Default: generic brand/price/utility keyword valid for any type
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
  const maxCore      = Math.max(1, parseInt(searchParams.get('max_core')     ?? '10', 10) || 10);
  const maxVariante  = Math.max(1, parseInt(searchParams.get('max_variante') ?? '8',  10) || 8);

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

  // Build relevance term sets from the nomenclature dictionary
  const { propios, excluidos } = buildTerminos(tipo_cable);

  // Intermediate type — tipo assigned after scoring sort
  type ScoredRow = Omit<SuggestionItem, 'tipo'>;

  const scored: ScoredRow[] = (data ?? [])
    .filter((row) => {
      if (existingSet.has((row.keyword as string).toLowerCase())) return false;
      const yoy = parseChange(row.change_yoy as string | null);
      if (yoy !== null && yoy <= -50) return false;
      return true;
    })
    .flatMap((row) => {
      const keyword = row.keyword as string;
      const { relevant, relevancia } = getRelevancia(keyword, propios, excluidos);
      if (!relevant) return [];
      const avg   = row.avg_monthly_searches as number;
      const comp  = row.competition as string | null;
      const c3m   = row.change_3m as string | null;
      const cyoy  = row.change_yoy as string | null;
      return [{
        keyword,
        avg_monthly_searches: avg,
        competition:          comp,
        change_3m:            c3m,
        change_yoy:           cyoy,
        priority:             priorityTier(avg),
        relevancia,
        score:                computeScore(avg, comp, cyoy, c3m, relevancia),
      }];
    })
    .sort((a, b) => b.score - a.score);

  // Top 3 by score → always core; rest → CALIBRE_RE decides
  const items: SuggestionItem[] = scored.map((item, idx) => ({
    ...item,
    tipo: idx < 3 ? 'core' : classify(item.keyword),
  }));

  return NextResponse.json({
    core:              items.filter((s) => s.tipo === 'core').slice(0, maxCore),
    variante:          items.filter((s) => s.tipo === 'variante').slice(0, maxVariante),
    total_keywords_db: totalCount ?? 0,
  } satisfies SuggestKeywordsResponse);
}
