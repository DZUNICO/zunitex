// ─────────────────────────────────────────────────────────────────────────────
// STARLOGIC Data Pipeline — Schema de referencia + System Prompt
// Este archivo es la fuente de verdad del contrato con Claude.
// Actualizar aquí → se propaga automáticamente al SYSTEM_PROMPT.
// ─────────────────────────────────────────────────────────────────────────────

// Tabla AWG → mm² estándar (IEC 60228)
export const AWG_TO_MM2: Record<string, number> = {
  '14':   2.08,
  '12':   3.31,
  '10':   5.26,
  '8':    8.37,
  '6':    13.3,
  '4':    21.2,
  '2':    33.6,
  '1':    42.4,
  '1/0':  53.5,
  '2/0':  67.4,
  '3/0':  85.0,
  '4/0':  107.2,
  '300MCM': 152,
  '350MCM': 177,
  '500MCM': 253,
  '750MCM': 380,
};

// ── Schema de referencia (ejemplo TW-80 INDECO) ───────────────────────────────
// Sirve como plantilla que Claude debe replicar con los datos del PDF.
// Los campos con "uuid-generado-automaticamente" serán reemplazados en runtime.
// ─────────────────────────────────────────────────────────────────────────────
export const STARLOGIC_SCHEMA = {
  _meta: {
    version: '2.0',
    proyecto: 'STARLOGIC Industrial Graph',
    descripcion: 'Schema final para conductores electricos BT. Evolutivo hacia MT/AT/mineria/submarino.',
  },

  PRODUCTO_CORE: {
    product_id: 'uuid-generado-automaticamente',
    tipo_producto: 'cable',
    nivel_tension: 'bt',

    tipo_cable: 'TW',
    nombre_comercial: 'TW-80 +PLUS',
    familia: 'construccion',
    subfamilia: 'tw',

    fabricante: 'INDECO',
    marca_comercial: 'INDECO BY NEXANS',
    pais_fabricacion: 'Peru',

    descripcion_corta: 'Cable de cobre con aislamiento PVC Low Smoke para instalaciones fijas en edificaciones',
    descripcion_tecnica: 'Conductor de cobre blando clase B con aislamiento PVC Low Smoke, superficie estriada para mejor deslizamiento en instalacion',

    tension_nominal: { valor: '450/750', unidad: 'V' },

    temperatura_operacion_c: 80,
    temperatura_cortocircuito_c: 160,

    material_conductor: 'cobre_blando',
    clase_conductor: 'CL2',
    material_aislamiento: 'PVC_low_smoke',
    material_cubierta: null,

    propiedades: {
      libre_halogenos: false,
      baja_emision_humos: true,
      no_propagacion_llama: true,
      no_propagacion_incendio: false,
      resistente_uv: false,
      resistente_humedad: true,
      resistente_aceites: false,
      resistente_quimicos: false,
      antiroedor: false,
      apantallado: false,
    },

    clasificacion_incendio: { norma: 'IEC 60332-3-25', categoria: 'D' },
    tension_prueba_dielectrica: { valor_kv: 2.5, duracion_min: 5 },

    metodos_instalacion: ['ducto_conduit', 'interior_seco', 'interior_humedo'],
    aplicaciones: [
      'instalaciones_fijas',
      'edificaciones_residenciales',
      'alumbrado',
      'tomacorrientes',
      'aire_acondicionado',
      'electrobombas',
    ],
    normas_producto: ['NTP 370.250', 'NTP 370.252', 'UL 83'],
    normas_ensayo: ['IEC 61034-2', 'IEC 60332-3-25', 'UL 2556'],
    certificaciones: [],

    aliases_busqueda: [
      'cable tw 14',
      'cable tw 80',
      'tw indeco',
      'cable indeco 14',
      'cable pvc 450 750v',
      'cable de luz indeco',
      'cable numero 14',
    ],

    normalizacion_tecnica: {
      nivel_tension_normalizado: '450_750V',
      categoria_flexibilidad: 'rigido',
      sistema_unidades_principal: 'AWG',
      tiene_cubierta: false,
      n_conductores_energia: 1,
    },

    data_quality: {
      confidence_score: 0.95,
      fuente_tipo: 'ficha_oficial',
      manual_reviewed: false,
      reviewed_by: null,
      last_verified_at: '2026-05-28',
    },

    media: {
      imagenes: [],
      fichas_pdf: [{ url: '', version: null, fecha: null }],
      videos: [],
    },

    estado_catalogo: { activo: true, visible: true, verificado_tecnicamente: false },

    source_metadata: {
      fuente_specs: null,
      fecha_ficha: null,
      ultima_actualizacion: '2026-05-28',
      importado_por: 'bot_v1',
    },
  },

  // IMPORTANTE: VARIANTES es un ARRAY — una entrada por calibre/sección en el PDF
  VARIANTES: [
    {
      variant_id: 'uuid-generado-automaticamente',
      product_id: 'uuid-del-producto-padre',
      sku_fabricante: 'P00040595-2',
      codigo_pais: '10055671',
      configuracion_display: '1x14 AWG',

      conductores: { cantidad: 1, n_hilos: 7, geometria: 'circular' },
      seccion: { valor: 14, unidad: 'AWG' },

      normalizacion_tecnica: {
        seccion_mm2_equivalente: 2.08,
        awg_equivalente: '14',
        seccion_display: '14 AWG / 2.08 mm²',
      },

      diametros: {
        conductor_mm: 1.7,
        espesor_aislamiento_mm: 0.8,
        espesor_cubierta_mm: null,
        exterior_mm: 3.4,
      },

      peso_kg_km: 27,
      radio_minimo_curvatura_mm: null,
      traccion_maxima_n: null,

      performance_electrica: {
        resistencia_dc_ohm_km: 8.97,
        capacitancia_pf_m: 641,
        ampacidad: {
          aire_a: 28,
          ducto_a: 22,
          enterrado_a: null,
          aire_formacion_plana_a: null,
          aire_formacion_triangular_a: null,
          temperatura_ambiente_c: 30,
        },
      },

      colores_disponibles: ['negro', 'rojo', 'azul', 'blanco'],
      presentacion: ['rollo_100m', 'carrete_madera'],

      pricing: {
        precio_ref_pen: null,
        precio_ref_usd: null,
        fuente_precio: null,
        fecha_precio: null,
      },

      stock_metadata: { disponibilidad: 'referencial', fabricacion_especial: false },

      data_quality: {
        confidence_score: 0.95,
        fuente_tipo: 'ficha_oficial',
        manual_reviewed: false,
        reviewed_by: null,
        last_verified_at: '2026-05-28',
      },
    },
  ],

  EXTENSIONES_DINAMICAS: {
    construccion: {
      superficie_estriada: true,
      doble_capa_aislamiento: true,
      calibres_disponibles_awg: ['14', '12', '10', '8'],
      calibres_disponibles_mm2: [],
    },
    energia_bt: {
      tipo_armadura: null,
      cubierta_secundaria: null,
      instalacion_enterrado_directo: false,
      n_conductores_energia: null,
    },
    flexible: {
      flexibilidad_cable: null,
      resistente_torsion: false,
      resistente_vibraciones: false,
      n_conductores: null,
      tiene_relleno: false,
      identificacion_calibre_color_traza: null,
    },
    control: {
      n_pares: null,
      tipo_pantalla: null,
      cobertura_pantalla_pct: null,
      impedancia_caracteristica_ohm: null,
      drenaje: false,
    },
    solar: {
      tension_dc_v: null,
      cobre_estañado: false,
      certificacion_tuv: false,
      vida_util_anos: null,
      doble_aislamiento: false,
      norma_en_50618: false,
    },
    mineria: {
      resistente_hidrocarburos: false,
      antiabrasivo: false,
      apantallado: false,
      tension_prueba_especial_kv: null,
      apto_uso_minero: false,
    },
  },

  GRAPH_RELATIONS: {
    equivalencias: [],
    reemplazos: [],
    sustituye_a: [],
    compatibilidades: [],
    contenido_relacionado: [],
  },
} as const;

