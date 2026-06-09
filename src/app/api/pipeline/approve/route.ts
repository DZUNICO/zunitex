import { NextRequest, NextResponse } from 'next/server';
import { getPipelineClient }         from '@/lib/supabase/pipeline-client';
import { getVerifiedAdmin }          from '@/lib/firebase/admin';
import type { ExtraccionResult, Variante } from '@/lib/pipeline/types';

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

// "2.5mm2" (display) and "2-5mm2" (slug-safe) from a Seccion
function calibreDisplay(seccion: Variante['seccion']): string {
  return `${seccion.valor}${seccion.unidad.toLowerCase()}`;
}

function calibreSlug(seccion: Variante['seccion']): string {
  return String(seccion.valor).replace('.', '-') + seccion.unidad.toLowerCase();
}

// Build a short, SEO-friendly description specific to this variant.
// Uses the normalized cable type + calibre; marks LSOH cables explicitly.
function generarDescripcionCorta(
  tipoCable: string,
  variante: Variante,
  materialAislamiento: string | null,
): string {
  const calibre = calibreDisplay(variante.seccion);   // "2.5mm2", "14awg"

  const esLibreHalogeno =
    tipoCable.includes('NH-90')  ||
    tipoCable.includes('N2XOH')  ||
    (materialAislamiento ?? '').toLowerCase().includes('hffr')           ||
    (materialAislamiento ?? '').toLowerCase().includes('lsoh')           ||
    (materialAislamiento ?? '').toLowerCase().includes('libre de halog');

  const base = `Cable ${tipoCable} ${calibre}`.trim();
  return esLibreHalogeno ? `${base} libre de halógeno` : base;
}

