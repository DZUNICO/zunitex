# STARLOGIC — Historial de Decisiones y Lecciones

Este documento registra cambios de rumbo importantes, errores que costaron tiempo y lecciones que no deben repetirse. No es un changelog técnico — es la memoria de por qué el proyecto es como es hoy.

---

## [Junio 2026] Bot de keywords con IA — reemplazado

**Qué pasó:**  
Se construyó un bot que llamaba a Claude API para sugerir keywords SEO durante la revisión de candidatos en el pipeline. Claude inventaba volúmenes de búsqueda sin datos reales. En particular, sugirió "cable tw libre de halógenos" para el cable TW-80 — que es PVC, no LSOH. El dato era técnicamente incorrecto.

**Costo:** Tiempo de desarrollo + sugerencias incorrectas que podrían haber contaminado los aliases del catálogo.

**Solución:** Reemplazado por sistema que usa CSVs reales de Google Keyword Planner exportados por el operador. Costo operativo: $0. Los volúmenes son verificables y verificados.

**Lección:** La IA no reemplaza datos reales. Usarla donde tiene ventaja real (parseo de PDFs no estructurados, extracción de datos de documentos), no donde hay fuentes de datos concretas disponibles. Ver Principio #3 en `00-PRINCIPLES.md`.

**ADR correspondiente:** `02-DECISIONS.md → ADR-005`.

---

## [Junio 2026] Columnas individuales sugeridas para variantes

**Qué pasó:**  
En una sesión nueva (sin contexto de sesiones anteriores), se sugirió agregar columnas individuales como `seccion_mm2`, `corriente_ducto_a`, `diametro_exterior_mm` a la tabla `productos_catalogo` para facilitar filtros por calibre. Esto contradecía directamente ADR-001 de usar `atributos jsonb` para todos los atributos específicos de producto.

**Causa:**  
La decisión de usar jsonb existía en conversaciones anteriores pero no estaba documentada como irrevocable con el contexto completo: alternativas descartadas, costo de revertir y razón técnica. Un agente sin ese contexto tomó la decisión más "obvia" (columnas individuales = más fácil de queryar).

**Costo:** 30 minutos de retrabajo, confusión y corrección.

**Solución:** Crear el sistema de documentación `/docs` con decisiones en formato ADR con contexto completo y costo de revertir.

**Lección:** Las decisiones de arquitectura deben documentarse con el formato ADR: qué, cuándo, por qué, qué alternativas se descartaron y qué cuesta revertirlas. El "por qué" y las "alternativas descartadas" son más importantes que la decisión misma para que sea respetada en el futuro.

---

## [Junio 2026] Claude web ejecutó código directamente

**Qué pasó:**  
En lugar de generar un prompt estructurado para Claude Code en VS Code, Claude.ai web intentó clonar el repositorio y modificar archivos directamente. El push al repo falló por falta de credenciales git configuradas en el entorno de Claude web. Los cambios generados se perdieron al cerrar la sesión.

**Causa:** Flujo de trabajo incorrecto no documentado.

**Solución:** ADR-007 — Claude.ai web genera análisis, decisiones y prompts. Claude Code en VS Code ejecuta código, hace commits y push. Documentado en `02-DECISIONS.md`.

**Lección:** El flujo de trabajo debe estar documentado explícitamente porque es contraintuitivo: la herramienta más "inteligente" (Claude web) no es la que ejecuta código; es la que piensa y diseña. La que ejecuta es Claude Code.

---

## [2024–2026] Evolución de la idea — los caminos descartados

STARLOGIC pasó por estas ideas antes de llegar al industrial graph:

| Idea | Por qué se descartó |
|------|---------------------|
| Ecommerce eléctrico | Requiere logística, capital, competencia directa con Sodimac/Promart |
| Marketplace B2B | Requiere masa crítica en ambos lados antes de tener valor para nadie |
| Comunidad técnica de electricistas | Sin usuarios recurrentes, una comunidad vacía destruye credibilidad |
| Blog de contenido SEO | El contenido sin conexión al graph es hueco — posicionamiento temporal |
| SaaS de gestión para ferreterías | El valor está en los datos del mercado, no en el software de gestión |
| Directorio de proveedores | Solo tiene valor si está conectado al catálogo con datos técnicos reales |

**Lección:** Cada idea descartada clarificó qué es STARLOGIC realmente. El industrial graph emergió como tesis después de eliminar todo lo que no era el activo real. La pregunta que forzó la claridad fue: "¿qué sabe Diego que nadie más sabe y que no se puede copiar con dinero?" La respuesta fue: el conocimiento tácito del mercado eléctrico peruano. Ese conocimiento vive mejor en un graph que en un blog, marketplace o ERP.

---

## [Mayo 2026] Implementación del approve route — error actual

**Qué pasó:**  
El `POST /api/pipeline/approve` fue implementado insertando 1 fila en `productos_catalogo` con todas las variantes embebidas en `atributos.variantes`. Esto fue una decisión de implementación rápida que resultó ser incorrecta según el modelo del graph.

**Por qué es incorrecto:**  
Cada calibre de un conductor es un SKU distinto con precio distinto. "NH-90 2.5mm²" y "NH-90 4mm²" son productos diferentes. Al embeder ambas en una sola fila, se pierde la capacidad de: filtrar por calibre, tener páginas SEO individuales por calibre, y pricear individualmente por proveedor.

**Estado:**  
Los 3 candidatos aprobados (NH-90, TW-80, THW-90) están en `productos_catalogo` con la lógica incorrecta. Deben re-procesarse después de corregir el approve route.

**Pendiente:** Ver `DOCUMENTACION-v2.md → ⚠️ Cambio pendiente crítico — approve route` y `02-DECISIONS.md → ADR-002`.
