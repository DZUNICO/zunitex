# STARLOGIC — Contexto de Sesión

> Lectura: 5 minutos. Suficiente para tomar cualquier decisión técnica o estratégica.

---

## Identidad del proyecto

**STARLOGIC** es la capa de inteligencia técnica del mercado eléctrico peruano — un industrial graph que captura el conocimiento tácito del mercado (equivalencias, sustituciones, nomenclatura real) que no existe en ninguna fuente pública. No es ecommerce, comunidad ni contenido. El activo es el graph.

**Stack:** Next.js 16 + TypeScript · Firebase Auth + Firestore (social) · Supabase PostgreSQL (catálogo + pipeline) · Vercel · Claude API (extracción de PDFs)  
**Repo:** github.com/DZUNICO/zunitex · **Producción:** starlogic.vercel.app · **Supabase:** cnjvtzwsqzzvqfdbaisv.supabase.co  
**Flujo de trabajo:** Claude.ai web → análisis y prompts → Claude Code en VS Code → commits y push. Claude web nunca toca el repo directamente (ADR-007).

---

## Principios Fundamentales

> Leyes, no sugerencias. Solo cambian con decisión explícita de Diego Zuni.

### 1. EL CONOCIMIENTO QUE NO ESTÁ EN EL GRAPH SE PIERDE.
Todo lo que Diego sabe del mercado eléctrico peruano que no está en el graph muere con la conversación. Documentar antes de olvidar no es opcional.

### 2. EL GRAPH ES EL ACTIVO. TODO LO DEMÁS ES SOPORTE.
SEO, IA, catálogo, agentes, pipeline — todo existe para enriquecer el graph. Si una decisión no fortalece el graph, no se toma.

### 3. DATOS REALES SOBRE DATOS GENERADOS.
Un dato verificable vale más que mil datos generados por IA. La IA extrae y estructura. No inventa, no estima, no rellena.

### 4. EL MERCADO HABLA DISTINTO A LA NORMA TÉCNICA.
El graph habla el idioma del mercado peruano. Las normas son metadata. El mercado es la fuente de verdad para nomenclatura, nombres y equivalencias.

### 5. LA IA ACELERA. NO ES EL MOAT.
El moat es el conocimiento tácito del mercado eléctrico peruano acumulado en el graph. Cualquier competidor con capital puede usar la misma IA. No pueden copiar el graph.

### 6. STARLOGIC NO ES ECOMMERCE. NO ES COMUNIDAD. NO ES CONTENIDO.
Es infraestructura de datos e inteligencia técnica. La monetización surge del valor del graph, no del volumen de transacciones ni del tráfico de contenido.

### 7. UN NODO NUNCA SE ELIMINA.
Los productos descontinuados se marcan como tales y se documentan sus relaciones históricas. El graph tiene memoria permanente porque el mercado tiene historia.

### 8. ESPECIALIZACIÓN ANTES QUE AMPLITUD.
Mejor ser la referencia definitiva del mercado eléctrico peruano que un catálogo mediocre de todo LATAM. La expansión geográfica y de categoría viene después de la profundidad.

### 9. SEO ES ADQUISICIÓN. NO ES PRODUCTO.
El tráfico orgánico valida que el problema existe y trae usuarios al graph. No se optimiza para tráfico a costa de la calidad del graph.

### 10. LA SEÑAL QUE IMPORTA ES EL REGRESO.
Un usuario que regresa semanalmente sin ser invitado vale más que mil usuarios que llegan una vez desde Google. Optimizar para uso real, no para métricas de vanidad.

### 11. NO CONSTRUIR SIN EVIDENCIA.
Ninguna feature se construye por intuición o por petición de un solo usuario. Evidencia mínima: tráfico orgánico verificado, usuario recurrente documentado, o dato de mercado concreto.

### 12. EL CONOCIMIENTO TÁCITO DEL FUNDADOR ES IRREPLICABLE.
Lo que Diego sabe — que NH-80 y NHX-90 son hoy NH-90, que el mercado dice "alambre" para algo que ya no se fabrica, que "corriente al aire" no significa "a la intemperie" — no está en ningún manual. Debe estar en el graph.

---

## Decisiones de Arquitectura (ADR)

> Antes de modificar cualquier decisión IRREVOCABLE, consultar con Diego Zuni. Si una acción contradice un ADR, reportar antes de proceder.

---

### ADR-001: Atributos en JSONB, nunca columnas individuales
**Estado: IRREVOCABLE** · Mayo 2026

Todos los atributos específicos van en `atributos jsonb` de `productos_catalogo`. Nunca agregar columnas individuales para atributos de producto, sin importar cuántos productos o categorías existan. Aplica para cables, breakers, transformadores, conduit, y cualquier categoría futura.

