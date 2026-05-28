import { NextRequest, NextResponse } from 'next/server';
import Anthropic                     from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT }             from '@/lib/pipeline/schemas';
import type { ExtraccionResult }     from '@/lib/pipeline/types';
import { getPipelineClient }         from '@/lib/supabase/pipeline-client';
import { verifyAdminToken }          from '@/lib/firebase/admin';
import { logger }                    from '@/lib/utils/logger';

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB

// ── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Calcula el confidence_score promedio tomando en cuenta el core y cada variante.
 * Si no hay scores válidos retorna 0.
 */
function calcConfidence(data: ExtraccionResult): number {
  const scores: number[] = [];

  const coreScore = data.PRODUCTO_CORE?.data_quality?.confidence_score;
  if (typeof coreScore === 'number') scores.push(coreScore);

  for (const v of data.VARIANTES ?? []) {
    const vs = v?.data_quality?.confidence_score;
    if (typeof vs === 'number') scores.push(vs);
  }

  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Intenta parsear el JSON de respuesta de Claude.
 * Claude puede ocasionalmente incluir marcadores de bloque de código a pesar
 * de las instrucciones del prompt — los limpiamos antes de parsear.
 */
function parseClaudeJson(text: string): ExtraccionResult {
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(clean) as ExtraccionResult;
}

/**
 * Validación mínima del JSON extraído: debe tener PRODUCTO_CORE y VARIANTES.
 * No validamos el schema completo — el operador revisa en la UI.
 */
function hasRequiredStructure(data: unknown): data is ExtraccionResult {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.PRODUCTO_CORE === 'object' && d.PRODUCTO_CORE !== null &&
    Array.isArray(d.VARIANTES)
  );
}

// ── POST /api/pipeline/extract ────────────────────────────────────────────────

