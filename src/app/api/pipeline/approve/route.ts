import { NextRequest, NextResponse } from 'next/server';
import { getPipelineClient }         from '@/lib/supabase/pipeline-client';
import { getVerifiedAdmin }          from '@/lib/firebase/admin';
import type { ExtraccionResult }     from '@/lib/pipeline/types';

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
    .slice(0, 120);
}

// ── POST /api/pipeline/approve ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('Autorización requerida', 401);
  const admin = await getVerifiedAdmin(authHeader.slice(7));
  if (!admin) return errorResponse('Acceso denegado: se requiere rol admin', 403);

  let body: { candidato_id?: string };
  try {
    body = await request.json() as { candidato_id?: string };
  } catch {
    return errorResponse('Body JSON inválido', 400);
  }
  if (!body.candidato_id) return errorResponse('candidato_id requerido', 400);

  // ── 1. Obtener el candidato ──────────────────────────────────────────────
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

  // ── 2. Resolver JSON final ───────────────────────────────────────────────
  const finalJson = (candidato.edited_json ?? candidato.raw_json) as ExtraccionResult | null;
  if (!finalJson?.PRODUCTO_CORE) {
    return errorResponse('El candidato no tiene datos válidos para insertar', 422);
  }

  const core = finalJson.PRODUCTO_CORE;

  // ── 3. Construir el registro para productos_catalogo ────────────────────
  const marca       = core.fabricante ?? candidato.fabricante ?? 'desconocido';
  const modelo      = core.nombre_comercial ?? core.tipo_cable ?? 'sin-modelo';
  const baseSlug    = slugify(`${marca}-${modelo}`);
  // Agregar sufijo corto para evitar colisiones (timestamp últimos 6 dígitos)
  const slug        = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

  // atributos: specs técnicas + variantes embebidas en el JSONB
  const atributos = {
    tipo_cable:           core.tipo_cable,
    nivel_tension:        core.nivel_tension,
    tension_nominal:      core.tension_nominal,
    temperatura_operacion_c: core.temperatura_operacion_c,
    temperatura_cortocircuito_c: core.temperatura_cortocircuito_c,
    material_conductor:   core.material_conductor,
    clase_conductor:      core.clase_conductor,
    material_aislamiento: core.material_aislamiento,
    material_cubierta:    core.material_cubierta,
    propiedades:          core.propiedades,
    metodos_instalacion:  core.metodos_instalacion,
    aplicaciones:         core.aplicaciones,
    clasificacion_incendio: core.clasificacion_incendio,
    normas_ensayo:        core.normas_ensayo,
    certificaciones:      core.certificaciones,
    normalizacion_tecnica: core.normalizacion_tecnica,
    variantes:            finalJson.VARIANTES,
    extensiones:          finalJson.EXTENSIONES_DINAMICAS,
  };

  const fichaUrl = Array.isArray(core.media?.fichas_pdf) && core.media.fichas_pdf[0]?.url
    ? core.media.fichas_pdf[0].url
    : null;

  const insertPayload = {
    marca,
    modelo,
    descripcion:        core.descripcion_corta ?? core.descripcion_tecnica ?? null,
    categoria:          core.tipo_cable ?? core.familia ?? null,
    slug,
    nombres_alternativos: core.aliases_busqueda ?? [],
    atributos,
    normas:             core.normas_producto ?? [],
    disponible_peru:    false,   // el admin lo activa manualmente en el catálogo
    ficha_tecnica_pdf:  fichaUrl,
    codigo_fabricante:  (finalJson.VARIANTES?.[0]?.sku_fabricante) ?? null,
  };

  // ── 4. INSERT en productos_catalogo ─────────────────────────────────────
  const { data: inserted, error: insertError } = await getPipelineClient()
    .from('productos_catalogo')
    .insert(insertPayload)
    .select('id')
    .single();

  if (insertError || !inserted) {
    return errorResponse(
      `Error al insertar en catálogo: ${insertError?.message ?? 'error desconocido'}`,
      500,
    );
  }

  // ── 5. Marcar candidato como aprobado ────────────────────────────────────
  const { error: updateError } = await getPipelineClient()
    .from('pipeline_candidatos')
    .update({
      status:      'approved',
      final_json:  finalJson,
      producto_id: inserted.id,
      reviewed_by: admin.uid,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', body.candidato_id);

  if (updateError) {
    // El producto ya fue insertado — registrar el error pero no fallar totalmente
    return NextResponse.json({
      producto_id: inserted.id,
      warning: `Producto insertado pero error al actualizar candidato: ${updateError.message}`,
    }, { status: 207 });
  }

  return NextResponse.json({ producto_id: inserted.id, approved: true });
}
