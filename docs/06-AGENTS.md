# STARLOGIC — Agentes y Automatización

---

## Pipeline de Extracción PDF (Claude API)

**Qué hace:** Parsea fichas técnicas PDF de conductores eléctricos y extrae datos estructurados en formato JSON.

**Ruta:** `POST /api/pipeline/extract`

| Campo | Valor |
|-------|-------|
| Modelo | `claude-sonnet-4-5` |
| Input | PDF (max 20MB, `application/pdf`) + `fabricante` (hint) + `tipo_cable` (hint) |
| Output | `ExtraccionResult` JSON con `PRODUCTO_CORE + VARIANTES[] + EXTENSIONES_DINAMICAS + GRAPH_RELATIONS` |
| Costo aproximado | $0.01–0.03 por ficha |
| Latencia | 15–45 segundos según PDF |

### Flujo interno

```
PDF recibido en /api/pipeline/extract
  → Verificar token Firebase (claim admin:true)
  → Validar: tipo application/pdf, tamaño ≤ 20MB, no vacío
  → Convertir PDF a base64
  → Llamar Claude API:
      system: SYSTEM_PROMPT (schema completo de conductores)
      user:   PDF (document block) + "fabricante: X, tipo_cable: Y"
  → Parsear JSON de respuesta (limpiar markdown fences si los hay)
  → Validar estructura mínima: PRODUCTO_CORE + VARIANTES[]
  → Si JSON inválido: fallback con confidence_score=0.1
  → Calcular confidence_score (promedio de data_quality de CORE + VARIANTES)
  → Normalizar tipo_cable con normalizarTipoCable()
  → INSERT pipeline_candidatos (status='pending', raw_json inmutable)
  → Retornar { candidato_id, confidence_score, variantes_count, parse_error }
```

### Schema JSON de salida (ExtraccionResult)

Ver `DOCUMENTACION-v2.md → Estructura del JSON extraído por Claude` para el schema completo.

Campos clave:
- `PRODUCTO_CORE` — datos del producto: nombre, fabricante, tipo, normas, aliases, propiedades
- `VARIANTES[]` — array de calibres: sección, ampacidad, diámetros, pesos, resistencia
- `EXTENSIONES_DINAMICAS` — campos adicionales por aplicación (minería, solar, control)
- `GRAPH_RELATIONS` — relaciones del graph: equivalencias, reemplazos, compatibilidades

**No modificar esta estructura sin revisión explícita.** Ver `DOCUMENTACION-v2.md → DECISIÓN IRREVOCABLE #7`.

### Limitaciones conocidas

- No valida datos técnicos — el operador debe verificar que los valores extraídos sean correctos
- Puede confundir nomenclatura si el PDF mezcla estándares (NTP, IEC, AWG)
- No accede a internet ni a fuentes externas durante la extracción
- La temperatura del modelo introduce variación: el mismo PDF puede dar resultados ligeramente distintos en cada extracción
- PDFs escaneados (imagen) tienen menor precisión que PDFs vectoriales

### SYSTEM_PROMPT

Generado automáticamente en `src/lib/pipeline/schemas.ts` a partir del `STARLOGIC_SCHEMA` (schema de referencia completo TW-80 INDECO). El prompt se actualiza automáticamente si se modifica el schema. Ver el archivo para el contenido completo.

---

## Sistema de Keywords SEO (sin IA)

**Qué hace:** Sugiere aliases de búsqueda para productos del pipeline basándose en datos reales de Google Keyword Planner. **Sin IA, sin APIs externas, costo $0.**

**Rutas:**
- `POST /api/pipeline/keywords/upload` — carga CSV de KWP
- `GET /api/pipeline/keywords/upload` — estadísticas de keywords cargadas
- `GET /api/pipeline/keywords/suggest` — sugerencias para un tipo de cable

### Por qué sin IA (ADR-005)

Claude inventaba volúmenes de búsqueda. Sugirió "cable tw libre de halógenos" para TW-80, que es PVC no LSOH — incorrecto técnicamente. Los datos reales de Keyword Planner son verificables y no tienen costo por consulta.

### Flujo de carga

```
Operador exporta CSV de Google Keyword Planner
  → Formato: UTF-16 LE con BOM, separador tab, 3 filas de header
  → /admin/pipeline/keywords → Subir CSV → Seleccionar tipo de cable
  → Cliente lee ArrayBuffer, detecta BOM (0xFF 0xFE), decodifica con TextDecoder
  → POST /api/pipeline/keywords/upload → parsea columnas:
      [0] Keyword
      [2] Avg. monthly searches  (rangos "100-1,000" → lower bound 100)
      [3] Cambio en tres meses
      [4] Cambio interanual
      [5] Competition
  → Upsert a keyword_stats con onConflict: 'keyword,tipo_cable'
```

### Flujo de sugerencias

```
GET /api/pipeline/keywords/suggest?tipo_cable=TW-80&existing_aliases=cable+tw
  → Consultar keyword_stats WHERE tipo_cable='TW-80' AND avg_monthly_searches >= 50
  → Filtrar: excluir existing_aliases, excluir change_yoy <= -50%
  → Filtro de relevancia (4 pasos):
      1. GENERIC_BRAND_TERMS exacto → incluir como 'generica' (bypass)
      2. Término de otro tipo de cable → excluir
      3. Término del tipo solicitado → 'directa'
      4. GENERIC_BLOCKERS → excluir; si no → 'generica'
  → Scoring compuesto (ver tabla abajo)
  → Ordenar por score DESC
  → Top 3 por score → forzado a 'core' (independiente de calibre)
  → Resto: CALIBRE_RE → 'core' (sin calibre) o 'variante' (con calibre)
  → Slice: max_core (default 10) + max_variante (default 8)
  → Retornar { core: SuggestionItem[], variante: SuggestionItem[], total_keywords_db }
```

### Scoring compuesto

| Componente | Peso | Puntos |
|------------|------|--------|
| Volumen (`avg_monthly_searches`) | 50% | ≥5000→50, ≥1000→40, ≥500→30, ≥100→20, ≥50→10 |
| Competencia (`competition`) | 25% | Baja→25, Media→15, Alta→5, null→10 |
| Tendencia (`change_yoy`) | 25% | ≥0%→25, hasta -30%→15, hasta -60%→5, peor→0 |
| Bonus `change_3m` positivo | +5 pts | |
| Penalty `change_3m` ≤ -50% | -5 pts | |
| Bonus relevancia `directa` | +20 pts | |

**Rango típico:** 10–120+ puntos.

### Tipos exportados

```typescript
// src/app/api/pipeline/keywords/suggest/route.ts
interface SuggestionItem {
  keyword:              string;
  avg_monthly_searches: number;
  competition:          string | null;  // 'Baja' | 'Media' | 'Alta' | null
  change_3m:            string | null;
  change_yoy:           string | null;
  priority:             'alta' | 'media' | 'baja';
  tipo:                 'core' | 'variante';
  relevancia:           'directa' | 'generica';
  score:                number;
}
```

### Limitaciones conocidas

- Solo tiene sugerencias para los tipos de cable con CSV cargado
- El filtro de relevancia depende del diccionario `cable-nomenclature.ts` — si un tipo no está en el diccionario, el filtro de excluidos/propios no funciona
- Los datos de Keyword Planner tienen ~1 mes de retraso
- `GENERIC_BLOCKERS` es una lista hardcodeada — puede necesitar actualizarse si aparecen nuevos tipos de cable no cubiertos por el diccionario