// ── POST /api/pipeline/approve ────────────────────────────────────────────────
// ADR-002: inserts N rows in productos_catalogo — one per VARIANTE.
// ADR-003: only reads edited_json/raw_json, never modifies raw_json.
// ADR-006: all rows inserted with disponible_peru = false.

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('Autorización requerida', 401);
  const admin = await getVerifiedAdmin(authHeader.slice(7));
  if (!admin) return errorResponse('Acceso denegado: se requiere rol admin', 403);

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { candidato_id?: string };
  try {
    body = await request.json() as { candidato_id?: string };
  } catch {
    return errorResponse('Body JSON inválido', 400);
  }
  if (!body.candidato_id) return errorResponse('candidato_id requerido', 400);

  // ── 1. Fetch candidato ──────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: candidato, error: fetchError } = await getPipelineClient()
    .from('pipeline_candidatos')
    .select('*')
    .eq('id', body.candidato_id)
    .eq('status', 'pending')
    .single();

  if (fetchError || !candidato) {
    return errorResponse(
      fetchError?.message ?? 'Candidato no encontrado o no está en estado pending',
      fetchError ? 500 : 404,
    );
  }

  // ── 2. Resolve final JSON (ADR-003: raw_json is never modified) ─────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalJson = ((candidato as any).edited_json ?? (candidato as any).raw_json) as ExtraccionResult | null;
  if (!finalJson?.PRODUCTO_CORE) {
    return errorResponse('El candidato no tiene datos válidos (PRODUCTO_CORE ausente)', 422);
  }
  if (!Array.isArray(finalJson.VARIANTES) || finalJson.VARIANTES.length === 0) {
    return errorResponse('El candidato no tiene VARIANTES válidas para insertar', 422);
  }

  const core     = finalJson.PRODUCTO_CORE;
  const variantes = finalJson.VARIANTES;

  // ── 3. Shared identifiers for this candidato's row group ────────────────────
  // producto_padre_id: one UUID for all rows from this candidato (ADR-002)
  const productoPadreId = crypto.randomUUID();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tipoNormalizado = (candidato as any).tipo_cable_normalizado as string | null;
  const marcaRaw   = core.fabricante ?? (candidato as any).fabricante ?? 'Desconocido';
  const marcaSlug  = slugify(marcaRaw);
  const tipoSlug   = slugify(tipoNormalizado ?? core.tipo_cable ?? 'cable');

  // PDF from candidato upload or from core media
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fichaUrl: string | null = (candidato as any).raw_pdf_url
    ?? (Array.isArray(core.media?.fichas_pdf) && core.media.fichas_pdf[0]?.url
        ? core.media.fichas_pdf[0].url
        : null);

  // ── 4. Build one row per variante (ADR-002) ─────────────────────────────────
  const rows = variantes.map((v) => {
    // Slug format: {marca}-{tipo}-{calibre}  e.g. indeco-nh-90-2-5mm2
    const slug = slugify(`${marcaSlug}-${tipoSlug}-${calibreSlug(v.seccion)}`);

    // atributos jsonb: graph IDs + core context + variant-specific data (ADR-001)
    const atributos = {
      // Graph identifiers (ADR-002)
      producto_padre_id:   productoPadreId,
      variante_id:         calibreDisplay(v.seccion),   // "2.5mm2", "14awg"

      // Core data shared across all rows of this candidato
      tipo_cable:                    core.tipo_cable,
      nivel_tension:                 core.nivel_tension,
      tension_nominal:               core.tension_nominal,
      temperatura_operacion_c:       core.temperatura_operacion_c,
      temperatura_cortocircuito_c:   core.temperatura_cortocircuito_c,
      material_conductor:            core.material_conductor,
      clase_conductor:               core.clase_conductor,
      material_aislamiento:          core.material_aislamiento,
      material_cubierta:             core.material_cubierta,
      propiedades:                   core.propiedades,
      clasificacion_incendio:        core.clasificacion_incendio,
      metodos_instalacion:           core.metodos_instalacion,
      aplicaciones:                  core.aplicaciones,
      normalizacion_tecnica_core:    core.normalizacion_tecnica,
      certificaciones:               core.certificaciones,

      // Variant-specific technical data
      configuracion_display:         v.configuracion_display,
      conductores:                   v.conductores,
      seccion:                       v.seccion,
      normalizacion_tecnica:         v.normalizacion_tecnica,
      diametros:                     v.diametros,
      peso_kg_km:                    v.peso_kg_km,
      radio_minimo_curvatura_mm:     v.radio_minimo_curvatura_mm,
      traccion_maxima_n:             v.traccion_maxima_n,
      performance_electrica:         v.performance_electrica,
      colores_disponibles:           v.colores_disponibles,
      presentacion:                  v.presentacion,

      // Extensions and graph relations (same for all rows)
      extensiones:                   finalJson.EXTENSIONES_DINAMICAS,
      graph_relations:               finalJson.GRAPH_RELATIONS,
    };

    return {
      marca:                marcaRaw,
      modelo:               core.nombre_comercial ?? core.tipo_cable ?? 'sin-modelo',
      descripcion:          generarDescripcionCorta(
                              tipoNormalizado ?? core.tipo_cable ?? '',
                              v,
                              core.material_aislamiento ?? null,
                            ),
      categoria:            tipoNormalizado ?? core.tipo_cable ?? null,
      slug,
      nombres_alternativos: core.aliases_busqueda ?? [],
      atributos,
      normas:               core.normas_producto ?? [],
      disponible_peru:      false,                          // ADR-006
      ficha_tecnica_pdf:    fichaUrl,
      codigo_fabricante:    v.sku_fabricante ?? null,
    };
  });

  // ── 5. Batch upsert — onConflict slug handles re-approvals safely ───────────
  const { data: inserted, error: insertError } = await getPipelineClient()
    .from('productos_catalogo')
    .upsert(rows, { onConflict: 'slug' })
    .select('id');

  if (insertError || !inserted || inserted.length === 0) {
    return errorResponse(
      `Error al insertar en catálogo: ${insertError?.message ?? 'sin resultados'}`,
      500,
    );
  }

  // ── 6. Mark candidato as approved ───────────────────────────────────────────
  const { error: updateError } = await getPipelineClient()
    .from('pipeline_candidatos')
    .update({
      status:      'approved',
      final_json:  finalJson,
      producto_id: inserted[0].id,        // first row ID for backward compat
      reviewed_by: admin.uid,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', body.candidato_id);

  if (updateError) {
    // Rows were inserted — return 207 with warning so the UI can handle it
    return NextResponse.json({
      producto_id:      inserted[0].id,
      filas_insertadas: inserted.length,
      ids:              (inserted as { id: string }[]).map((r) => r.id),
      warning: `Filas insertadas pero error al actualizar candidato: ${updateError.message}`,
    }, { status: 207 });
  }

  return NextResponse.json({
    producto_id:      inserted[0].id,     // backward compat with UI
    filas_insertadas: inserted.length,
    ids:              (inserted as { id: string }[]).map((r) => r.id),
    approved:         true,
  });
}
