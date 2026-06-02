# STARLOGIC — Schemas de Base de Datos

> Ver `02-DECISIONS.md → ADR-001` antes de modificar cualquier schema. Nunca agregar columnas individuales para atributos de producto.
>
> **REGLA CRÍTICA:** Antes de cualquier `.select()`, `.insert()`, `.update()` o definición de interfaz TypeScript, verificar columnas aquí. Nunca asumir columnas.

---

## Supabase — Tabla `productos_catalogo`

**Proyecto:** STARLOGIC-CATALOGO  
**Propósito:** Catálogo público de productos eléctricos. Cada variante/calibre es una fila independiente (ADR-002).

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid | PK |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `marca` | text | Nombre del fabricante |
| `modelo` | text | Nombre comercial del producto |
| `descripcion` | text | Descripción breve |
| `categoria` | text | Tipo de producto (ej: "TW-80") |
| `slug` | text | UNIQUE. Formato: `{marca}-{tipo}-{calibre}-{desc}` para variantes |
| `nombres_alternativos` | text[] | Aliases SEO del mercado peruano |
| `atributos` | jsonb | Specs técnicas por categoría + `producto_padre_id` + `variante_id` |
| `normas` | text[] | Normas técnicas cumplidas |
| `precio_ref_usd` | numeric | Precio lista del importador |
| `precio_ref_pen` | numeric | Precio en soles (calculado: `usd × 0.70 × 3.60`) |
| `precio_updated_at` | date | |
| `disponible_peru` | boolean | `false` por defecto al aprobar. El operador activa manualmente. |
| `ficha_tecnica_pdf` | text | URL PDF |
| `manual_pdf` | text | URL manual |
| `pagina_oficial` | text | URL página del fabricante |
| `imagen_url` | text | |
| `url_starlogic` | text | |
| `meta_title` | text | SEO |
| `meta_description` | text | SEO |
| `search_vector` | tsvector | Generado automáticamente para FTS en español |
| `codigo_fabricante` | text | Código numérico del fabricante (ej: 814009) |

**Select recomendado para listados:**
```sql
id, codigo_fabricante, marca, modelo, descripcion, categoria, slug,
atributos, precio_ref_usd, imagen_url, ficha_tecnica_pdf, disponible_peru
```

**Decisiones clave:**
- `atributos jsonb` — NUNCA agregar columnas para specs técnicas (ADR-001)
- Cada variante/calibre = 1 fila (ADR-002) — `producto_padre_id` y `variante_id` van dentro de `atributos`
- `disponible_peru = false` al insertar (ADR-006) — activar manualmente después de verificar
- `nombres_alternativos` ← `aliases_busqueda` del PRODUCTO_CORE del pipeline

> ⚠️ PENDIENTE: `nombres_alternativos` no se incluye en `search_vector` automáticamente. Implementar trigger o lógica en approve route.

---

## Supabase — Tabla `proveedores`

**Propósito:** Registro de proveedores verificados con acceso al portal.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid | PK |
| `created_at` | timestamptz | |
| `nombre` | text | |
| `slug` | text | UNIQUE |
| `tipo` | text | |
| `descripcion` | text | |
| `ciudad` | text | |
| `telefono` | text | |
| `whatsapp` | text | |
| `email` | text | |
| `web` | text | ⚠️ Columna es `web`, NO `sitio_web` |
| `logo_url` | text | |
| `verified` | boolean | |
| `activo` | boolean | |
| `firebase_uid` | text | FK lógica → Firebase Auth UID |

> ⚠️ Columnas que **NO existen**: `region`, `sitio_web`.

---

## Supabase — Tabla `proveedor_producto`

**Propósito:** Relación proveedor-producto con precios y stock. Un proveedor puede ofrecer múltiples productos; un producto puede tener múltiples proveedores.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid | PK |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `proveedor_id` | uuid | FK → proveedores.id |
| `producto_id` | uuid | FK → productos_catalogo.id |
| `codigo_proveedor` | text | |
| `precio_pen` | numeric | Precio en soles (editable en portal) |
| `precio_usd` | numeric | |
| `moneda_base` | text | |
| `stock` | text | `'En stock'` / `'A pedido'` / `'Agotado'` |
| `tiempo_entrega` | text | |
| `notas` | text | |
| `activo` | boolean | Toggle visible en tabla |
| `precio_minimo_pen` | numeric | Precio mínimo por volumen |
| `precio_lista_usd` | numeric | |
| `precio_lista_pen` | numeric | |
| `descuento_pct` | numeric | |
| `codigo_proveedor_origen` | text | Código interno del proveedor |

> ⚠️ Columnas que **NO existen**: `precio` (es `precio_pen`), `disponibilidad` (es `stock`), `precio_ref_usd` (está en `productos_catalogo`).

---

## Supabase — Tabla `pipeline_candidatos`

