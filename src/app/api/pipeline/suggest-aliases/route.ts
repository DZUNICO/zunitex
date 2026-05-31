import { NextRequest, NextResponse } from 'next/server';
import Anthropic                     from '@anthropic-ai/sdk';
import { verifyAdminToken }          from '@/lib/firebase/admin';
import { CABLE_NOMENCLATURE }        from '@/lib/pipeline/cable-nomenclature';
import { normalizarTipoCable }       from '@/lib/pipeline/cable-nomenclature';
import type { ExtraccionResult }     from '@/lib/pipeline/types';
import { logger }                    from '@/lib/utils/logger';

// ── Exported types ─────────────────────────────────────────────────────────────

export interface AliasSuggestion {
  alias:  string;
  volumen: 'alto' | 'medio' | 'bajo' | 'desconocido';
  tipo:   'agregar_core' | 'agregar_variante' | 'eliminar';
  razon:  string;
}

export interface SuggestAliasesResponse {
  aliases_core:     AliasSuggestion[];
  aliases_variante: AliasSuggestion[];
  aliases_eliminar: AliasSuggestion[];
  resumen:          string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function buildPrompt(
  editedJson: ExtraccionResult,
  nomenclaturaAliases: string[],
): string {
  const core          = editedJson.PRODUCTO_CORE;
  const existingAliases = core.aliases_busqueda ?? [];
  const calibres = (editedJson.VARIANTES ?? [])
    .map((v) => {
      const val = v.seccion?.valor;
      const uni = v.seccion?.unidad ?? 'AWG';
      return val != null ? `${val} ${uni}` : null;
    })
    .filter(Boolean);

  return `Eres un especialista en SEO para el mercado peruano de materiales eléctricos.
Analiza los datos de este producto y sugiere aliases de búsqueda optimizados para Google.

PRODUCTO:
- Nombre comercial: ${core.nombre_comercial ?? 'desconocido'}
- Fabricante: ${core.fabricante ?? 'desconocido'}
- Tipo de cable: ${core.tipo_cable ?? 'desconocido'}
- Tensión nominal: ${core.tension_nominal?.valor ?? ''} ${core.tension_nominal?.unidad ?? 'V'}
- Temperatura: ${core.temperatura_operacion_c ?? '?'}°C
- Material aislamiento: ${core.material_aislamiento ?? 'desconocido'}
- Calibres disponibles: ${calibres.length > 0 ? calibres.join(', ') : 'no especificados'}
- Aplicaciones: ${(core.aplicaciones ?? []).join(', ') || 'no especificadas'}

ALIASES ACTUALES (ya en el producto):
${existingAliases.length > 0 ? existingAliases.map((a) => `- ${a}`).join('\n') : '(ninguno)'}

ALIASES DEL DICCIONARIO DE NOMENCLATURA PERUANA (referencia de mercado):
${nomenclaturaAliases.map((a) => `- ${a}`).join('\n')}

TAREA:
1. Sugiere aliases nuevos para agregar a PRODUCTO_CORE (aliases_core): búsquedas de producto general sin calibre específico.
2. Sugiere aliases que incluyan calibres específicos (aliases_variante): útiles para variantes individuales pero no para el core.
3. Identifica aliases actuales que son incorrectos, duplicados o irrelevantes para eliminar (aliases_eliminar).

REGLAS:
- Piensa como un técnico o comprador peruano buscando en Google
- Incluir variantes con y sin tilde (ej: "eléctrico" y "electrico")
- Incluir búsquedas con precio ("cable tw 14 precio", "cable tw precio lima")
- Incluir búsquedas con fabricante cuando sea relevante
- NO sugerir aliases ya presentes en ALIASES ACTUALES para aliases_core/aliases_variante
- NO sugerir aliases que ya están en ALIASES ACTUALES para aliases_eliminar a menos que sean duplicados o incorrectos
- Máximo 8 sugerencias por categoría

FORMATO DE RESPUESTA: JSON válido sin texto adicional, sin bloques markdown.
{
  "aliases_core": [
    { "alias": "...", "volumen": "alto|medio|bajo|desconocido", "tipo": "agregar_core", "razon": "..." }
  ],
  "aliases_variante": [
    { "alias": "...", "volumen": "alto|medio|bajo|desconocido", "tipo": "agregar_variante", "razon": "..." }
  ],
  "aliases_eliminar": [
    { "alias": "...", "volumen": "alto|medio|bajo|desconocido", "tipo": "eliminar", "razon": "..." }
  ],
  "resumen": "Una frase resumiendo las principales oportunidades SEO detectadas."
}`;
}

// ── POST /api/pipeline/suggest-aliases ────────────────────────────────────────

export async function POST(request: NextRequest) {

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Autorización requerida', 401);
  }
  const isAdmin = await verifyAdminToken(authHeader.slice(7));
  if (!isAdmin) {
    return errorResponse('Acceso denegado: se requiere rol admin', 403);
  }

  // ── 2. Body ───────────────────────────────────────────────────────────────
  let body: { edited_json?: unknown; raw_json?: unknown };
  try {
    body = await request.json() as { edited_json?: unknown; raw_json?: unknown };
  } catch {
    return errorResponse('Body JSON inválido', 400);
  }

  const workingJson = (body.edited_json ?? body.raw_json) as ExtraccionResult | null;
  if (!workingJson || typeof workingJson !== 'object') {
    return errorResponse('Se requiere edited_json o raw_json', 400);
  }

  // ── 3. Obtener aliases del diccionario para este tipo de cable ────────────
  const tipoCableRaw = workingJson.tipo_cable
    ?? workingJson.PRODUCTO_CORE?.tipo_cable
    ?? null;
  const tipoNormalizado = tipoCableRaw ? normalizarTipoCable(tipoCableRaw) : null;
  const nomenclaturaAliases = tipoNormalizado
    ? (CABLE_NOMENCLATURE[tipoNormalizado]?.aliases_busqueda_peru ?? [])
    : [];

  // ── 4. Llamar a Claude ────────────────────────────────────────────────────
  const prompt = buildPrompt(workingJson, nomenclaturaAliases);
  let rawText = '';

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message   = await anthropic.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 2000,
      messages:   [{ role: 'user', content: prompt }],
    });

    const first = message.content[0];
    if (first.type !== 'text') {
      return errorResponse('Respuesta inesperada de Claude', 502);
    }
    rawText = first.text;
  } catch (err) {
    logger.error('Error llamando a Claude (suggest-aliases)', err as Error);
    return errorResponse(
      `Error al consultar Claude: ${err instanceof Error ? err.message : 'error desconocido'}`,
      502,
    );
  }

  // ── 5. Parsear respuesta ──────────────────────────────────────────────────
  try {
    const clean = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(clean) as SuggestAliasesResponse;

    return NextResponse.json(parsed);
  } catch (err) {
    logger.error('Error parseando respuesta de suggest-aliases', err as Error);
    return errorResponse('Claude devolvió una respuesta no parseable', 502);
  }
}
