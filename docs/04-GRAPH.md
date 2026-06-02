# STARLOGIC — El Industrial Graph

---

## Qué es

El Industrial Graph es la red de relaciones entre entidades del mercado eléctrico. No es una base de datos relacional tradicional. Es una estructura donde cada entidad tiene propiedades y cada relación tiene semántica propia.

El graph es el activo principal de STARLOGIC. Ver Principio #2 en `00-PRINCIPLES.md`.

---

## Qué es un nodo

Cada SKU individual es un nodo. No el "tipo de cable NH-90" — sino "INDECO NH-90 2.5mm²" es un nodo. "CELSA NH-90 2.5mm²" es otro nodo distinto.

Un nodo nunca se elimina. Solo se marca como descontinuado. Ver ADR-001 y Principio #7.

---

## Tipos de relaciones

| Relación | Descripción | Ejemplo |
|----------|-------------|---------|
| **EQUIVALENCIA** | Dos productos distintos que pueden usarse indistintamente en la misma aplicación | INDECO TW-80 14AWG ≡ CELSA TW-80 14AWG |
| **SUSTITUCIÓN** | Un producto reemplaza a otro discontinuado | NH-90 sustituye a NH-80 y NHX-90 |
| **COMPATIBILIDAD** | Un producto puede usarse con otro | Terminal tipo ojo compatible con NH-90 4mm² |
| **APLICACIÓN** | Un producto es adecuado para un uso específico | N2XOH para edificaciones críticas con riesgo de incendio |
| **NORMATIVA** | Un producto cumple con una norma específica | NH-90 cumple NTP 370.252, NTP 370.266-3-31 |

---

## Cómo crece el graph

Cada producto aprobado en el pipeline agrega nodos al graph. Cada relación documentada (sustitución, equivalencia, compatibilidad) agrega aristas al graph.

El graph se vuelve más valioso con el tiempo porque las relaciones se acumulan y cada nuevo nodo se conecta con los existentes.

---

## Por qué es difícil de copiar

Un competidor con capital puede copiar el catálogo en semanas. No puede copiar el graph porque el graph contiene conocimiento tácito del mercado que no está en ninguna fuente pública:

- Que NH-80 y NHX-90 son hoy NH-90
- Que el mercado dice "alambre" para algo que ya no se fabrica
- Que el THW-90 8 AWG existe y se vende aunque Nexans no lo incluya en su ficha oficial peruana
- Que "corriente al aire" no significa "a la intemperie"
- Que el cable TW de 7 hilos reemplazó al alambre sólido hace ocho años

Ese conocimiento viene de años de operación en el mercado. Es el moat inicial. Ver Principio #12.

---

## Diccionario de nomenclatura del mercado peruano

El archivo `src/lib/pipeline/cable-nomenclature.ts` contiene el diccionario `CABLE_NOMENCLATURE` — la fuente de verdad de nomenclatura del mercado eléctrico peruano.

**19 tipos documentados:** TW-80, THW-90, NH, N2XOH, NYY, N2XY, RV-K, NLT, CTM, GPT, WS, SGT, SOLAR_DC, UTP_CAT6, FPL, DESNUDO_TEMPLE_BLANDO, NHX-90

Cada entrada tiene:

| Campo | Ejemplo (TW-80) | Propósito |
|-------|-----------------|-----------|
| `tipo_mercado_peru` | `"TW-80"` | Como lo busca el técnico peruano. Clave del diccionario. |
| `tipo_tecnico_ntp` | `"TW-70"` | Denominación oficial INDECOPI/NTP. |
| `codigo_iec` | `"60227 IEC 01"` | Designación IEC para exportación/ingeniería. |
| `nombres_fabricantes` | `{ INDECO: "TW-80 +PLUS", CELSA: "TW-80" }` | Nombres comerciales reales por marca. |
| `aliases_busqueda_peru` | `["cable tw 14", "cable de luz", ...]` | Keywords SEO reales del mercado. |
| `reemplaza_a` | `["TW-70", "alambre TW"]` | Relaciones de sustitución históricas. |

**Función `normalizarTipoCable(input)`:** recibe cualquier string (ej: `"tw"`, `"TW-80 +PLUS"`, `"TTRF-70"`, `"LSOH"`) y retorna la clave del diccionario (ej: `"TW-80"`, `"NH"`) o `null` si no hay match.

---

## Estructura JSON del pipeline (GRAPH_RELATIONS)

El JSON extraído por Claude incluye un campo `GRAPH_RELATIONS` con 4 tipos de relaciones que alimentan el graph:

```json
{
  "GRAPH_RELATIONS": {
    "equivalencias": [...],
    "reemplazos": [...],
    "sustituye_a": [...],
    "compatibilidades": [...]
  }
}
```

Este campo es el corazón del industrial graph. No modificar su estructura sin revisión explícita. Ver `DOCUMENTACION-v2.md → DECISIÓN IRREVOCABLE #7`.

---

## Implementación actual vs visión

| | Hoy | Fase 2 |
|--|-----|--------|
| Nodos | Filas en `productos_catalogo` con `atributos jsonb` | Mismo modelo, más nodos |
| Relaciones | En `GRAPH_RELATIONS` del JSON + diccionario `cable-nomenclature.ts` | Graph consultable en UI |
| Consultas | FTS + filtros SQL | Graph traversal: "qué reemplaza a X", "compatible con Y" |
| UI | Catálogo con búsqueda | Agente de especificación técnica |

La implementación completa del graph como estructura de grafos consultable es trabajo futuro (fase 2–3). El fundamento de datos ya está siendo construido correctamente con el pipeline actual.
