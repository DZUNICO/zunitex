// ============================================================
// STARLOGIC — Diccionario de Nomenclatura de Cables Eléctricos
// Versión: 1.0 | Mayo 2026
//
// PRINCIPIO: el graph habla el idioma del mercado peruano.
// Las normas son metadata de referencia, no la capa principal.
//
// tipo_mercado_peru  → como lo conoce el técnico/comprador peruano
// tipo_tecnico_ntp   → como lo llama la norma peruana (INDECOPI)
// codigo_iec         → designación estándar internacional
// ============================================================

export interface CableDefinicion {
  // CAPA MERCADO (la que ve el usuario)
  tipo_mercado_peru: string          // "NH", "TW-80", "THW-90", etc.
  descripcion_mercado: string        // descripción en lenguaje de mercado

  // CAPA TÉCNICA (metadata de referencia)
  tipo_tecnico_ntp: string | null    // "LSOH", "TW-70", "THW-75"
  codigo_iec: string | null          // "H07Z1-R", "60227 IEC 01"
  norma_producto: string[]           // normas aplicables
  temperatura_c: number
  aislamiento_tecnico: string        // "PVC", "HFFR", "XLPE+HFFR"

  // CAPA FABRICANTES (nombres comerciales por marca)
  nombres_fabricantes: {
    INDECO?: string
    CELSA?: string
    ELCOPE?: string
    MIGUELEZ?: string
    NEXANS?: string                  // para mercados donde opera directamente
  }

  // CAPA SEO / GRAPH
  aliases_busqueda_peru: string[]    // keywords reales del mercado peruano
  busquedas_mensuales_aprox: string  // referencia de volumen Google Ads Perú

  // CLASIFICACIÓN
  familia: string
  subfamilia: string

  // NOTAS TÉCNICAS
  notas: string
  reemplaza_a?: string               // tipo que reemplaza (para graph)
  reemplazado_por?: string           // tipo que lo reemplazó
}