export async function POST(request: NextRequest) {

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

  // ── 2. Parsear FormData ──────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('FormData inválido o malformado', 400);
  }

  const pdfField   = formData.get('pdf');
  const fabricante = (formData.get('fabricante') as string | null)?.trim() || null;
  const tipo_cable = (formData.get('tipo_cable') as string | null)?.trim() || null;

  if (!(pdfField instanceof File)) {
    return errorResponse('Campo "pdf" requerido y debe ser un archivo', 400);
  }

  // ── 3. Validar PDF ───────────────────────────────────────────────────────
  if (pdfField.type !== 'application/pdf') {
    return errorResponse(
      `Tipo de archivo inválido: "${pdfField.type}". Se requiere application/pdf`,
      400
    );
  }
  if (pdfField.size > MAX_PDF_BYTES) {
    const mb = (pdfField.size / 1024 / 1024).toFixed(1);
    return errorResponse(
      `PDF demasiado grande: ${mb} MB. Máximo permitido: 20 MB`,
      400
    );
  }
  if (pdfField.size === 0) {
    return errorResponse('El archivo PDF está vacío', 400);
  }

  // ── 4. Convertir a base64 ────────────────────────────────────────────────
  const arrayBuffer = await pdfField.arrayBuffer();
  const base64Pdf   = Buffer.from(arrayBuffer).toString('base64');
  const pdfFilename = pdfField.name || 'documento.pdf';

  // ── 5. Llamar a Claude con el PDF ────────────────────────────────────────
  const userText = [
    'Extrae todos los atributos técnicos de esta ficha técnica según el schema.',
    fabricante ? `Fabricante declarado: ${fabricante}.` : 'Fabricante: no especificado.',
    tipo_cable ? `Tipo de cable declarado: ${tipo_cable}.` : 'Tipo de cable: no especificado.',
  ].join(' ');

  let rawText = '';
  let extractedJson: ExtraccionResult | null = null;
  let parseError: string | null = null;

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system:     SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type:       'base64',
                media_type: 'application/pdf',
                data:       base64Pdf,
              },
            },
            {
              type: 'text',
              text: userText,
            },
          ],
        },
      ],
    });

    const firstContent = message.content[0];
    if (firstContent.type !== 'text') {
      return errorResponse('Respuesta inesperada de Claude (tipo no text)', 502);
    }
    rawText = firstContent.text;

  } catch (err) {
    logger.error('Error llamando a Claude API', err as Error);
    return errorResponse(
      `Error al procesar con Claude: ${err instanceof Error ? err.message : 'error desconocido'}`,
      502
    );
  }

  // ── 6. Parsear y validar el JSON ─────────────────────────────────────────
  try {
    const parsed = parseClaudeJson(rawText);
    if (hasRequiredStructure(parsed)) {
      extractedJson = parsed;
    } else {
      parseError = 'JSON parseado pero sin PRODUCTO_CORE o VARIANTES';
      logger.error('Estructura JSON inválida de Claude', new Error(parseError));
    }
  } catch (err) {
    parseError = err instanceof Error ? err.message : 'JSON inválido';
    logger.error('Error parseando JSON de Claude', err as Error);
  }

  // ── 7. Calcular confidence y preparar el INSERT ──────────────────────────
  // Si Claude devolvió JSON malformado, guardamos igual con confidence bajo.
  // El operador decide en la Review Interface.
  const fallbackJson: ExtraccionResult = {
    PRODUCTO_CORE:        {} as ExtraccionResult['PRODUCTO_CORE'],
    VARIANTES:            [],
    EXTENSIONES_DINAMICAS: {} as ExtraccionResult['EXTENSIONES_DINAMICAS'],
    GRAPH_RELATIONS:      {} as ExtraccionResult['GRAPH_RELATIONS'],
    fabricante:           fabricante,
    tipo_cable:           tipo_cable,
  };

  const finalRawJson     = extractedJson ?? fallbackJson;
  const confidenceScore  = extractedJson ? calcConfidence(extractedJson) : 0.1;
  const variantesCount   = extractedJson?.VARIANTES?.length ?? 0;

  // Campos raíz que Claude extrae (o los declarados por el operador como fallback)
  const fabricanteDetectado  =
    extractedJson?.fabricante ??
    extractedJson?.PRODUCTO_CORE?.fabricante ??
    fabricante;
  const tipoCableDetectado   =
    extractedJson?.tipo_cable ??
    extractedJson?.PRODUCTO_CORE?.tipo_cable ??
    tipo_cable;

  // ── 8. INSERT en pipeline_candidatos ────────────────────────────────────
  const insertPayload = {
    source:           'pdf_upload' as const,
    pdf_filename:     pdfFilename,
    raw_pdf_url:      null,           // no hay URL externa para uploads directos
    fabricante:       fabricanteDetectado ?? null,
    tipo_cable:       tipoCableDetectado ?? null,
    status:           'pending'  as const,
    confidence_score: confidenceScore,
    raw_json:         finalRawJson,
    edited_json:      null,
    final_json:       null,
    reviewed_by:      null,
    reviewed_at:      null,
    notas:            parseError ? `Parse error: ${parseError}` : null,
  };

  const { data: inserted, error: dbError } = await getPipelineClient()
    .from('pipeline_candidatos')
    .insert(insertPayload)
    .select('id')
    .single();

  if (dbError || !inserted) {
    logger.error('Error insertando en pipeline_candidatos', new Error(dbError?.message));
    return errorResponse(
      `Error al guardar en base de datos: ${dbError?.message ?? 'error desconocido'}`,
      500
    );
  }

  // ── 9. Respuesta ─────────────────────────────────────────────────────────
  logger.info(`Pipeline: candidato creado ${inserted.id} — score=${confidenceScore.toFixed(2)} variantes=${variantesCount}`);

  return NextResponse.json({
    candidato_id:     inserted.id,
    confidence_score: confidenceScore,
    variantes_count:  variantesCount,
    parse_error:      parseError,   // null si todo OK; mensaje si hubo problema
  });
}
