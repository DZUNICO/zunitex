# STARLOGIC — Operaciones y Deployment

---

## Acceso a consolas

| Servicio | URL | Propósito |
|----------|-----|-----------|
| Firebase Console | https://console.firebase.google.com | Auth, Firestore, Storage, Cloud Functions |
| Supabase | https://supabase.com/dashboard/project/cnjvtzwsqzzvqfdbaisv | Catálogo, pipeline, keywords |
| Vercel | https://vercel.com/dashboard | Hosting, variables de entorno, logs |
| Sentry | https://sentry.io/organizations/starlogic | Error tracking y performance |

---

## Variables de entorno

### Configurar en `.env.local` (desarrollo local)

```env
# Firebase — cliente
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=starlogic
SENTRY_PROJECT=javascript-nextjs

# Supabase — anon key (cliente)
NEXT_PUBLIC_SUPABASE_CATALOGO_URL=https://cnjvtzwsqzzvqfdbaisv.supabase.co
NEXT_PUBLIC_SUPABASE_CATALOGO_ANON=

# Supabase — service key (SOLO SERVIDOR, nunca NEXT_PUBLIC_)
SUPABASE_CATALOGO_SERVICE_KEY=

# Claude API (SOLO SERVIDOR)
ANTHROPIC_API_KEY=

# Firebase Admin SDK (SOLO SERVIDOR)
# En Vercel: JSON completo del service account como string
# En local: dejar vacío y usar Application Default Credentials
FIREBASE_SERVICE_ACCOUNT_JSON=
```

> ⚠️ Las tres variables `SUPABASE_CATALOGO_SERVICE_KEY`, `ANTHROPIC_API_KEY` y `FIREBASE_SERVICE_ACCOUNT_JSON` son **server-only** — nunca deben tener el prefijo `NEXT_PUBLIC_`.

### Configurar en Vercel (producción)
Las mismas variables en `Settings → Environment Variables`. Marcar `NEXT_PUBLIC_*` como "All environments"; las server-only solo en "Production" y "Preview".

### Cloud Functions (variables separadas)
Las variables para Cloud Functions van en `functions/.env` (NO en `.env.local`):
```env
SUPABASE_CATALOGO_URL=https://cnjvtzwsqzzvqfdbaisv.supabase.co
SUPABASE_CATALOGO_SERVICE_KEY=
```
`functions/.env` y `functions/.env.local` están en `.gitignore`. Nunca commitear.

---

## Comandos de desarrollo

```bash
# Iniciar servidor de desarrollo (localhost:3000)
npm run dev

# Build de producción (verificar antes de push)
npm run build

# Lint
npm run lint

# Cloud Functions — compilar
npm --prefix functions run build

# Cloud Functions — tests
npm --prefix functions run test
```

---

## Comandos de deployment

### Frontend (automático via Vercel)
Vercel despliega automáticamente en cada push a `main`. No se requiere comando manual.

```bash
# Deploy manual a producción (si es necesario)
vercel --prod
```

### Cloud Functions
```bash
# Deploy todas las funciones
firebase deploy --only functions

# Deploy función específica
firebase deploy --only functions:aprobarProveedor

# Ver logs
firebase functions:log
```

### Security Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy índices de Firestore
firebase deploy --only firestore:indexes
```

---

## Setup desde cero

```bash
# 1. Clonar repo
git clone https://github.com/DZUNICO/zunitex.git
cd zunitex

# 2. Instalar dependencias frontend
npm install

# 3. Instalar dependencias Cloud Functions
npm --prefix functions install

# 4. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales reales

# 5. Iniciar
npm run dev
```

**Requisitos:** Node.js 20+, Firebase CLI (`npm i -g firebase-tools`), autenticado con `firebase login`.

---

## Troubleshooting común

### Error 401/403 en rutas del pipeline
- Verificar que el usuario tenga claim `admin: true`
- Verificar que `FIREBASE_SERVICE_ACCOUNT_JSON` esté configurado en Vercel
- En local: verificar que `gcloud auth application-default login` esté hecho

### Supabase devuelve error 400 en queries
- Verificar columnas contra `05-SCHEMAS.md` — la columna no existe
- Columnas que NO existen: `region` (proveedores), `sitio_web` (proveedores), `precio` (es `precio_pen`), `disponibilidad` (es `stock`)

### `next build` falla con error de Supabase service key
- Es el comportamiento esperado si `SUPABASE_CATALOGO_SERVICE_KEY` no está en el entorno de build
- `getPipelineClient()` usa inicialización lazy — solo lanza error en runtime, no en build
- Verificar que la variable esté en Vercel Environment Variables

### Cloud Function `aprobarProveedor` retorna 403
- Verificar que el usuario tiene `admin: true` en custom claims
- Puede ser token stale — el `AuthContext` hace `getIdToken(true)` al login, pero tokens guardados pueden quedar obsoletos
- Solución: cerrar sesión y volver a entrar

### FTS no encuentra productos con vocabulario del mercado
- Verificar que el campo `names_alternativos` esté en el `search_vector` (pendiente de implementar)
- Como fallback, agregar el alias directamente al campo `nombres_alternativos` en Supabase

---

## Monitoreo

| Sistema | Qué monitorear | Dónde |
|---------|----------------|-------|
| Errores de producción | Error rate, nuevos errores | Sentry dashboard |
| Performance frontend | Web Vitals, LCP, FID | Vercel Speed Insights |
| Uso de Firestore | Lecturas/escrituras/día | Firebase Console → Firestore Usage |
| Cloud Functions | Invocaciones, errores, latencia | Firebase Console → Functions |
| Supabase | Queries lentas, uso de storage | Supabase → Database → Query Performance |