export const CABLE_NOMENCLATURE: Record<string, CableDefinicion> = {

  // ── CONSTRUCCIÓN ──────────────────────────────────────────────────────────

  "TW-80": {
    tipo_mercado_peru: "TW-80",
    descripcion_mercado: "Cable de cobre con aislamiento PVC para instalaciones fijas en edificaciones. El más comercial en Perú.",

    tipo_tecnico_ntp: "TW-70",        // la norma dice 70°C, el mercado adoptó 80°C
    codigo_iec: "60227 IEC 01",
    norma_producto: ["NTP 370.252", "UL 83"],
    temperatura_c: 80,
    aislamiento_tecnico: "PVC",

    nombres_fabricantes: {
      INDECO: "TW-80 +PLUS",
      CELSA: "TW-80",                 // lanzado recientemente
      ELCOPE: "Cable TW 450/750V",
      MIGUELEZ: "H07V-R",
    },

    aliases_busqueda_peru: [
      "cable tw", "cable tw 14", "cable tw 12", "cable tw 10", "cable tw 8",
      "alambre tw", "cable tw 80", "cable tw indeco", "cable tw celsa",
      "cable pvc 450v", "cable de luz", "cable numero 14", "cable numero 12",
      "tw 14 indeco", "tw 12 indeco", "cable tw 14 precio",
      "cable tw 14 awg", "cable tw 12 awg", "cable tw electrico",
    ],
    busquedas_mensuales_aprox: "5,000+ (cable indeco 14, cable indeco 12)",

    familia: "construccion",
    subfamilia: "tw",
    notas: "La norma NTP 370.252 dice TW-70, pero Indeco y CELSA fabrican y etiquetan como TW-80. El mercado peruano adoptó TW-80 como estándar de facto. Clasificar siempre como TW-80 en el graph.",
  },

  "THW-90": {
    tipo_mercado_peru: "THW-90",
    descripcion_mercado: "Cable de cobre con aislamiento PVC para instalaciones en ambientes húmedos. Mayor ampacidad que TW-80.",

    tipo_tecnico_ntp: "THW-75",       // norma base 75°C, mercado lo usa a 90°C
    codigo_iec: "60227 IEC 02",
    norma_producto: ["NTP 370.252", "UL 83"],
    temperatura_c: 90,
    aislamiento_tecnico: "PVC_low_smoke",

    nombres_fabricantes: {
      INDECO: "THW-90 +PLUS",
      CELSA: "THW-90",
      ELCOPE: "Cable THW 450/750V",
    },

    aliases_busqueda_peru: [
      "cable thw", "cable thw 14", "cable thw 12", "cable thw 10",
      "cable thw 90", "cable thw indeco", "cable thw celsa",
      "thw 14 indeco", "thw 12 indeco", "cable thw precio",
      "cable thw rojo", "cable thw negro", "cable thw awg",
    ],
    busquedas_mensuales_aprox: "1,000-5,000",

    familia: "construccion",
    subfamilia: "thw",
    notas: "Reemplaza TW-80 en ambientes húmedos. La norma base es 75°C pero el mercado peruano opera con 90°C como estándar.",
  },

  "NH": {
    tipo_mercado_peru: "NH",
    descripcion_mercado: "Cable de cobre libre de halógenos para instalaciones en locales públicos, comerciales y con riesgo de incendio. No emite gases tóxicos al quemarse.",

    tipo_tecnico_ntp: "LSOH",         // nombre técnico correcto
    codigo_iec: "H07Z1-R (CL2) / H07Z1-U (CL1)",
    norma_producto: ["NTP 370.266-3-31", "NTP 370.252", "IEC 60332-3-24"],
    temperatura_c: 90,
    aislamiento_tecnico: "HFFR",

    nombres_fabricantes: {
      INDECO: "PC NH-90",             // PC = línea Practicable de Indeco
      CELSA: "LSOH NH",
      ELCOPE: "Alambre LSOH",
      MIGUELEZ: "Afirenas H07Z1-R",
    },

    aliases_busqueda_peru: [
      "cable nh", "cable nh 80", "cable nh 90", "cable nh indeco",
      "cable nh 1.5", "cable nh 2.5", "cable nh 4mm2", "cable nh 6mm2",
      "cable nh 80 indeco", "cable nh 90 indeco", "alambre nh",
      "cable libre halogenos", "cable lsoh", "cable nh 80 4mm2",
      "pc nh-90", "cable nh precio", "cable nh celsa",
    ],
    busquedas_mensuales_aprox: "100-1,000 (NH), 10-100 (LSOH indeco)",

    familia: "construccion",
    subfamilia: "nh",
    notas: "NH es el nombre de mercado en Perú. Técnicamente es LSOH/H07Z1-R. 'PC' en PC NH-90 de Indeco significa línea Practicable — no es denominación técnica. El graph usa 'NH' como tipo_mercado_peru porque así lo busca y conoce el mercado peruano. Las búsquedas de 'lsoh indeco' son 10-100/mes vs 'cable nh 80' 100-1000/mes.",
  },

  // ── ENERGÍA BT ────────────────────────────────────────────────────────────

  "N2XOH": {
    tipo_mercado_peru: "N2XOH",
    descripcion_mercado: "Cable de energía con aislamiento XLPE y cubierta libre de halógenos para distribución en baja tensión. Reemplazó al NYY en el mercado peruano.",

    tipo_tecnico_ntp: "N2XOH",        // coincide en norma y mercado
    codigo_iec: "IEC 60502-1",
    norma_producto: ["NTP-IEC 60502-1", "IEC 60228"],
    temperatura_c: 90,
    aislamiento_tecnico: "XLPE + cubierta HFFR",

    nombres_fabricantes: {
      INDECO: "N2XOH 0.6/1kV",
      CELSA: "N2XOH",
      MIGUELEZ: "RZ1-K",
    },

    aliases_busqueda_peru: [
      "cable n2xoh", "cable n2xoh tripolar", "cable n2xoh indeco",
      "n2xoh 3x10", "n2xoh 3x16", "n2xoh 3x25", "n2xoh 3x35",
      "n2xoh 3x50", "n2xoh 3x70", "cable energia libre halogenos",
      "cable xlpe libre halogenos", "cable n2xoh precio",
    ],
    busquedas_mensuales_aprox: "100-1,000",

    familia: "energia_bt",
    subfamilia: "n2xoh",
    reemplaza_a: "NYY",
    notas: "Reemplazó al NYY en el mercado peruano. XLPE (aislamiento) + HFFR (cubierta). Denominación técnica coincide con nombre de mercado — no hay ambigüedad.",
  },

  "NYY": {
    tipo_mercado_peru: "NYY",
    descripcion_mercado: "Cable de energía con aislamiento y cubierta PVC. Legacy — ya no es comercial en Perú, reemplazado por N2XOH. Se mantiene en catálogo por búsquedas históricas.",

    tipo_tecnico_ntp: "NYY",
    codigo_iec: "IEC 60502-1",
    norma_producto: ["NTP-IEC 60502-1"],
    temperatura_c: 80,
    aislamiento_tecnico: "PVC + cubierta PVC",

    nombres_fabricantes: {
      INDECO: "NYY",
      CELSA: "NYY",
    },

    aliases_busqueda_peru: [
      "cable nyy", "cable nyy tripolar", "cable nyy indeco",
      "nyy 3x10", "nyy 3x16", "nyy 3x25", "cable nyy precio",
      "cable nyy enterrado",
    ],
    busquedas_mensuales_aprox: "100-1,000",

    familia: "energia_bt",
    subfamilia: "nyy",
    reemplazado_por: "N2XOH",
    notas: "Legacy. Ya no es comercial en Peru — fabricantes lo reemplazaron por N2XOH. Se mantiene en el graph porque la gente sigue buscándolo y el graph debe responder con N2XOH como sustituto.",
  },

  "N2XY": {
    tipo_mercado_peru: "N2XY",
    descripcion_mercado: "Cable de energía con aislamiento XLPE y cubierta PVC. Alternativa a N2XOH sin libre de halógenos.",

    tipo_tecnico_ntp: "N2XY",
    codigo_iec: "IEC 60502-1",
    norma_producto: ["NTP-IEC 60502-1"],
    temperatura_c: 90,
    aislamiento_tecnico: "XLPE + cubierta PVC",

    nombres_fabricantes: {
      INDECO: "N2XY",
      CELSA: "N2XY",
    },

    aliases_busqueda_peru: [
      "cable n2xy", "cable xlpe pvc", "n2xy tripolar",
      "cable n2xy indeco", "cable n2xy precio",
    ],
    busquedas_mensuales_aprox: "10-100",

    familia: "energia_bt",
    subfamilia: "n2xy",
    notas: "XLPE + cubierta PVC. Menos común que N2XOH en el mercado peruano.",
  },

  "RV-K": {
    tipo_mercado_peru: "RV-K",
    descripcion_mercado: "Cable flexible de energía con aislamiento XLPE y cubierta PVC. Origen europeo, presente en proyectos industriales en Perú.",

    tipo_tecnico_ntp: "RV-K",
    codigo_iec: "UNE 21123-2",
    norma_producto: ["UNE 21123-2"],
    temperatura_c: 90,
    aislamiento_tecnico: "XLPE + cubierta PVC",

    nombres_fabricantes: {
      MIGUELEZ: "RV-K",
      CELSA: "RV-K",
    },

    aliases_busqueda_peru: [
      "cable rv-k", "cable rvk", "cable rv-k flexible",
      "cable rv-k precio", "cable rv-k miguelez",
    ],
    busquedas_mensuales_aprox: "10-100",

    familia: "energia_bt",
    subfamilia: "rv-k",
    notas: "Origen norma española UNE. Presente en proyectos industriales. Menos común que N2XOH.",
  },

  // ── FLEXIBLES ─────────────────────────────────────────────────────────────

  "NLT": {
    tipo_mercado_peru: "NLT",
    descripcion_mercado: "Cable vulcanizado flexible para equipos móviles y aparatos domésticos. El más comercial en cables flexibles en Perú.",

    tipo_tecnico_ntp: "TTRF-70",
    codigo_iec: "60227 IEC 53",
    norma_producto: ["NTP 370.252", "IEC 60227-5"],
    temperatura_c: 70,
    aislamiento_tecnico: "PVC flexible",

    nombres_fabricantes: {
      INDECO: "PRACTICABLE TTRF-70 (NLT-PC)",
      ELCOPE: "Cable NLT",
      CELSA: "NLT",
    },

    aliases_busqueda_peru: [
      "cable nlt", "cable vulcanizado", "cable nlt 2x14",
      "cable nlt 3x14", "cable nlt 2x16", "cable nlt indeco",
      "cable practicable", "cable ttrf", "cable flexible 2x14",
    ],
    busquedas_mensuales_aprox: "100-1,000",

    familia: "flexible",
    subfamilia: "vulcanizado",
    notas: "NLT es el nombre de mercado en Peru. Técnicamente TTRF-70 / 60227 IEC 53. 'PC' en el nombre de Indeco significa Practicable — no es denominación técnica. El vulcanizado se vende más que el mellizo.",
  },

  "CTM": {
    tipo_mercado_peru: "CTM",
    descripcion_mercado: "Cable mellizo o paralelo para uso doméstico. Menos comercial que el NLT en Perú.",

    tipo_tecnico_ntp: "SPT",
    codigo_iec: "60227 IEC 41",
    norma_producto: ["NTP 370.252"],
    temperatura_c: 60,
    aislamiento_tecnico: "PVC",

    nombres_fabricantes: {
      INDECO: "CTM",
      ELCOPE: "Cable mellizo",
    },

    aliases_busqueda_peru: [
      "cable mellizo", "cable ctm", "cable paralelo",
      "cable mellizo 2x14", "cable mellizo indeco",
    ],
    busquedas_mensuales_aprox: "10-100",

    familia: "flexible",
    subfamilia: "mellizo",
    notas: "Menos comercial que NLT. CTM = Cable Tipo Mellizo.",
  },

  "GPT": {
    tipo_mercado_peru: "GPT",
    descripcion_mercado: "Cable automotriz flexible. Muy usado en cableado interno de tableros eléctricos en Perú.",

    tipo_tecnico_ntp: "GPT",
    codigo_iec: null,
    norma_producto: ["NTP 370.252", "SAE J1128"],
    temperatura_c: 80,
    aislamiento_tecnico: "PVC",

    nombres_fabricantes: {
      INDECO: "GPT",
      CELSA: "GPT",
      ELCOPE: "GPT",
    },

    aliases_busqueda_peru: [
      "cable gpt", "cable automotriz", "cable gpt 14",
      "cable gpt 16", "cable tablero electrico",
      "cable control tablero", "cable gpt indeco",
    ],
    busquedas_mensuales_aprox: "100-1,000",

    familia: "flexible",
    subfamilia: "automotriz",
    notas: "Muy comercial en Perú para cableado de tableros. El técnico peruano lo llama 'cable automotriz' o 'cable GPT'.",
  },

  "WS": {
    tipo_mercado_peru: "WS",
    descripcion_mercado: "Cable de soldadura flexible de alta corriente.",

    tipo_tecnico_ntp: "WS",
    codigo_iec: null,
    norma_producto: ["NTP 370.252"],
    temperatura_c: 90,
    aislamiento_tecnico: "Neopreno / caucho vulcanizado",

    nombres_fabricantes: {
      INDECO: "WS",
      ELCOPE: "Cable soldadura",
    },

    aliases_busqueda_peru: [
      "cable soldadura", "cable ws", "cable para soldar",
      "cable soldador", "cable ws 1/0",
    ],
    busquedas_mensuales_aprox: "10-100",

    familia: "flexible",
    subfamilia: "soldadura",
    notas: "Alta flexibilidad. Para equipos de soldadura eléctrica.",
  },

  "SGT": {
    tipo_mercado_peru: "SGT",
    descripcion_mercado: "Cable para batería de automóvil y sistemas de arranque.",

    tipo_tecnico_ntp: "SGT",
    codigo_iec: null,
    norma_producto: [],
    temperatura_c: 80,
    aislamiento_tecnico: "PVC",

    nombres_fabricantes: {
      INDECO: "SGT",
    },

    aliases_busqueda_peru: [
      "cable bateria", "cable sgt", "cable arranque auto",
      "cable bateria carro",
    ],
    busquedas_mensuales_aprox: "10-100",

    familia: "flexible",
    subfamilia: "bateria",
    notas: "Para sistemas de batería automotriz.",
  },

  // ── SOLAR ─────────────────────────────────────────────────────────────────

  "SOLAR_DC": {
    tipo_mercado_peru: "Cable Solar",
    descripcion_mercado: "Cable fotovoltaico para instalaciones solares DC. Resistente a UV, doble aislamiento, vida útil 30 años.",

    tipo_tecnico_ntp: null,
    codigo_iec: "H1Z2Z2-K / EN 50618",
    norma_producto: ["EN 50618", "IEC 62930"],
    temperatura_c: 90,
    aislamiento_tecnico: "XLPE doble capa resistente UV",

    nombres_fabricantes: {
      INDECO: "Cable Solar FV",
      CELSA: "Cable Solar",
      MIGUELEZ: "ZZ-F (AS)",
    },

    aliases_busqueda_peru: [
      "cable solar", "cable fotovoltaico", "cable panel solar",
      "cable solar 4mm2", "cable solar 6mm2", "cable solar 10mm2",
      "cable dc solar", "cable solar indeco", "cable solar precio peru",
      "cable pv", "cable solar rojo negro",
    ],
    busquedas_mensuales_aprox: "100-1,000 (creciendo rápido)",

    familia: "solar",
    subfamilia: "solar_dc",
    notas: "Mercado creciendo en Peru con expansión de energía solar. Conductor cobre estañado CL5, tensión DC 600-1500V, secciones comerciales: 4, 6, 10, 16mm². Certificación TÜV es diferenciador clave.",
  },

  // ── DATOS Y SEÑAL ─────────────────────────────────────────────────────────

  "UTP_CAT6": {
    tipo_mercado_peru: "UTP Cat6",
    descripcion_mercado: "Cable de datos para redes Ethernet. El más comercial en instalaciones de datos en Perú.",

    tipo_tecnico_ntp: null,
    codigo_iec: "ISO/IEC 11801",
    norma_producto: ["ISO/IEC 11801", "TIA-568"],
    temperatura_c: 60,
    aislamiento_tecnico: "PVC / LSOH",

    nombres_fabricantes: {},

    aliases_busqueda_peru: [
      "cable utp", "cable utp cat6", "cable red", "cable ethernet",
      "cable internet", "cable utp cat5e", "cable utp precio",
      "cable red cat6", "cable patch",
    ],
    busquedas_mensuales_aprox: "1,000-5,000",

    familia: "datos_senal",
    subfamilia: "utp",
    notas: "Cat5e y Cat6 son los más comerciales. Cat6 está reemplazando a Cat5e.",
  },

  "FPL": {
    tipo_mercado_peru: "Cable Contraincendios",
    descripcion_mercado: "Cable para sistemas de detección y alarma contra incendios. Norma NFPA 72.",

    tipo_tecnico_ntp: null,
    codigo_iec: null,
    norma_producto: ["NFPA 72", "UL 83"],
    temperatura_c: 60,
    aislamiento_tecnico: "PVC / LSOH",

    nombres_fabricantes: {},

    aliases_busqueda_peru: [
      "cable incendio", "cable contraincendios", "cable fpl",
      "cable alarma incendio", "cable fplr", "cable deteccion incendio",
      "cable sistema alarma",
    ],
    busquedas_mensuales_aprox: "10-100",

    familia: "datos_senal",
    subfamilia: "incendio",
    notas: "FPL para interior, FPLR para riser. Mercado nicho pero constante en edificios comerciales.",
  },

  // ── DESNUDOS ──────────────────────────────────────────────────────────────

  "DESNUDO_TEMPLE_BLANDO": {
    tipo_mercado_peru: "Cobre desnudo temple blando",
    descripcion_mercado: "Conductor de cobre desnudo para puesta a tierra y líneas de distribución.",

    tipo_tecnico_ntp: null,
    codigo_iec: "IEC 60228 CL2",
    norma_producto: ["NTP 370.250", "ASTM B8"],
    temperatura_c: 75,
    aislamiento_tecnico: "Sin aislamiento",

    nombres_fabricantes: {
      INDECO: "Alambre desnudo recocido",
      ELCOPE: "Alambre desnudo CL2",
    },

    aliases_busqueda_peru: [
      "cable desnudo", "cobre desnudo", "cable tierra desnudo",
      "alambre desnudo", "cable puesta tierra", "cobre recocido",
    ],
    busquedas_mensuales_aprox: "10-100",

    familia: "construccion",
    subfamilia: "desnudo",
    notas: "CL2 cableado (temple blando). Para puesta a tierra y acometidas.",
  },

}

