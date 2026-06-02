# STARLOGIC — Registro de Decisiones de Arquitectura (ADR)

Cada decisión aquí documenta qué se decidió, cuándo, por qué, qué alternativas se descartaron y qué cuesta revertirla. Este archivo es la memoria técnica del proyecto.

Antes de modificar cualquier decisión marcada como **IRREVOCABLE**, consultar con Diego Zuni.

---

## ADR-001: Atributos en JSONB, nunca columnas individuales

**Estado:** IRREVOCABLE  
**Fecha:** Mayo 2026

**Contexto:**  
Cada categoría de producto tiene atributos completamente distintos. Cables tienen sección y ampacidad. Breakers tienen polos y poder de corte. Conduit tiene diámetro y material. Una tabla plana con columnas fijas requeriría migraciones constantes y tendría 200+ columnas en 2 años.

**Decisión:**  
Todos los atributos específicos van en el campo `atributos jsonb` de `productos_catalogo`. Nunca agregar columnas individuales para atributos de producto, sin importar cuántos productos o categorías existan. Aplica para cables, breakers, transformadores, conduit, tomacorrientes, terminales, y cualquier categoría futura.

**Alternativas descartadas:**
1. Columnas individuales — descartado por inmantenibilidad.
2. Tabla separada por categoría — descartado por complejidad de joins y por romper el modelo unificado del graph.

**Costo de revertir:**  
Migración de todos los productos existentes, reescritura del pipeline de aprobación, invalidación de todas las queries del catálogo.

**Referencia:** Conversación "STARLOGIC-2", mayo 2026.

---

## ADR-002: Cada variante es una fila separada en productos_catalogo

**Estado:** IRREVOCABLE  
**Fecha:** Junio 2026

**Contexto:**  
Un conductor NH-90 tiene calibres 1.5, 2.5, 4 y 6mm². Un proveedor vende NH-90 2.5mm² a un precio distinto que NH-90 4mm². Son productos distintos con precios distintos. El catálogo debe poder mostrarlos, filtrarlos y pricearlos individualmente.

**Decisión:**  
El pipeline de aprobación inserta N filas en `productos_catalogo` — una por variante. No 1 fila por tipo de cable con variantes embebidas.

- Slugs de variante incluyen el calibre: `indeco-nh-90-2-5mm2-libre-halogeno`
- `producto_padre_id` y `variante_id` van dentro del campo `atributos jsonb`, no como columnas separadas.

**Alternativas descartadas:**  
1 fila por tipo con variantes embebidas en JSON — descartado porque impide filtrar por calibre, impide pricing individual y rompe el modelo del graph donde cada SKU es un nodo.

**Costo de revertir:**  
Reescritura del approve route, migración de todos los conductores existentes, rediseño del catálogo público y portal de proveedores.

**Estado de implementación:** PENDIENTE. El approve route actual aún inserta 1 fila. Cambio crítico pendiente. Ver `DOCUMENTACION-v2.md → ⚠️ Cambio pendiente crítico — approve route`.

**Referencia:** Conversación "Continuando con STARLOGIC", junio 2026.

---

## ADR-003: raw_json es inmutable

**Estado:** IRREVOCABLE  
**Fecha:** Mayo 2026

**Contexto:**  
El pipeline extrae datos de PDFs con Claude. Necesitamos poder auditar qué extrajo la IA vs qué aprobó el humano.

**Decisión:**  
`raw_json` se escribe una sola vez al momento de la extracción. Nunca se modifica bajo ninguna circunstancia. `edited_json` es la copia editable del operador. `final_json` es lo que se aprueba e inserta.

**Costo de revertir:**  
Pérdida de trazabilidad de auditoría.

---

## ADR-004: FTS en 3 capas — no simplificar

**Estado:** IRREVOCABLE  
**Fecha:** Mayo 2026

**Contexto:**  
El catálogo debe encontrar productos con el vocabulario real del mercado: "nxm 125", "termomagnetico 32A", "814009", "llave fuerza 3p". Una búsqueda simple no lo maneja.

**Decisión:**  
La búsqueda del catálogo usa 3 capas en orden:
1. Si query es código numérico (5–8 dígitos) → buscar por `codigo_fabricante`
2. FTS con `textSearch('search_vector', query, {type:'plain', config:'spanish'})` con variantes de prefijo generadas por `processSearchQuery()`
3. ILIKE fallback si FTS no devuelve resultados

No simplificar ni reemplazar esta lógica sin revisión explícita.

**Costo de revertir:**  
Degradación de resultados de búsqueda para el vocabulario técnico del mercado peruano.

---

## ADR-005: Sistema de keywords sin IA

**Estado:** ACTIVO  
**Fecha:** Junio 2026

**Contexto:**  
Se construyó un bot que llamaba a Claude API para sugerir keywords SEO. Claude inventaba volúmenes de búsqueda. Sugirió "cable tw libre de halógenos" para TW-80, que es PVC no LSOH — dato técnicamente incorrecto. Ver `09-HISTORY.md → Bot de keywords con IA`.

**Decisión:**  
El sistema de sugerencia de aliases usa exclusivamente datos reales de Google Keyword Planner subidos por el operador como CSV. Costo: $0 por consulta. El route `suggest-aliases` fue eliminado.

**Lección:**  
La IA no reemplaza datos reales. Usarla donde tiene ventaja real (parseo de PDFs no estructurados), no donde hay fuentes de datos concretas disponibles. Ver Principio #3.

---

## ADR-006: disponible_peru = false por defecto al aprobar

**Estado:** IRREVOCABLE  
**Fecha:** Mayo 2026

**Contexto:**  
Un producto aprobado puede tener precio incorrecto, descripción incompleta o imágenes faltantes. Publicarlo directamente sin verificación manual degrada la calidad del catálogo.

**Decisión:**  
Al aprobar un candidato, todas las filas se insertan con `disponible_peru = false`. El operador activa manualmente producto por producto después de verificar precio y disponibilidad real.

---

## ADR-007: Flujo de trabajo Claude web vs Claude Code

**Estado:** IRREVOCABLE  
**Fecha:** Junio 2026

**Contexto:**  
En una sesión se ejecutó código directamente desde Claude web, generando cambios que no llegaron al repo y se perdieron al cerrar la sesión. Ver `09-HISTORY.md → Claude web ejecutó código directamente`.

**Decisión:**
- Claude.ai web: planificación, análisis, decisiones de arquitectura, generación de prompts para Code.
- Claude Code en VS Code: ejecución de código, commits, push.
- Claude.ai web nunca toca el repo directamente.
- Todo cambio de código pasa por Claude Code.