**Propósito:** Almacena PDFs procesados por Claude en espera de revisión humana. Tabla interna admin — RLS habilitado sin políticas (solo service key).

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid | PK, `gen_random_uuid()` |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | trigger automático |
| `source` | text | `'pdf_upload'` \| `'web_scrape'` |
| `pdf_filename` | text | Nombre original del archivo |
| `raw_pdf_url` | text | URL pública si existe |
| `fabricante` | text | Detectado por Claude o declarado por operador |
| `tipo_cable` | text | Valor raw de Claude/operador |
| `tipo_cable_normalizado` | text | Clave del diccionario `CABLE_NOMENCLATURE` (ej: `"TW-80"`) |
| `status` | text | `'pending'` \| `'approved'` \| `'rejected'` |
| `confidence_score` | float | 0.0–1.0, promedio de scores de Claude |
| `raw_json` | jsonb | JSON extraído por Claude — **NUNCA SE MODIFICA** (ADR-003) |
| `edited_json` | jsonb | Copia editable del operador (auto-guardada) |
| `final_json` | jsonb | Versión definitiva al aprobar |
| `reviewed_by` | text | Firebase UID del admin que decidió |
| `reviewed_at` | timestamptz | Timestamp de la decisión |
| `notas` | text | Notas libres del operador |
| `producto_id` | uuid | FK → `productos_catalogo.id` (se llena al aprobar) |

> ⚠️ Columnas `tipo_cable`, `tipo_cable_normalizado`, `confidence_score` son **exclusivas de esta tabla** — NO existen en `productos_catalogo`.

---

## Supabase — Tabla `keyword_stats`

**Propósito:** Datos de Google Keyword Planner para sugerir aliases SEO. Sin RLS — tabla interna admin.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid PK | `gen_random_uuid()` |
| `keyword` | text NOT NULL | Keyword en minúsculas |
| `tipo_cable` | text NOT NULL | Clave del `CABLE_NOMENCLATURE` (ej: `TW-80`) |
| `avg_monthly_searches` | integer | Promedio de búsquedas/mes. Rangos → lower bound |
| `competition` | text NULL | **En español:** `'Baja'` \| `'Media'` \| `'Alta'` \| null |
| `change_3m` | text NULL | Cambio 3 meses (ej: `'0%'`, `'-90%'`) |
| `change_yoy` | text NULL | Cambio interanual |
| `uploaded_at` | timestamptz | Última actualización de la fila |

**Constraint UNIQUE:** `(keyword, tipo_cable)` — upsert en conflicto.

```sql
CREATE TABLE keyword_stats (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword              TEXT NOT NULL,
  tipo_cable           TEXT NOT NULL,
  avg_monthly_searches INTEGER,
  competition          TEXT,
  change_3m            TEXT,
  change_yoy           TEXT,
  uploaded_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (keyword, tipo_cable)
);
CREATE INDEX idx_keyword_stats_tipo_cable ON keyword_stats (tipo_cable);
CREATE INDEX idx_keyword_stats_volume ON keyword_stats (tipo_cable, avg_monthly_searches DESC);
```

---

## Firebase Firestore — Colección `users/{uid}`

| Campo | Tipo | Notas |
|-------|------|-------|
| `uid` | string | |
| `email` | string | |
| `displayName` | string | |
| `photoURL` | string \| null | |
| `phone` | string | opcional |
| `location` | string | opcional |
| `about` | string | opcional |
| `role` | `'admin'` \| `'verified_seller'` \| `'user'` | |
| `userType` | `'profesional'` \| `'proveedor'` | NO editable por el usuario |
| `verificationStatus` | null \| string | |
| `active` | boolean | |
| `specialties` | string[] | |
| `followersCount` | number | |
| `followingCount` | number | |
| `projectsCount` | number | |
| `rating` | number | |
| `reviewsCount` | number | |
| `resourcesCount` | number | |
| `createdAt` | timestamp | |
| `lastLogin` | timestamp | |

---

## Firebase Firestore — Colección `solicitudes_proveedor/{uid}`

| Campo | Tipo | Notas |
|-------|------|-------|
| `uid` | string | |
| `email` | string | |
| `nombreEmpresa` | string | |
| `ruc` | string | |
| `ciudad` | string | |
| `telefono` | string | |
| `web` | string \| null | |
| `descripcion` | string | |
| `tipoProveedor` | string | |
| `estado` | `'pendiente'` \| `'aprobado'` \| `'rechazado'` | |
| `motivoRechazo` | string | opcional |
| `origen` | `'upgrade'` \| omitido | `'upgrade'` si viene de usuario existente |
| `createdAt` | timestamp | |

---

## Queries frecuentes

### Catálogo — buscar por FTS
```typescript
supabase
  .from('productos_catalogo')
  .select('id, marca, modelo, descripcion, categoria, slug, atributos, precio_ref_usd, imagen_url, disponible_peru')
  .eq('disponible_peru', true)
  .textSearch('search_vector', query, { type: 'plain', config: 'spanish' })
  .order('created_at', { ascending: false })
```

### Pipeline — candidatos pendientes
```typescript
getPipelineClient()
  .from('pipeline_candidatos')
  .select('id, fabricante, tipo_cable, tipo_cable_normalizado, status, confidence_score, pdf_filename, created_at')
  .eq('status', 'pending')
  .order('created_at', { ascending: false })
```

### Keywords — sugerencias por tipo
```typescript
getPipelineClient()
  .from('keyword_stats')
  .select('keyword, avg_monthly_searches, competition, change_3m, change_yoy')
  .eq('tipo_cable', tipo_cable)
  .gte('avg_monthly_searches', 50)
  .order('avg_monthly_searches', { ascending: false })
```
