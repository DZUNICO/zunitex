# STARLOGIC — Estado del Producto

---

## Funcionalidades existentes (MVP actual)

### Catálogo público
- 480+ productos CHINT con búsqueda FTS en 3 capas
- Filtros por categoría y marca via URL params (`?categoria=X&marca=Y`)
- Página de detalle por producto con especificaciones y proveedores
- Búsqueda con vocabulario técnico peruano (NXM-125, termomagnetico 32A, etc.)

### Sistema de proveedores
- Portal de proveedor (`/proveedor`) con tabla editable de precios y stock
- 3 proveedores verificados: Electromack, MANELSA, Dagor
- Edición inline de precios y stock con optimistic updates
- Badge "Ofreciendo" en catálogo para productos del proveedor

### Pipeline de datos
- Extracción automática de fichas técnicas PDF con Claude
- Revisión humana en interface split-view (PDF + editor estructurado)
- Auto-save debounce 2s durante edición
- 3 conductores INDECO aprobados: NH-90, TW-80, THW-90

### Sistema de keywords SEO
- Carga de CSVs de Google Keyword Planner (multi-file, UTF-16)
- Scoring compuesto por volumen + competencia + tendencia + relevancia
- Panel de sugerencias en review de candidatos con chips clicables
- Indicadores visuales de competencia (● verde/amarillo/rojo)

### Diccionario de nomenclatura
- 19 tipos de cable del mercado peruano documentados
- Aliases de búsqueda, términos técnicos NTP, nombres por fabricante
- Función `normalizarTipoCable()` para normalización automática

### Infraestructura social (aplazada, existe en código)
- Comunidad con posts, comentarios, likes
- Blog técnico
- Sistema de seguimiento de usuarios
- 14 Cloud Functions deployadas para contadores automáticos

---

## Funcionalidades pendientes críticas

### 1. Approve route — insertar N filas por variante
**Estado:** PENDIENTE — CRÍTICO  
**ADR:** 02-DECISIONS.md → ADR-002  
El `POST /api/pipeline/approve` actual inserta 1 fila con variantes embebidas. Debe insertar N filas (una por variante) con slugs que incluyan el calibre.

Los 3 candidatos ya aprobados (NH-90, TW-80, THW-90) deben re-procesarse después.

### 2. aliases_busqueda en search_vector
**Estado:** PENDIENTE  
Los `aliases_busqueda` del PRODUCTO_CORE deben alimentar el `search_vector` tsvector para que el FTS los capture. Sin esto, buscar "cable tw indeco" no encuentra el producto si no está en el nombre/descripción.

### 3. Página de producto individual por variante
**Estado:** PENDIENTE  
Una vez que cada variante tenga su propia fila con slug único (NH-90 2.5mm², NH-90 4mm², etc.), necesita una página `/catalogo/[marca]/[slug]` que muestre los datos técnicos específicos de esa variante.

### 4. Filtros por calibre en catálogo
**Estado:** PENDIENTE  
Con variantes como filas independientes, el catálogo puede filtrar por calibre directamente. Requiere que ADR-002 esté implementado primero.

---

## Funcionalidades futuras (fase 2)

| Feature | Descripción | Prerequisito |
|---------|-------------|--------------|
| Graph consultable en UI | "Qué reemplaza al NH-80", "qué es compatible con NH-90 4mm²" | 1000+ nodos en el graph |
| Agente de especificación | Dado un requerimiento → producto correcto | Graph con relaciones completas |
| API de datos | Para fabricantes y distribuidores | Validación de demanda |
| Importación Excel ELCOPE | 3,919 productos estructurados | Pipeline estable |
| Expansión de categorías | Breakers, transformadores, conduit | Conductores completos primero |
| Expansión geográfica | Chile, Colombia, Ecuador | Validación en Perú primero |

---

## Funcionalidades descartadas y por qué

| Feature | Estado | Razón |
|---------|--------|-------|
| Ecommerce / transacciones | Descartado permanentemente | No es el modelo. Ver VISION.md. Requiere logística y capital. |
| Marketplace | Descartado permanentemente | Requiere masa crítica en ambos lados. |
| Comunidad / foro | Aplazado indefinidamente | Sin usuarios recurrentes, una comunidad vacía destruye credibilidad. La UI existe pero está oculta. |
| Blog de contenido SEO | Redefinido como "Técnica" | Solo contenido vinculado a productos del graph. Sin contenido hueco. |
| Bot de keywords con IA | Eliminado | Claude inventaba volúmenes. Ver ADR-005. Reemplazado por datos reales de KWP. |
| SaaS para ferreterías | Descartado | El valor está en los datos del mercado, no en software de gestión. |

---

## Métricas que importan

No optimizar para métricas de vanidad. Las únicas métricas que importan en esta etapa:

1. **Usuarios que regresan semanalmente sin ser invitados** — señal de uso real
2. **Búsquedas que encuentran lo que buscan** — calidad del catálogo
3. **Proveedores que pagan voluntariamente** — valor comercial demostrado
4. **Nuevos nodos en el graph por semana** — velocidad de construcción

Ver Principios #10 y #11 en `00-PRINCIPLES.md`.