Descartado: (1) columnas individuales — inmantenible; (2) tabla por categoría — rompe el modelo unificado del graph.

**Costo de revertir:** migración de todos los productos, reescritura del pipeline, invalidación de todas las queries del catálogo.

---

### ADR-002: Cada variante es una fila separada en productos_catalogo
**Estado: IRREVOCABLE** · Junio 2026 · **IMPLEMENTACIÓN PENDIENTE**

El pipeline de aprobación debe insertar N filas en `productos_catalogo` — una por variante. No 1 fila con variantes embebidas.
- Slugs incluyen calibre: `indeco-nh-90-2-5mm2-libre-halogeno`
- `producto_padre_id` y `variante_id` van dentro de `atributos jsonb`, no como columnas

Descartado: 1 fila con variantes embebidas — impide filtrar por calibre, impide pricing individual, rompe el modelo donde cada SKU es un nodo.

**⚠️ Estado actual:** el `POST /api/pipeline/approve` aún inserta 1 fila. Los 3 conductores aprobados (NH-90, TW-80, THW-90) deben re-procesarse después del fix.

**Costo de revertir:** reescritura del approve route, migración de conductores existentes, rediseño del catálogo y portal de proveedores.

---

### ADR-003: raw_json es inmutable
**Estado: IRREVOCABLE** · Mayo 2026

`raw_json` se escribe una sola vez al extraer el PDF. Nunca se modifica. `edited_json` es la copia editable del operador. `final_json` es lo que se aprueba e inserta.

**Costo de revertir:** pérdida de trazabilidad de auditoría.

---

### ADR-004: FTS en 3 capas — no simplificar
**Estado: IRREVOCABLE** · Mayo 2026

La búsqueda del catálogo usa 3 capas en orden:
1. Query es código numérico → buscar por `codigo_fabricante`
2. FTS con `textSearch('search_vector', query, {type:'plain', config:'spanish'})` + variantes de prefijo
3. ILIKE fallback si FTS no devuelve resultados

No simplificar ni reemplazar sin revisión explícita.

---

### ADR-005: Sistema de keywords sin IA
**Estado: ACTIVO** · Junio 2026

El sistema de sugerencia de aliases usa exclusivamente datos reales de Google Keyword Planner subidos por el operador como CSV. Costo: $0. El bot Claude que inventaba volúmenes fue eliminado — sugirió "cable tw libre de halógenos" para TW-80, que es PVC no LSOH.

---

### ADR-006: disponible_peru = false por defecto al aprobar
**Estado: IRREVOCABLE** · Mayo 2026

Al aprobar un candidato, todas las filas se insertan con `disponible_peru = false`. El operador activa manualmente después de verificar precio y disponibilidad real.

---

### ADR-007: Flujo de trabajo Claude web vs Claude Code
**Estado: IRREVOCABLE** · Junio 2026

- Claude.ai web: planificación, análisis, decisiones, prompts para Code.
- Claude Code en VS Code: ejecución de código, commits, push.
- Claude web nunca toca el repo directamente. Todo cambio pasa por Claude Code.

---

## Para profundizar

| Archivo | Cuándo leerlo |
|---------|---------------|
| [00-PRINCIPLES.md](00-PRINCIPLES.md) | Principios completos con contexto extendido |
| [01-VISION.md](01-VISION.md) | Visión completa, qué NO es, por qué Diego Zuni |
| [02-DECISIONS.md](02-DECISIONS.md) | ADRs con referencias y contexto adicional |
| [03-ARCHITECTURE.md](03-ARCHITECTURE.md) | Stack detallado, Cloud Functions, variables de entorno |
| [04-GRAPH.md](04-GRAPH.md) | Tipos de nodos/relaciones, diccionario de nomenclatura |
| [05-SCHEMAS.md](05-SCHEMAS.md) | Schemas completos antes de cualquier query o migración |
| [06-AGENTS.md](06-AGENTS.md) | Pipeline PDF y sistema de keywords — flujos y limitaciones |
| [07-PRODUCT.md](07-PRODUCT.md) | Qué existe, qué está pendiente, qué está descartado |
| [08-ROADMAP.md](08-ROADMAP.md) | Prioridades este mes y Q3 2026 |
| [09-HISTORY.md](09-HISTORY.md) | Errores documentados y lecciones que no deben repetirse |
| [10-OPERATIONS.md](10-OPERATIONS.md) | Variables de entorno, deployment, troubleshooting |
| [00-INDEX.md](00-INDEX.md) | Navegación rápida por tarea específica |
