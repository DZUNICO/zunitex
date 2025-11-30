# 📚 Documentación Técnica - STARLOGIC v2.0

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Stack Tecnológico Completo](#2-stack-tecnológico-completo)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Seguridad](#4-seguridad)
5. [Base de Datos](#5-base-de-datos)
6. [Monitoreo y Analytics](#6-monitoreo-y-analytics)
7. [Costos Proyectados](#7-costos-proyectados)
8. [Deployment](#8-deployment)
9. [Desarrollo](#9-desarrollo)
10. [Roadmap y Mejoras Pendientes](#10-roadmap-y-mejoras-pendientes)
11. [Troubleshooting](#11-troubleshooting)
12. [Contacto y Recursos](#12-contacto-y-recursos)

---

## 1. RESUMEN EJECUTIVO

### Descripción del Proyecto

**STARLOGIC** es una plataforma web de producción diseñada para conectar electricistas, proveedores y usuarios en un ecosistema colaborativo. La aplicación permite gestionar proyectos eléctricos, compartir conocimiento a través de blogs técnicos, participar en una comunidad activa con posts y comentarios, y establecer relaciones profesionales mediante un sistema de seguimiento y reseñas.

La plataforma está construida con tecnologías modernas y escalables, utilizando Next.js 15 con App Router para el frontend, Firebase como backend completo (Firestore, Auth, Storage), y Cloud Functions para operaciones del servidor. El sistema implementa optimizaciones avanzadas como optimistic updates, caché inteligente con React Query, y monitoreo completo con Sentry y Vercel Analytics.

### Estado Actual

**✅ Production-Ready**

La plataforma está completamente funcional y lista para producción con las siguientes características implementadas:

- ✅ **11 Cloud Functions** deployadas y funcionando (contadores automáticos)
- ✅ **40 índices compuestos** de Firestore creados y optimizados
- ✅ **Security Rules** protegidas y validadas
- ✅ **Sentry** integrado para error tracking y performance monitoring
- ✅ **Vercel Analytics + Speed Insights** configurados
- ✅ **Optimistic updates** implementados en likes y follows
- ✅ **Código refactorizado** y optimizado (Grupo 1 completado)
- ✅ **Emulador deshabilitado** (usa Firestore de producción)

### Capacidad

La plataforma está diseñada para soportar **5,000 - 10,000 usuarios activos** con el stack actual, con capacidad de escalar según demanda.

### Fecha de Última Actualización

**Diciembre 2024** - Versión 2.0

---

## 2. STACK TECNOLÓGICO COMPLETO

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| **Framework** | Next.js | 15.0.3 | App Router, SSR, optimizaciones automáticas |
| **UI Library** | React | 18.3.1 | Biblioteca de componentes UI |
| **Lenguaje** | TypeScript | 5 | Tipado estático, mejor DX |
| **Estilos** | Tailwind CSS | 3.4.1 | Framework de utilidades CSS |
| **Componentes UI** | shadcn/ui | 0.0.4 | Componentes accesibles basados en Radix UI |
| **Iconos** | Lucide React | 0.456.0 | Biblioteca de iconos moderna |
| **Estado Servidor** | TanStack Query | 5.59.20 | Gestión de estado del servidor, caché, optimistic updates |
| **Estado Global** | Zustand | 5.0.1 | Estado global del cliente (si se requiere) |
| **Formularios** | React Hook Form | 7.53.2 | Manejo eficiente de formularios |
| **Validación** | Zod | 3.23.8 | Validación de esquemas TypeScript-first |
| **Validación Forms** | @hookform/resolvers | 3.9.1 | Integración Zod con React Hook Form |
| **Fechas** | date-fns | 4.1.0 | Manipulación y formateo de fechas |
| **Editor Markdown** | @uiw/react-md-editor | 4.0.5 | Editor de markdown para blog |
| **Backend** | Firebase | 11.0.1 | Backend as a Service completo |
| **Base de Datos** | Firestore | 11.0.1 | Base de datos NoSQL en tiempo real |
| **Autenticación** | Firebase Auth | 11.0.1 | Sistema de autenticación |
| **Storage** | Firebase Storage | 11.0.1 | Almacenamiento de archivos |
| **Cloud Functions** | Firebase Functions | 5.0.0 | Funciones del servidor (Node.js 20) |
| **Admin SDK** | Firebase Admin | 12.7.0 | SDK de administración para Cloud Functions |
| **Error Tracking** | Sentry | 10.27.0 | Monitoreo de errores y performance |
| **Analytics** | Vercel Analytics | 1.5.0 | Analytics de usuarios y páginas |
| **Performance** | Vercel Speed Insights | 1.2.0 | Métricas de Web Vitals |
| **Linter** | ESLint | 8 | Linting de código |
| **CSS Processor** | PostCSS | 8 | Procesamiento de CSS |

---

## 3. ARQUITECTURA DEL SISTEMA

### 3.1 Diagrama de Arquitectura

```mermaid
graph TD
    A[Cliente Next.js] --> B[React Query]
    B --> C[Firestore]
    B --> D[Firebase Auth]
    B --> E[Firebase Storage]
    C --> F[Cloud Functions]
    F --> C
    A --> G[Sentry]
    A --> H[Vercel Analytics]
    A --> I[Vercel Speed Insights]
    
    F --> J[onPostLikeCreate]
    F --> K[onPostLikeDelete]
    F --> L[onBlogLikeCreate]
    F --> M[onBlogLikeDelete]
    F --> N[onResourceLikeCreate]
    F --> O[onResourceLikeDelete]
    F --> P[onFollowerCreate]
    F --> Q[onFollowerDelete]
    F --> R[onReviewCreate]
    F --> S[onReviewUpdate]
    F --> T[onReviewDelete]
    
    style A fill:#0070f3
    style B fill:#ff4154
    style C fill:#ff6b00
    style F fill:#ff6b00
    style G fill:#362d59
    style H fill:#000000
```

### 3.2 Flujo de Datos

#### Flujo Principal

```
Usuario → UI Component → React Query Hook → Firebase Service → Firestore
                ↓
         Optimistic Update → UI Actualizada Instantáneamente
                ↓
         Sincronización Servidor → Invalidación de Query → UI Sincronizada
```

#### Flujo con Cloud Functions

```
Usuario → UI → Firestore (crear documento) → Cloud Function Trigger
                ↓
         Cloud Function → Actualiza contador atómicamente
                ↓
         Firestore actualizado → React Query detecta cambio → UI actualizada
```

#### Optimistic Updates

1. **Usuario realiza acción** (like, follow, etc.)
2. **UI se actualiza inmediatamente** (optimistic update)
3. **Petición se envía al servidor** en segundo plano
4. **Si falla**: Rollback automático al estado anterior
5. **Si tiene éxito**: Sincronización con datos del servidor

### 3.3 Cloud Functions (11 Funciones)

| Función | Trigger | Propósito | Colección Afectada |
|---------|---------|-----------|-------------------|
| `onPostLikeCreate` | `post-likes/{likeId}` onCreate | Incrementa contador de likes en post de comunidad | `community-posts/{postId}.likes` |
| `onPostLikeDelete` | `post-likes/{likeId}` onDelete | Decrementa contador de likes en post de comunidad | `community-posts/{postId}.likes` |
| `onBlogLikeCreate` | `blog-likes/{likeId}` onCreate | Incrementa contador de likes en post de blog | `blog-posts/{postId}.likesCount` |
| `onBlogLikeDelete` | `blog-likes/{likeId}` onDelete | Decrementa contador de likes en post de blog | `blog-posts/{postId}.likesCount` |
| `onResourceLikeCreate` | `resource-likes/{likeId}` onCreate | Incrementa contador de likes en recurso | `resources/{resourceId}.likes` |
| `onResourceLikeDelete` | `resource-likes/{likeId}` onDelete | Decrementa contador de likes en recurso | `resources/{resourceId}.likes` |
| `onFollowerCreate` | `followers/{followId}` onCreate | Incrementa contadores de followers/following | `users/{followerId}.followingCount`<br>`users/{followingId}.followersCount` |
| `onFollowerDelete` | `followers/{followId}` onDelete | Decrementa contadores de followers/following | `users/{followerId}.followingCount`<br>`users/{followingId}.followersCount` |
| `onReviewCreate` | `reviews/{reviewId}` onCreate | Recalcula promedio de rating del usuario | `user-ratings/{reviewedUserId}` |
| `onReviewUpdate` | `reviews/{reviewId}` onUpdate | Recalcula promedio de rating del usuario | `user-ratings/{reviewedUserId}` |
| `onReviewDelete` | `reviews/{reviewId}` onDelete | Recalcula promedio de rating del usuario | `user-ratings/{reviewedUserId}` |

**Características de las Cloud Functions:**

- ✅ **Node.js 20** - Runtime moderno
- ✅ **Región: us-central1** - Optimizado para latencia
- ✅ **Operaciones atómicas** - Evita race conditions
- ✅ **Validación de datos** - Verifica existencia de documentos antes de actualizar
- ✅ **Error handling** - Logging completo de errores
- ✅ **TypeScript** - Type safety completo

---

## 4. SEGURIDAD

### 4.1 Security Rules

Las Security Rules de Firestore están configuradas con validaciones estrictas para proteger los datos y prevenir modificaciones no autorizadas.

#### Resumen por Colección

| Colección | Lectura | Escritura | Protecciones Especiales |
|-----------|---------|-----------|------------------------|
| `users` | Autenticados | Propio usuario o admin | No se puede modificar `email`, `createdAt`, contadores |
| `projects` | Público | Autenticados (propio o admin) | No se puede modificar `createdBy`, `createdAt` |
| `comments` | Público | Autenticados (propio o admin) | Validación de longitud (1-1000 caracteres) |
| `blog-posts` | Público | Solo admin | Contadores protegidos (`likesCount`, `commentsCount`) |
| `blog-comments` | Público | Autenticados (propio o admin) | Validación de longitud |
| `blog-likes` | Autenticados | Autenticados (solo propio) | Solo crear/eliminar, no modificar |
| `community-posts` | Público | Autenticados (propio o admin) | Contadores protegidos (`likes`, `commentsCount`, `views`) |
| `post-comments` | Público | Autenticados (propio o admin) | Validación de longitud |
| `post-likes` | Público | Autenticados (solo propio) | Solo crear/eliminar |
| `followers` | Autenticados | Autenticados (solo propio) | No se puede seguir a sí mismo |
| `reviews` | Autenticados | Autenticados (propio o admin) | Rating 1-5, comentario 10-1000 caracteres, no auto-reseña |
| `user-ratings` | Autenticados | Solo Cloud Functions | Solo lectura, escritura bloqueada |
| `resources` | Público (si `isPublic=true`) | Solo admin | Contadores protegidos, max 100MB |
| `resource-likes` | Autenticados | Autenticados (solo propio) | Solo crear/eliminar |

#### Contadores Protegidos

Los siguientes contadores **NO pueden ser modificados desde el cliente** y solo se actualizan mediante Cloud Functions:

- `users.followersCount` / `users.followingCount`
- `blog-posts.likesCount` / `blog-posts.commentsCount`
- `community-posts.likes` / `community-posts.commentsCount` / `community-posts.views`
- `resources.likes` / `resources.downloads` / `resources.views`
- `user-ratings.averageRating` / `user-ratings.totalReviews`

### 4.2 Autenticación

**Sistema:** Firebase Authentication

**Métodos soportados:**
- Email/Password (implementado)
- Google Sign-In (preparado para implementar)
- Otros métodos (preparado para implementar)

**Roles de Usuario:**

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `user` | Usuario estándar | Crear proyectos, posts, comentarios, likes |
| `electrician` | Electricista | Todos los permisos de `user` + funcionalidades especiales |
| `provider` | Proveedor | Todos los permisos de `user` + funcionalidades especiales |
| `admin` | Administrador | Acceso completo, puede crear blog posts, gestionar recursos |

**Admin Principal:**
- Email: `diego.zuni@gmail.com`
- Acceso: Panel de administración, creación de blog posts, gestión de recursos

### 4.3 Rate Limiting

**Cloud Functions:**
- Manejan contadores de forma atómica (evita race conditions)
- Validan existencia de documentos antes de actualizar
- Operaciones idempotentes

**Security Rules:**
- Bloquean modificaciones directas de contadores desde el cliente
- Validan tipos de datos y rangos
- Previenen auto-operaciones (seguirse a sí mismo, auto-reseña)

**Firebase Quotas:**
- Firestore: 20,000 escrituras/día en plan Spark (gratis)
- Cloud Functions: 2 millones de invocaciones/mes en plan Blaze (pay-as-you-go)

---

## 5. BASE DE DATOS

### 5.1 Colecciones Principales

| Colección | Propósito | Público/Privado | Índices |
|-----------|-----------|-----------------|---------|
| `users` | Perfiles de usuario | Privado (solo autenticados) | - |
| `projects` | Proyectos eléctricos | Público (lectura), Privado (escritura) | 6 índices |
| `comments` | Comentarios de proyectos | Público | 1 índice |
| `blog-posts` | Posts del blog técnico | Público | 3 índices |
| `blog-comments` | Comentarios del blog | Público | 2 índices |
| `blog-likes` | Likes de posts del blog | Privado | 1 índice |
| `community-posts` | Posts de la comunidad | Público | 4 índices |
| `post-comments` | Comentarios de posts de comunidad | Público | 1 índice |
| `post-likes` | Likes de posts de comunidad | Público | 1 índice |
| `followers` | Relaciones de seguimiento | Privado | 3 índices |
| `reviews` | Reseñas de usuarios | Privado | 7 índices |
| `user-ratings` | Ratings calculados | Privado | - |
| `resources` | Recursos técnicos | Público (si `isPublic=true`) | 6 índices |
| `resource-likes` | Likes de recursos | Privado | 1 índice |

**Total: 14 colecciones principales**

### 5.2 Índices de Firestore (40 Índices)

#### Proyectos (6 índices)

1. `createdBy` (ASC) + `createdAt` (DESC) - Proyectos por usuario
2. `status` (ASC) + `createdAt` (DESC) - Proyectos por estado
3. `category` (ASC) + `createdAt` (DESC) - Proyectos por categoría
4. `createdBy` (ASC) + `status` (ASC) + `createdAt` (DESC) - Proyectos por usuario y estado
5. `createdBy` (ASC) + `category` (ASC) + `createdAt` (DESC) - Proyectos por usuario y categoría
6. `status` (ASC) + `category` (ASC) + `createdAt` (DESC) - Proyectos por estado y categoría

#### Blog Posts (3 índices)

7. `status` (ASC) + `createdAt` (DESC) - Posts por estado
8. `category` (ASC) + `createdAt` (DESC) - Posts por categoría
9. `authorId` (ASC) + `createdAt` (DESC) - Posts por autor

#### Community Posts (4 índices)

10. `isPinned` (DESC) + `createdAt` (DESC) - Posts fijados primero
11. `category` (ASC) + `isPinned` (DESC) + `createdAt` (DESC) - Posts por categoría con fijados
12. `userId` (ASC) + `isPinned` (DESC) + `createdAt` (DESC) - Posts por usuario con fijados
13. `isPinned` (ASC) + `isPinned` (DESC) + `createdAt` (DESC) - Ordenamiento de fijados

#### Post Comments (1 índice)

14. `postId` (ASC) + `createdAt` (DESC) - Comentarios por post

#### Followers (3 índices)

15. `followerId` (ASC) + `createdAt` (DESC) - Seguidos por usuario
16. `followingId` (ASC) + `createdAt` (DESC) - Seguidores de usuario
17. `followerId` (ASC) + `followingId` (ASC) - Verificar relación única

#### Resources (6 índices)

18. `userId` (ASC) + `createdAt` (DESC) - Recursos por usuario
19. `category` (ASC) + `createdAt` (DESC) - Recursos por categoría
20. `isPublic` (ASC) + `createdAt` (DESC) - Recursos públicos
21. `userId` (ASC) + `category` (ASC) + `createdAt` (DESC) - Recursos por usuario y categoría
22. `userId` (ASC) + `isPublic` (ASC) + `createdAt` (DESC) - Recursos por usuario y visibilidad
23. `category` (ASC) + `isPublic` (ASC) + `createdAt` (DESC) - Recursos por categoría y visibilidad
24. `userId` (ASC) + `category` (ASC) + `isPublic` (ASC) + `createdAt` (DESC) - Recursos completo

#### Resource Likes (1 índice)

25. `userId` (ASC) + `resourceId` (ASC) - Verificar like único

#### Reviews (7 índices)

26. `reviewedUserId` (ASC) + `createdAt` (DESC) - Reseñas recibidas
27. `reviewerId` (ASC) + `createdAt` (DESC) - Reseñas realizadas
28. `projectId` (ASC) + `createdAt` (DESC) - Reseñas por proyecto
29. `category` (ASC) + `createdAt` (DESC) - Reseñas por categoría
30. `reviewerId` (ASC) + `projectId` (ASC) - Reseña única por proyecto
31. `reviewedUserId` (ASC) + `category` (ASC) + `createdAt` (DESC) - Reseñas por usuario y categoría
32. `reviewerId` (ASC) + `category` (ASC) + `createdAt` (DESC) - Reseñas realizadas por categoría
33. `projectId` (ASC) + `category` (ASC) + `createdAt` (DESC) - Reseñas por proyecto y categoría

#### Comments (1 índice)

34. `projectId` (ASC) + `createdAt` (DESC) - Comentarios por proyecto

#### Blog Comments (2 índices)

35. `postId` (ASC) + `parentId` (ASC) + `createdAt` (DESC) - Comentarios anidados
36. `parentId` (ASC) + `createdAt` (ASC) - Respuestas ordenadas

#### Post Likes (1 índice)

37. `userId` (ASC) + `postId` (ASC) - Verificar like único

#### Blog Likes (1 índice)

38. `userId` (ASC) + `postId` (ASC) - Verificar like único

**Total: 40 índices compuestos**

---

## 6. MONITOREO Y ANALYTICS

### 6.1 Sentry

**Propósito:** Error tracking y performance monitoring

**Configuración:**
- **Organización:** `starlogic`
- **Proyecto:** `javascript-nextjs`
- **Versión:** `@sentry/nextjs@10.27.0`
- **Dashboard:** https://sentry.io/organizations/starlogic

**Características:**
- ✅ Error tracking automático
- ✅ Performance monitoring
- ✅ Source maps para debugging
- ✅ Integración con Vercel
- ✅ Automatic Vercel Monitors

**Archivos de configuración:**
- `sentry.client.config.ts` - Configuración del cliente
- `sentry.server.config.ts` - Configuración del servidor
- `sentry.edge.config.ts` - Configuración de Edge
- `next.config.ts` - Integración con Next.js

### 6.2 Vercel Analytics

**Propósito:** Analytics de usuarios y páginas vistas

**Configuración:**
- **Paquete:** `@vercel/analytics@1.5.0`
- **Integración:** Automática con Vercel

**Métricas:**
- Usuarios activos
- Páginas vistas
- Sesiones
- Tiempo en página

### 6.3 Vercel Speed Insights

**Propósito:** Métricas de Web Vitals

**Configuración:**
- **Paquete:** `@vercel/speed-insights@1.2.0`
- **Integración:** Automática con Vercel

**Métricas:**
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

### 6.4 Firebase Console

**Métricas disponibles:**
- **Firestore Usage:**
  - Lecturas, escrituras, eliminaciones
  - Almacenamiento utilizado
  - Índices creados

- **Cloud Functions:**
  - Invocaciones por función
  - Tiempo de ejecución
  - Errores y logs
  - Costos por función

- **Storage:**
  - Archivos almacenados
  - Espacio utilizado
  - Descargas

- **Authentication:**
  - Usuarios activos
  - Métodos de autenticación
  - Intentos de login

---

## 7. COSTOS PROYECTADOS

### Estimación Mensual por Nivel de Usuarios

| Usuarios Activos | Firestore | Cloud Functions | Storage | Sentry | Vercel | **Total Estimado** |
|------------------|-----------|-----------------|---------|--------|--------|-------------------|
| **1,000** | $10-15 | Gratis (2M invocaciones) | Gratis (5GB) | Gratis (5K eventos) | Gratis | **~$15** |
| **5,000** | $20-30 | Gratis | $5 (25GB) | Gratis | Gratis | **~$30** |
| **10,000** | $50-80 | $10 (5M invocaciones) | $10 (50GB) | $26 (50K eventos) | Gratis | **~$100** |
| **25,000** | $150-200 | $30 (15M invocaciones) | $25 (125GB) | $80 (150K eventos) | Gratis | **~$285** |
| **50,000** | $300-400 | $60 (30M invocaciones) | $50 (250GB) | $160 (300K eventos) | Gratis | **~$570** |

### Desglose de Costos

#### Firestore (Blaze Plan)
- **Lecturas:** $0.06 por 100,000 documentos
- **Escrituras:** $0.18 por 100,000 documentos
- **Almacenamiento:** $0.18 por GB/mes
- **Índices:** Gratis

#### Cloud Functions (Blaze Plan)
- **Invocaciones:** Primeros 2M gratis, luego $0.40 por 1M
- **GB-segundos:** $0.0000025 por GB-segundo
- **CPU-segundos:** $0.0000100 por GHz-segundo

#### Firebase Storage (Blaze Plan)
- **Almacenamiento:** $0.026 por GB/mes
- **Descargas:** $0.12 por GB

#### Sentry
- **Plan Developer:** Gratis (5K eventos/mes)
- **Plan Team:** $26/mes (50K eventos/mes)
- **Plan Business:** $80/mes (150K eventos/mes)

#### Vercel
- **Plan Hobby:** Gratis (ilimitado para proyectos personales)
- **Plan Pro:** $20/mes por usuario (para equipos)

**Nota:** Los costos pueden variar según el uso real. Se recomienda monitorear el uso en Firebase Console y ajustar según necesidad.

---

## 8. DEPLOYMENT

### 8.1 Entornos

| Entorno | URL | Descripción | Base de Datos |
|---------|-----|-------------|---------------|
| **Desarrollo** | `localhost:3000` | Desarrollo local | Firestore de producción |
| **Preview** | `*.vercel.app` | Auto-deploy en PR | Firestore de producción |
| **Producción** | TBD | Producción final | Firestore de producción |

**Nota:** El emulador de Firebase está deshabilitado. El proyecto usa Firestore de producción incluso en desarrollo local.

### 8.2 Variables de Entorno Necesarias

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=starlogic
SENTRY_PROJECT=javascript-nextjs

# Environment
NODE_ENV=production
```

**Para Vercel:**
- Configurar las mismas variables en el dashboard de Vercel
- Las variables `NEXT_PUBLIC_*` son públicas y se exponen al cliente
- Las variables sin `NEXT_PUBLIC_` son solo del servidor

### 8.3 Comandos de Deploy

#### Frontend (Vercel)

```bash
# Deploy a producción
vercel --prod

# Deploy a preview (automático en PR)
# Se ejecuta automáticamente al crear un PR
```

**Configuración en Vercel:**
1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Deploy automático en cada push a `main`

#### Cloud Functions

```bash
# Compilar TypeScript
cd functions
npm run build

# Deploy todas las funciones
firebase deploy --only functions

# Deploy función específica
firebase deploy --only functions:onPostLikeCreate
```

#### Security Rules

```bash
# Deploy reglas de Firestore
firebase deploy --only firestore:rules

# Deploy reglas de Storage
firebase deploy --only storage:rules
```

#### Índices de Firestore

```bash
# Deploy índices
firebase deploy --only firestore:indexes
```

**Nota:** Los índices pueden tardar varios minutos en crearse. Verificar estado en Firebase Console.

#### Deploy Completo

```bash
# Deploy todo (functions + rules + indexes)
firebase deploy

# Solo frontend (Vercel)
vercel --prod
```

---

## 9. DESARROLLO

### 9.1 Setup Inicial

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd zunitex

# 2. Instalar dependencias del frontend
npm install

# 3. Instalar dependencias de Cloud Functions
cd functions
npm install
cd ..

# 4. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 5. Iniciar servidor de desarrollo
npm run dev
```

**Requisitos:**
- Node.js 18+ (recomendado 20+)
- npm o yarn
- Cuenta de Firebase
- Firebase CLI instalado (`npm install -g firebase-tools`)
- Vercel CLI (opcional, `npm install -g vercel`)

### 9.2 Scripts Disponibles

#### Frontend

```bash
# Desarrollo
npm run dev              # Inicia servidor en localhost:3000

# Producción
npm run build           # Construye aplicación para producción
npm start               # Inicia servidor de producción

# Linting
npm run lint            # Ejecuta ESLint
```

#### Cloud Functions

```bash
cd functions

# Desarrollo
npm run build           # Compila TypeScript
npm run lint            # Ejecuta ESLint

# Deploy
npm run deploy          # Deploy a Firebase
npm run logs            # Ver logs de funciones
```

### 9.3 Estructura de Carpetas

```
zunitex/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Rutas de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (protected)/        # Rutas protegidas
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── projects/
│   │   │   └── admin/
│   │   ├── (public)/           # Rutas públicas
│   │   │   ├── blog/
│   │   │   ├── community/
│   │   │   └── page.tsx        # Home
│   │   ├── api/                # API Routes
│   │   └── layout.tsx          # Layout raíz
│   │
│   ├── components/             # Componentes React
│   │   ├── ui/                 # Componentes UI base (shadcn)
│   │   ├── shared/             # Componentes compartidos
│   │   ├── forms/              # Formularios
│   │   ├── blog/               # Componentes de blog
│   │   ├── community/          # Componentes de comunidad
│   │   ├── projects/           # Componentes de proyectos
│   │   ├── profile/            # Componentes de perfil
│   │   └── admin/              # Componentes de admin
│   │
│   ├── lib/                    # Librerías y utilidades
│   │   ├── context/            # Contextos de React
│   │   │   └── auth-context.tsx
│   │   ├── firebase/           # Servicios de Firebase
│   │   │   ├── config.ts
│   │   │   ├── projects.ts
│   │   │   ├── blog.ts
│   │   │   ├── community.ts
│   │   │   └── ...
│   │   ├── react-query/        # Hooks de React Query
│   │   │   └── queries.ts      # Todas las queries centralizadas
│   │   ├── providers/          # Providers de React
│   │   │   └── query-provider.tsx
│   │   ├── services/           # Servicios adicionales
│   │   ├── utils/              # Utilidades
│   │   └── validations/        # Esquemas de validación Zod
│   │
│   ├── hooks/                  # Hooks personalizados
│   │   ├── queries/            # Hooks de queries específicos
│   │   └── use-toast.ts
│   │
│   └── types/                  # Definiciones de tipos TypeScript
│       ├── project.ts
│       ├── blog.ts
│       ├── community.ts
│       └── ...
│
├── functions/                  # Cloud Functions
│   ├── src/
│   │   ├── config.ts           # Configuración Firebase Admin
│   │   ├── index.ts            # Export de todas las funciones
│   │   ├── triggers/           # Triggers de Firestore
│   │   │   ├── post-likes.ts
│   │   │   ├── blog-likes.ts
│   │   │   ├── resource-likes.ts
│   │   │   ├── followers.ts
│   │   │   └── reviews.ts
│   │   └── utils/              # Utilidades de funciones
│   │       └── firestore-helpers.ts
│   └── package.json
│
├── public/                     # Archivos estáticos
├── firestore.rules             # Reglas de seguridad de Firestore
├── storage.rules               # Reglas de seguridad de Storage
├── firestore.indexes.json      # Índices de Firestore
├── firebase.json               # Configuración de Firebase
├── next.config.ts              # Configuración de Next.js
├── tsconfig.json               # Configuración de TypeScript
└── package.json                # Dependencias del proyecto
```

### 9.4 Convenciones de Código

#### Nombres de Archivos
- **Componentes:** `kebab-case.tsx` (ej: `profile-header.tsx`)
- **Hooks:** `use-kebab-case.ts` (ej: `use-profile.ts`)
- **Servicios:** `kebab-case.ts` (ej: `projects.ts`)
- **Tipos:** `kebab-case.ts` (ej: `project.ts`)

#### Nombres de Componentes
- **PascalCase:** `ProfileHeader`, `ProjectCard`

#### Nombres de Funciones
- **camelCase:** `getProjects`, `createProject`

#### Orden de Imports

```typescript
// 1. React y Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Librerías externas
import { useQuery } from '@tanstack/react-query';

// 3. Componentes UI
import { Button } from '@/components/ui/button';

// 4. Componentes propios
import { ProfileHeader } from '@/components/profile/profile-header';

// 5. Hooks
import { useAuth } from '@/lib/context/auth-context';

// 6. Servicios
import { projectsService } from '@/lib/firebase/projects';

// 7. Tipos
import type { Project } from '@/types/project';

// 8. Utilidades
import { cn } from '@/lib/utils';
```

---

## 10. ROADMAP Y MEJORAS PENDIENTES

### 10.1 Completado ✅

- ✅ **Sentry integrado** - Error tracking y performance monitoring
- ✅ **Vercel Analytics + Speed Insights** - Analytics y métricas de performance
- ✅ **11 Cloud Functions deployadas** - Contadores automáticos funcionando
- ✅ **Security Rules protegidas** - Contadores no modificables desde cliente
- ✅ **40 índices de Firestore creados** - Queries optimizadas
- ✅ **Optimistic updates** - Implementados en likes y follows
- ✅ **Código limpiado** - Grupo 1 de refactorización completado
- ✅ **Emulador deshabilitado** - Usa Firestore real
- ✅ **React Query migrado** - Gestión de estado del servidor completa
- ✅ **Sistema de errores centralizado** - Manejo consistente de errores

### 10.2 Pendiente 🔄

#### Prioridad Alta

1. **Refactorizar queries.ts**
   - Dividir en módulos por feature (projects, blog, community, etc.)
   - Reducir tamaño del archivo (actualmente 1654+ líneas)
   - Mejorar mantenibilidad

2. **Testing Automatizado**
   - **Unit Tests:** Vitest + React Testing Library
   - **Integration Tests:** Flujos completos
   - **E2E Tests:** Playwright para pruebas end-to-end

3. **CI/CD Pipeline**
   - GitHub Actions para tests automáticos
   - Deploy automático en merge a `main`
   - Linting y type checking en PR

4. **Funcionalidad de Editar Posts**
   - Permitir editar posts de comunidad
   - Historial de ediciones (opcional)

#### Prioridad Media

5. **Notificaciones en Tiempo Real**
   - Notificaciones cuando alguien comenta tu post
   - Notificaciones cuando alguien te sigue
   - Notificaciones cuando alguien da like a tu post

6. **Sistema de Mensajería**
   - Chat entre usuarios
   - Notificaciones de mensajes nuevos

7. **Mejoras de Performance**
   - Lazy loading de imágenes
   - Code splitting más agresivo
   - Optimización de bundle size

#### Prioridad Baja

8. **Búsqueda Avanzada**
   - Búsqueda full-text en posts
   - Filtros avanzados
   - Búsqueda por tags

9. **Sistema de Tags Mejorado**
   - Autocompletado de tags
   - Tags populares
   - Nube de tags

### 10.3 Futuro 🚀

1. **PWA (Progressive Web App)**
   - Service Workers
   - Instalable en móviles
   - Notificaciones push

2. **Soporte Offline**
   - Cache de datos críticos
   - Sincronización al reconectar
   - Indicador de estado offline

3. **Chat en Tiempo Real**
   - WebSockets o Firebase Realtime Database
   - Mensajería instantánea
   - Notificaciones push

4. **Videollamadas para Consultas**
   - Integración con WebRTC
   - Consultas en vivo con electricistas
   - Grabación de sesiones (opcional)

5. **Marketplace de Productos**
   - Catálogo de productos eléctricos
   - Integración con proveedores
   - Sistema de pedidos

6. **App Móvil**
   - React Native
   - Sincronización con web
   - Notificaciones push nativas

---

## 11. TROUBLESHOOTING

### 11.1 Problemas Comunes

#### Error de Permisos en Firestore

**Síntoma:** Error "Missing or insufficient permissions" al intentar leer/escribir

**Solución:**
1. Verificar que el usuario está autenticado
2. Revisar Security Rules en `firestore.rules`
3. Verificar que el usuario tiene los permisos necesarios
4. Revisar logs en Firebase Console

**Comando útil:**
```bash
# Ver logs de Firestore
firebase functions:log --only firestore
```

#### Queries Lentas

**Síntoma:** Queries de Firestore tardan mucho tiempo

**Solución:**
1. Verificar que existe un índice para la query
2. Revisar `firestore.indexes.json` para índices necesarios
3. Crear índice faltante en Firebase Console
4. Optimizar la query (reducir campos, usar límites)

**Comando útil:**
```bash
# Ver índices pendientes
firebase deploy --only firestore:indexes
```

#### Build Falla por Errores de TypeScript

**Síntoma:** `npm run build` falla con errores de TypeScript

**Solución:**
1. Ejecutar `npm run lint` para ver errores
2. Corregir errores de tipos
3. Verificar que todos los tipos están definidos en `src/types/`
4. Temporalmente: `next.config.ts` tiene `ignoreBuildErrors: true` (no recomendado para producción)

#### Cloud Functions Fallan

**Síntoma:** Las Cloud Functions no se ejecutan o fallan

**Solución:**
1. Ver logs: `firebase functions:log`
2. Verificar que las funciones están deployadas: `firebase functions:list`
3. Verificar que los triggers están correctos
4. Revisar que Firebase Admin está inicializado correctamente

**Comando útil:**
```bash
# Ver logs de una función específica
firebase functions:log --only onPostLikeCreate
```

#### Optimistic Updates No Funcionan

**Síntoma:** La UI no se actualiza inmediatamente después de una acción

**Solución:**
1. Verificar que `onMutate` está implementado correctamente
2. Asegurar que se está cancelando queries antes de actualizar
3. Verificar que la estructura de datos en `setQueryData` coincide con la query
4. Revisar que `onError` revierte los cambios correctamente

#### Imágenes No Se Cargan

**Síntoma:** Las imágenes de Firebase Storage no se muestran

**Solución:**
1. Verificar `next.config.ts` tiene `remotePatterns` configurado
2. Verificar reglas de Storage en `storage.rules`
3. Verificar que las URLs de imágenes son válidas
4. Revisar permisos de Storage en Firebase Console

### 11.2 Logs y Debugging

#### Ver Logs de Cloud Functions

```bash
# Todos los logs
firebase functions:log

# Logs de una función específica
firebase functions:log --only onPostLikeCreate

# Logs en tiempo real
firebase functions:log --follow

# Logs con filtro
firebase functions:log --only functions --filter "severity>=ERROR"
```

#### Ver Logs de Sentry

1. Ir a https://sentry.io/organizations/starlogic
2. Seleccionar proyecto `javascript-nextjs`
3. Ver Issues para errores
4. Ver Performance para métricas

#### Ver Analytics de Vercel

1. Ir a dashboard de Vercel
2. Seleccionar proyecto
3. Ver Analytics tab para métricas de usuarios
4. Ver Speed Insights para Web Vitals

#### Debugging en Desarrollo

```bash
# Activar React Query DevTools
# Ya está configurado en desarrollo
# Aparece automáticamente en la esquina inferior izquierda

# Ver queries activas
# Abrir DevTools del navegador → React Query tab
```

### 11.3 Comandos Útiles

```bash
# Limpiar caché de Next.js
rm -rf .next

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Verificar configuración de Firebase
firebase projects:list

# Ver estado de deploy
firebase deploy --only firestore:indexes --dry-run

# Ver reglas actuales
firebase firestore:rules:get
```

---

## 12. CONTACTO Y RECURSOS

### Documentación Externa

- **Firebase:** https://firebase.google.com/docs
- **Next.js:** https://nextjs.org/docs
- **React Query:** https://tanstack.com/query/latest
- **TypeScript:** https://www.typescriptlang.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com

### Dashboards y Consolas

- **Sentry:** https://sentry.io/organizations/starlogic
- **Firebase Console:** https://console.firebase.google.com
- **Vercel Dashboard:** https://vercel.com/dashboard

### Repositorio

- **URL:** [Agregar cuando esté disponible]
- **Branch principal:** `main`
- **Branch de desarrollo:** `cursor-optimization`

### Contacto del Proyecto

- **Admin Principal:** diego.zuni@gmail.com
- **Organización Sentry:** starlogic
- **Proyecto Sentry:** javascript-nextjs

---

## 📝 Notas Finales

Esta documentación refleja el estado actual del proyecto **STARLOGIC v2.0** en Diciembre 2024. El proyecto está en estado **production-ready** y listo para desplegarse.

Para mantener esta documentación actualizada:
1. Actualizar secciones relevantes después de cambios importantes
2. Actualizar fecha de última actualización
3. Agregar nuevas features al roadmap cuando se completen
4. Documentar decisiones arquitectónicas importantes

---

**Última actualización:** Diciembre 2024  
**Versión del documento:** 2.0  
**Estado del proyecto:** ✅ Production-Ready