// ── System Prompt ─────────────────────────────────────────────────────────────
// Generado dinámicamente desde STARLOGIC_SCHEMA para mantener consistencia.
// ─────────────────────────────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `Eres un extractor experto de fichas técnicas de cables eléctricos para el mercado peruano.
Tu tarea es analizar el PDF recibido y extraer TODOS los atributos técnicos normalizados al schema JSON definido abajo.

════════════════════════════════════════
REGLAS ESTRICTAS
════════════════════════════════════════
- Devuelve SOLO JSON válido, sin texto adicional, sin bloques markdown, sin \`\`\`json
- Si un campo no existe en el PDF, usa null (NUNCA inventes valores)
- El JSON raíz debe tener exactamente estas 6 claves: PRODUCTO_CORE, VARIANTES, EXTENSIONES_DINAMICAS, GRAPH_RELATIONS, fabricante, tipo_cable
- VARIANTES debe ser siempre un array (aunque haya un solo calibre)

════════════════════════════════════════
REGLAS DE CAMPOS ESPECÍFICOS
════════════════════════════════════════
seccion_mm2_equivalente:
  Usa la tabla AWG→mm² estándar (IEC 60228):
  14AWG=2.08, 12AWG=3.31, 10AWG=5.26, 8AWG=8.37, 6AWG=13.3,
  4AWG=21.2, 2AWG=33.6, 1/0AWG=53.5, 2/0AWG=67.4,
  3/0AWG=85.0, 4/0AWG=107.2, 300MCM=152, 350MCM=177, 500MCM=253

confidence_score:
  0.95–1.0  ficha oficial completa, sin ambigüedades
  0.80–0.94 ficha con algunos campos faltantes o tablas con OCR imperfecto
  0.60–0.79 datos ambiguos, PDF escaneado de baja calidad, o múltiples valores posibles
  < 0.60    datos dudosos — marcarlo claramente

aliases_busqueda:
  Genera mínimo 5 variantes de cómo un técnico peruano buscaría este cable en Google.
  Incluir: con y sin número de calibre, con nombre del fabricante, abreviaciones comunes.

VARIANTES:
  Extrae UNA entrada por cada fila de calibre/sección en la tabla de datos técnicos.
  product_id de cada variante debe ser el mismo product_id del PRODUCTO_CORE.
  variant_id: genera un UUID v4 distinto para cada variante.

fabricante y tipo_cable:
  Incluirlos TAMBIÉN como campos raíz del JSON (además de dentro de PRODUCTO_CORE).
  Sirven para pre-clasificar el candidato en la base de datos sin parsear el JSON completo.

════════════════════════════════════════
SCHEMA TARGET
════════════════════════════════════════
${JSON.stringify(STARLOGIC_SCHEMA, null, 2)}`;
