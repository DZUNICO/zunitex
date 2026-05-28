// ─────────────────────────────────────────────────────────────────────────────
// STARLOGIC Data Pipeline — TypeScript types
// Schema v2.0 — conductores eléctricos BT
// ─────────────────────────────────────────────────────────────────────────────

// ── Primitivos ────────────────────────────────────────────────────────────────

export type PipelineStatus = 'pending' | 'approved' | 'rejected';
export type SourceType    = 'pdf_upload' | 'web_scrape';

// ── DB Row: pipeline_candidatos ───────────────────────────────────────────────

export interface PipelineCandidato {
  id:               string;
  created_at:       string;
  updated_at:       string;
  source:           SourceType;
  pdf_filename:     string | null;
  raw_pdf_url:      string | null;
  fabricante:       string | null;
  tipo_cable:       string | null;
  status:           PipelineStatus;
  confidence_score: number | null;        // 0.0 – 1.0
  raw_json:         ExtraccionResult | null;   // output directo de Claude
  edited_json:      ExtraccionResult | null;   // modificado por el operador
  final_json:       ExtraccionResult | null;   // aprobado → va a productos_catalogo
  reviewed_by:      string | null;        // Firebase UID
  reviewed_at:      string | null;        // ISO datetime
  notas:            string | null;
  producto_id:      string | null;        // FK → productos_catalogo.id (post-aprobación)
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-tipos: PRODUCTO_CORE
// ─────────────────────────────────────────────────────────────────────────────

interface TensionNominal {
  valor: string;   // ej: "450/750", "0.6/1"
  unidad: string;  // ej: "V", "kV"
}

interface Propiedades {
  libre_halogenos:         boolean;
  baja_emision_humos:      boolean;
  no_propagacion_llama:    boolean;
  no_propagacion_incendio: boolean;
  resistente_uv:           boolean;
  resistente_humedad:      boolean;
  resistente_aceites:      boolean;
  resistente_quimicos:     boolean;
  antiroedor:              boolean;
  apantallado:             boolean;
}

interface ClasificacionIncendio {
  norma:     string | null;
  categoria: string | null;
}

interface TensionPruebaDielectrica {
  valor_kv:    number | null;
  duracion_min: number | null;
}

interface NormalizacionTecnicaCore {
  nivel_tension_normalizado:  string | null;
  categoria_flexibilidad:     string | null;   // "rigido" | "flexible" | "semiflexible"
  sistema_unidades_principal: 'AWG' | 'mm2' | null;
  tiene_cubierta:             boolean;
  n_conductores_energia:      number | null;
}

export interface DataQuality {
  confidence_score: number;       // 0.0 – 1.0
  fuente_tipo:      string;       // "ficha_oficial" | "catalogo" | "web_scrape"
  manual_reviewed:  boolean;
  reviewed_by:      string | null;
  last_verified_at: string;       // ISO date
}

interface FichaPdf {
  url:     string;
  version: string | null;
  fecha:   string | null;
}

interface Media {
  imagenes:   string[];
  fichas_pdf: FichaPdf[];
  videos:     string[];
}

interface EstadoCatalogo {
  activo:                  boolean;
  visible:                 boolean;
  verificado_tecnicamente: boolean;
}

interface SourceMetadata {
  fuente_specs:        string | null;
  fecha_ficha:         string | null;
  ultima_actualizacion: string;
  importado_por:       string;
}

// ── ProductoCore ──────────────────────────────────────────────────────────────

export interface ProductoCore {
  product_id:                string;
  tipo_producto:             string;          // siempre "cable"
  nivel_tension:             string;          // "bt" | "mt" | "at"
  tipo_cable:                string;          // "TW" | "THW" | "NYY" | "N2XSY" …
  nombre_comercial:          string;
  familia:                   string;          // "construccion" | "energia_bt" | "flexible" …
  subfamilia:                string | null;
  fabricante:                string;
  marca_comercial:           string | null;
  pais_fabricacion:          string | null;
  descripcion_corta:         string;
  descripcion_tecnica:       string | null;
  tension_nominal:           TensionNominal;
  temperatura_operacion_c:   number | null;
  temperatura_cortocircuito_c: number | null;
  material_conductor:        string;          // "cobre_blando" | "aluminio" …
  clase_conductor:           string | null;   // "CL2" | "CL5" …
  material_aislamiento:      string;
  material_cubierta:         string | null;
  propiedades:               Propiedades;
  clasificacion_incendio:    ClasificacionIncendio;
  tension_prueba_dielectrica: TensionPruebaDielectrica;
  metodos_instalacion:       string[];
  aplicaciones:              string[];
  normas_producto:           string[];
  normas_ensayo:             string[];
  certificaciones:           string[];
  aliases_busqueda:          string[];
  normalizacion_tecnica:     NormalizacionTecnicaCore;
  data_quality:              DataQuality;
  media:                     Media;
  estado_catalogo:           EstadoCatalogo;
  source_metadata:           SourceMetadata;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-tipos: VARIANTE
// ─────────────────────────────────────────────────────────────────────────────

interface Conductores {
  cantidad:  number;
  n_hilos:   number | null;
  geometria: string | null;   // "circular" | "sectorial" | "compacto"
}

interface Seccion {
  valor: number;
  unidad: 'AWG' | 'mm2';
}

interface NormalizacionTecnicaVariante {
  seccion_mm2_equivalente: number | null;
  awg_equivalente:         string | null;
  seccion_display:         string | null;   // ej: "14 AWG / 2.08 mm²"
}

interface Diametros {
  conductor_mm:           number | null;
  espesor_aislamiento_mm: number | null;
  espesor_cubierta_mm:    number | null;
  exterior_mm:            number | null;
}

interface Ampacidad {
  aire_a:                    number | null;
  ducto_a:                   number | null;
  enterrado_a:               number | null;
  aire_formacion_plana_a:    number | null;
  aire_formacion_triangular_a: number | null;
  temperatura_ambiente_c:    number | null;
}

interface PerformanceElectrica {
  resistencia_dc_ohm_km: number | null;
  capacitancia_pf_m:     number | null;
  ampacidad:             Ampacidad;
}

interface Pricing {
  precio_ref_pen: number | null;
  precio_ref_usd: number | null;
  fuente_precio:  string | null;
  fecha_precio:   string | null;
}

interface StockMetadata {
  disponibilidad:      string;    // "referencial" | "en_stock" | "bajo_pedido"
  fabricacion_especial: boolean;
}

// ── Variante ──────────────────────────────────────────────────────────────────

export interface Variante {
  variant_id:          string;
  product_id:          string;         // UUID del PRODUCTO_CORE padre
  sku_fabricante:      string | null;
  codigo_pais:         string | null;
  configuracion_display: string;       // ej: "1x14 AWG", "3x35 mm²"
  conductores:         Conductores;
  seccion:             Seccion;
  normalizacion_tecnica: NormalizacionTecnicaVariante;
  diametros:           Diametros;
  peso_kg_km:          number | null;
  radio_minimo_curvatura_mm: number | null;
  traccion_maxima_n:   number | null;
  performance_electrica: PerformanceElectrica;
  colores_disponibles: string[];
  presentacion:        string[];
  pricing:             Pricing;
  stock_metadata:      StockMetadata;
  data_quality:        DataQuality;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-tipos: EXTENSIONES_DINAMICAS
// ─────────────────────────────────────────────────────────────────────────────

interface ExtConstruccion {
  superficie_estriada:        boolean;
  doble_capa_aislamiento:     boolean;
  calibres_disponibles_awg:   string[];
  calibres_disponibles_mm2:   number[];
}

interface ExtEnergiaBt {
  tipo_armadura:                string | null;
  cubierta_secundaria:          string | null;
  instalacion_enterrado_directo: boolean;
  n_conductores_energia:        number | null;
}

interface ExtFlexible {
  flexibilidad_cable:                  string | null;
  resistente_torsion:                  boolean;
  resistente_vibraciones:              boolean;
  n_conductores:                       number | null;
  tiene_relleno:                       boolean;
  identificacion_calibre_color_traza:  string | null;
}

interface ExtControl {
  n_pares:                      number | null;
  tipo_pantalla:                string | null;
  cobertura_pantalla_pct:       number | null;
  impedancia_caracteristica_ohm: number | null;
  drenaje:                      boolean;
}

interface ExtSolar {
  tension_dc_v:      number | null;
  cobre_estañado:    boolean;
  certificacion_tuv: boolean;
  vida_util_anos:    number | null;
  doble_aislamiento: boolean;
  norma_en_50618:    boolean;
}

interface ExtMineria {
  resistente_hidrocarburos:    boolean;
  antiabrasivo:                boolean;
  apantallado:                 boolean;
  tension_prueba_especial_kv:  number | null;
  apto_uso_minero:             boolean;
}

export interface ExtencionesDinamicas {
  construccion: ExtConstruccion;
  energia_bt:   ExtEnergiaBt;
  flexible:     ExtFlexible;
  control:      ExtControl;
  solar:        ExtSolar;
  mineria:      ExtMineria;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-tipos: GRAPH_RELATIONS
// ─────────────────────────────────────────────────────────────────────────────

interface Equivalencia {
  tipo:             string;
  producto_id:      string;
  marca:            string;
  nivel_confianza:  'alto' | 'medio' | 'bajo';
  verificado:       boolean;
  notas:            string;
}

interface Reemplazo {
  tipo:        string;
  producto_id: string;
  motivo:      string;
  verificado:  boolean;
}

interface SustuyeA {
  producto_id: string;
  motivo:      string;
  verificado:  boolean;
  anio_aprox:  number | null;
}

interface Compatibilidad {
  tipo:   string;
  equipo: string;
  notas:  string;
}

interface ContenidoRelacionado {
  tipo:   string;
  slug:   string;
  titulo: string;
}

export interface GraphRelations {
  equivalencias:        Equivalencia[];
  reemplazos:           Reemplazo[];
  sustituye_a:          SustuyeA[];
  compatibilidades:     Compatibilidad[];
  contenido_relacionado: ContenidoRelacionado[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ExtraccionResult — estructura top-level que devuelve Claude
// ─────────────────────────────────────────────────────────────────────────────

export interface ExtraccionResult {
  PRODUCTO_CORE:        ProductoCore;
  VARIANTES:            Variante[];         // array: uno por calibre/sección en el PDF
  EXTENSIONES_DINAMICAS: ExtencionesDinamicas;
  GRAPH_RELATIONS:      GraphRelations;
  // Campos raíz para pre-llenar pipeline_candidatos sin parsear todo el JSON
  fabricante:  string | null;
  tipo_cable:  string | null;
}