// ============================================================
// FUNCIÓN DE NORMALIZACIÓN
// Recibe cualquier nombre/código y devuelve la clave del diccionario
// ============================================================
export function normalizarTipoCable(input: string): string | null {
  const s = input.toUpperCase().trim()

  // Orden importa — verificar más específico primero
  if (s.includes("N2XOH")) return "N2XOH"
  if (s.includes("N2XY") && !s.includes("N2XOH")) return "N2XY"
  if (s.includes("NYY") && !s.includes("N2X")) return "NYY"
  if (s.includes("RV-K") || s.includes("RVK")) return "RV-K"
  if (s.includes("THW")) return "THW-90"
  if ((s.includes("TW") && !s.includes("THW") && !s.includes("THWN"))) return "TW-80"
  if (s.includes("NH") || s.includes("LSOH") || s.includes("LSHF") || s.includes("H07Z1")) return "NH"
  if (s.includes("HFFR") && !s.includes("N2X")) return "NH"
  if (s.includes("NLT") || s.includes("TTRF") || s.includes("PRACTICABLE")) return "NLT"
  if (s.includes("CTM") || s.includes("MELLIZO") || s.includes("PARALELO")) return "CTM"
  if (s.includes("GPT") || s.includes("AUTOMOTRIZ")) return "GPT"
  if (s.includes("WS") || s.includes("SOLDADURA")) return "WS"
  if (s.includes("SGT") || s.includes("BATERIA") || s.includes("BATERÍA")) return "SGT"
  if (s.includes("SOLAR") || s.includes("FOTOVOLTAIC") || s.includes("H1Z2Z2") || s.includes("ZZ-F")) return "SOLAR_DC"
  if (s.includes("UTP") || s.includes("CAT5") || s.includes("CAT6") || s.includes("ETHERNET")) return "UTP_CAT6"
  if (s.includes("FPL") || s.includes("INCENDIO") || s.includes("CONTRAINCENDIO")) return "FPL"
  if (s.includes("DESNUDO") || s.includes("RECOCIDO")) return "DESNUDO_TEMPLE_BLANDO"

  return null
}

