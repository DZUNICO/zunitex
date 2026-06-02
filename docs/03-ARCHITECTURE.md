# STARLOGIC — Arquitectura del Sistema

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|------|------------|-------|
| Frontend | Next.js 16 + TypeScript | App Router, SSR |
| Auth | Firebase Auth | Custom claims: `admin`, `verified_seller`, `user` |
| Base de datos social | Firebase Firestore | Usuarios, roles, solicitudes, datos sociales |
| Base de datos catálogo | Supabase (PostgreSQL) | Catálogo, pipeline, keywords, proveedores |
| Hosting | Vercel | Deploy automático en push a `main` |
| Error tracking | Sentry | `@sentry/nextjs` |
| Analytics | Vercel Analytics + Speed Insights | Web Vitals |
| Cloud Functions | Firebase Functions (Node.js 20) | 14 funciones deployadas |

**Repo:** github.com/DZUNICO/zunitex  
**Producción:** starlogic.vercel.app  
**Supabase proyecto:** STARLOGIC-CATALOGO (`https://cnjvtzwsqzzvqfdbaisv.supabase.co`)

---

## Por qué dos bases de datos

**Firebase Firestore:** usuarios, roles, solicitudes de proveedores, datos sociales (likes, comments, follows). Optimizado para auth y tiempo real.

**Supabase (PostgreSQL):** catálogo de productos, proveedores, pipeline de datos, keywords. Optimizado para búsqueda full-text, queries complejas y datos estructurados del graph.

No fusionar. Cada una hace lo que hace bien.

---

## Diagrama de flujo principal

```
PDF ficha técnica
  → /api/pipeline/extract (Claude API)
  → pipeline_candidatos (status=pending)
  → Revisión humana en /admin/pipeline/[id]
  → /api/pipeline/approve   ← PENDIENTE: debe insertar N filas (ADR-002)
  → productos_catalogo (N filas, una por variante, disponible_peru=false)
  → Catálogo público /catalogo
  → Portal proveedor /proveedor (precios + stock)
```

---

## Flujo de autenticación y roles

```
Usuario se registra
  → Firebase Auth crea cuenta
  → Cloud Function onUserCreate: crea users/{uid} + custom claims {role:'user', admin:false}
  
Usuario solicita ser proveedor
  → /registro-proveedor → solicitudes_proveedor/{uid}
  → Admin aprueba → CF aprobarProveedor → setCustomUserClaims {role:'verified_seller'}
  → Usuario refresca token → accede a /proveedor
  
Admin (Diego)
  → custom claim {role:'admin', admin:true}
  → Acceso completo incluyendo pipeline y panel admin
```

---

## Roles del sistema

| Role | Descripción | Acceso especial |
|------|-------------|-----------------|
| `admin` | Solo Diego | Pipeline, panel admin, todos los APIsegún |
| `verified_seller` | Proveedor verificado | Portal proveedor `/proveedor` |
| `user` | Usuario registrado | Catálogo con precios, comunidad |
| Anónimo | Sin cuenta | Catálogo público (sin precios de proveedor) |

**Regla crítica:** `admin` es rol puramente administrativo. Nunca es proveedor. Ver ADR en `02-DECISIONS.md`.

---

## Rutas principales

### Públicas (sin auth)
| Ruta | Descripción |
|------|-------------|
| `/catalogo` | Catálogo público con FTS y filtros |
| `/catalogo/[marca]/[slug]` | Página de producto individual |
| `/proveedores` | Directorio de proveedores |
| `/blog` | Blog técnico |
| `/community` | Comunidad (aplazada) |

### Protegidas (auth requerida)
| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/proveedor` | `verified_seller` | Portal de proveedor — listar productos y precios |
| `/proveedor/agregar` | `verified_seller` | Agregar oferta al catálogo |
| `/admin` | `admin` | Panel de administración |
| `/admin/pipeline` | `admin` | Lista de candidatos del pipeline |
| `/admin/pipeline/[id]` | `admin` | Revisión de candidato individual |
| `/admin/pipeline/keywords` | `admin` | Gestión de keywords SEO |
| `/admin/proveedores` | `admin` | Aprobación de solicitudes de proveedores |

---

## Búsqueda del catálogo — 3 capas (ADR-004)

```
Query del usuario
  ↓
¿Es código numérico (5-8 dígitos)?
  → SÍ: buscar por codigo_fabricante exacto
  → NO: continuar
  ↓
FTS: textSearch('search_vector', query, {type:'plain', config:'spanish'})
  + variantes de prefijo via processSearchQuery()
  ↓
¿Sin resultados?
  → SÍ: ILIKE fallback por tokens y query completa
  → NO: devolver resultados FTS
```

No simplificar este flujo. Ver `02-DECISIONS.md → ADR-004`.

---

## Cloud Functions deployadas (14)

| Tipo | Función | Qué hace |
|------|---------|----------|
| Likes (6) | `onPostLikeCreate/Delete` | Contador de likes en community-posts |
| Likes (6) | `onBlogLikeCreate/Delete` | Contador de likes en blog-posts |
| Likes (6) | `onResourceLikeCreate/Delete` | Contador de likes en resources |
| Followers (2) | `onFollowerCreate/Delete` | Contadores de followersCount / followingCount |
| Reviews (3) | `onReviewCreate/Update/Delete` | Promedio de rating |
| Users (2) | `onUserCreate`, `onUserDocumentUpdate` | Inicializa perfil, sincroniza cambios |
| Callable (1) | `refreshUserToken` | Refresca token para nuevos custom claims |
| Callable (1) | `aprobarProveedor` | Activa claims + Firestore + Supabase al aprobar proveedor |

**Patrón de contadores:** Los contadores se actualizan automáticamente via Cloud Functions. No incrementar manualmente salvo `commentsCount` (no hay CF para comentarios).

---

## Variables de entorno

### Públicas (cliente + servidor)
```env
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_SUPABASE_CATALOGO_URL=https://cnjvtzwsqzzvqfdbaisv.supabase.co
NEXT_PUBLIC_SUPABASE_CATALOGO_ANON=[anon key]
```

### Solo servidor (nunca NEXT_PUBLIC_)
```env
ANTHROPIC_API_KEY          # Claude API — solo para /api/pipeline/extract
SUPABASE_CATALOGO_SERVICE_KEY  # Bypassa RLS — todas las rutas /api/pipeline/*
FIREBASE_SERVICE_ACCOUNT_JSON  # Admin SDK — verificación de tokens admin
SENTRY_AUTH_TOKEN
SENTRY_ORG=starlogic
SENTRY_PROJECT=javascript-nextjs
```
