# STARLOGIC — Índice de Documentación

---

## Contexto en 3 líneas

STARLOGIC es la capa de inteligencia técnica del mercado eléctrico peruano. Construye el primer industrial graph latinoamericano. El conocimiento que no está en el graph se pierde.

---

## Si eres Claude Code y vas a hacer un cambio

1. Lee [00-PRINCIPLES.md](00-PRINCIPLES.md) (2 minutos)
2. Lee [02-DECISIONS.md](02-DECISIONS.md) — sección del ADR relevante
3. Lee [05-SCHEMAS.md](05-SCHEMAS.md) — tablas que vas a tocar
4. Verifica que tu cambio no contradiga ningún principio ni ADR

---

## Guías de navegación por tarea

### Si vas a modificar el pipeline de datos
→ [06-AGENTS.md](06-AGENTS.md) → sección Pipeline de Extracción PDF  
→ [05-SCHEMAS.md](05-SCHEMAS.md) → tabla `pipeline_candidatos`  
→ [02-DECISIONS.md](02-DECISIONS.md) → ADR-003 (raw_json inmutable)

### Si vas a tocar el approve route
→ [02-DECISIONS.md](02-DECISIONS.md) → ADR-002 (cada variante = 1 fila)  
→ [DOCUMENTACION-v2.md](../DOCUMENTACION-v2.md) → ⚠️ Cambio pendiente crítico  
→ [09-HISTORY.md](09-HISTORY.md) → error de implementación actual

### Si vas a modificar el catálogo o la búsqueda
→ [05-SCHEMAS.md](05-SCHEMAS.md) → tabla `productos_catalogo`  
→ [03-ARCHITECTURE.md](03-ARCHITECTURE.md) → sección FTS en 3 capas  
→ [02-DECISIONS.md](02-DECISIONS.md) → ADR-001 (atributos en JSONB) + ADR-004 (FTS)

### Si vas a agregar atributos de producto
→ ALTO: [02-DECISIONS.md](02-DECISIONS.md) → ADR-001 — los atributos van en `atributos jsonb`, NUNCA en columnas individuales

### Si vas a trabajar en keywords SEO
→ [06-AGENTS.md](06-AGENTS.md) → sección Sistema de Keywords SEO  
→ [05-SCHEMAS.md](05-SCHEMAS.md) → tabla `keyword_stats`  
→ [02-DECISIONS.md](02-DECISIONS.md) → ADR-005

### Si vas a tocar el graph o nomenclatura
→ [04-GRAPH.md](04-GRAPH.md) — tipos de nodos y relaciones  
→ `src/lib/pipeline/cable-nomenclature.ts` — diccionario del mercado peruano

### Si vas a agregar una feature nueva
→ [00-PRINCIPLES.md](00-PRINCIPLES.md) → Principio #11 (evidencia primero)  
→ [07-PRODUCT.md](07-PRODUCT.md) → verificar que no esté descartada  
→ [08-ROADMAP.md](08-ROADMAP.md) → prioridades actuales

### Si algo no tiene sentido y no entiendes por qué es así
→ [02-DECISIONS.md](02-DECISIONS.md) — buscar el ADR correspondiente  
→ [09-HISTORY.md](09-HISTORY.md) — buscar si hubo un error previo similar

---

## Mapa de archivos

| Archivo | Contenido | Cuándo leerlo |
|---------|-----------|---------------|
| [00-PRINCIPLES.md](00-PRINCIPLES.md) | 12 principios fundamentales — leyes, no sugerencias | Siempre primero |
| [01-VISION.md](01-VISION.md) | Visión del fundador, definición, qué NO es STARLOGIC | Al planificar features o dirección |
| [02-DECISIONS.md](02-DECISIONS.md) | 7 ADRs con contexto completo y costo de revertir | Antes de cambios de arquitectura |
| [03-ARCHITECTURE.md](03-ARCHITECTURE.md) | Stack, flujo de datos, roles, rutas, Cloud Functions | Al entender el sistema |
| [04-GRAPH.md](04-GRAPH.md) | Industrial graph, nodos, relaciones, moat | Al trabajar con el graph o catálogo |
| [05-SCHEMAS.md](05-SCHEMAS.md) | Schemas completos de Supabase y Firebase | Antes de cualquier query |
| [06-AGENTS.md](06-AGENTS.md) | Pipeline PDF y sistema de keywords | Al trabajar con pipeline |
| [07-PRODUCT.md](07-PRODUCT.md) | Qué existe, qué está pendiente, qué está descartado | Al planificar trabajo |
| [08-ROADMAP.md](08-ROADMAP.md) | Este mes, Q3, hitos | Al priorizar |
| [09-HISTORY.md](09-HISTORY.md) | Errores, lecciones, caminos descartados | Al entender decisiones pasadas |
| [10-OPERATIONS.md](10-OPERATIONS.md) | Variables de entorno, deployment, troubleshooting | Al deployar o debuggear |

---

## Documentación de referencia técnica detallada

[DOCUMENTACION-v2.md](../DOCUMENTACION-v2.md) en la raíz del repo se mantiene como referencia técnica completa y changelog histórico de cambios. Los archivos `/docs` son la capa de conocimiento estratégico y de decisiones — están pensados para ser leídos rápido y navegar con claridad.

---

## Regla de oro para agentes

Antes de ejecutar cualquier cambio que afecte schemas, arquitectura o decisiones existentes:

> "¿Hay un ADR en 02-DECISIONS.md que cubra esto?  
> Si lo hay, respétalo.  
> Si contradice lo que voy a hacer, reportar antes de proceder."