// ============================================================
// FUNCIÓN UTILITARIA
// Dado un tipo normalizado, devuelve sus aliases para el graph
// ============================================================
export function getAliasesPorTipo(tipoClave: string): string[] {
  return CABLE_NOMENCLATURE[tipoClave]?.aliases_busqueda_peru ?? []
}

// ============================================================
// TABLA AWG → mm² (para normalización de secciones)
// ============================================================
export const AWG_TO_MM2: Record<string, number> = {
  "18": 0.82,
  "16": 1.31,
  "14": 2.08,
  "12": 3.31,
  "10": 5.26,
  "8":  8.37,
  "6":  13.3,
  "4":  21.2,
  "2":  33.6,
  "1":  42.4,
  "1/0": 53.5,
  "2/0": 67.4,
  "3/0": 85.0,
  "4/0": 107.2,
  "300": 152.0,
  "350": 177.0,
  "400": 203.0,
  "500": 253.0,
}

export const MM2_TO_AWG: Record<string, string> = {
  "0.82": "18",
  "1.31": "16",
  "1.5":  "~15 (no AWG estándar)",
  "2.08": "14",
  "2.5":  "~13 (no AWG estándar)",
  "3.31": "12",
  "4":    "~11 (no AWG estándar)",
  "5.26": "10",
  "6":    "~9 (no AWG estándar)",
  "8.37": "8",
  "10":   "~7 (no AWG estándar)",
  "13.3": "6",
  "16":   "~5 (no AWG estándar)",
  "21.2": "4",
  "25":   "~3 (no AWG estándar)",
  "33.6": "2",
  "35":   "~1.5 (no AWG estándar)",
  "42.4": "1",
  "50":   "~1/0 aprox",
  "53.5": "1/0",
  "67.4": "2/0",
  "85.0": "3/0",
  "95":   "~3/0 aprox",
  "107.2": "4/0",
  "120":  "~4/0 aprox",
  "152.0": "300 MCM",
  "177.0": "350 MCM",
}
