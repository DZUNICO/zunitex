# 📘 STARLOGIC - Documentación Técnica Enterprise

> **Versión:** 1.0.0  
> **Última actualización:** Noviembre 2025  
> **Stack:** Next.js 15 + TypeScript + React Query + Firebase  
> **Autor:** Equipo STARLOGIC

---

## 📋 Índice

1. [Resumen General del Proyecto](#1-resumen-general-del-proyecto)
2. [Arquitectura Completa](#2-arquitectura-completa)
3. [Cloud Functions](#3-cloud-functions)
4. [Firestore](#4-firestore)
5. [Reglas de Firestore (Security Rules)](#5-reglas-de-firestore-security-rules)
6. [Firebase Storage](#6-firebase-storage)
7. [Servicios del Cliente](#7-servicios-del-cliente)
8. [React Query](#8-react-query)
9. [Componentes Críticos](#9-componentes-críticos)
10. [Estado Global](#10-estado-global)
11. [Error Boundaries](#11-error-boundaries)
12. [Testing](#12-testing)
13. [Performance & Optimización](#13-performance--optimización)
14. [Pendientes Críticos](#14-pendientes-críticos)
15. [Recomendaciones Senior](#15-recomendaciones-senior)

---

## 1. Resumen General del Proyecto

### 1.1 ¿Qué es STARLOGIC?

STARLOGIC es una **red social profesional para electricistas**, diseñada para conectar profesionales del sector eléctrico, compartir proyectos, recursos, y construir una comunidad técnica especializada.

### 1.2 Objetivo Funcional

| Objetivo | Descripción |
|----------|-------------|
| **Comunidad** | Foro de discusión técnica con posts, comentarios y likes |
| **Proyectos** | Gestión y showcase de proyectos eléctricos |
| **Blog** | Contenido educativo y noticias del sector |
| **Recursos** | Biblioteca de diagramas, documentos y herramientas |
| **Perfiles** | Sistema de perfiles profesionales con reseñas y followers |
| **Networking** | Sistema de seguimiento entre usuarios |

### 1.3 Tecnologías Principales

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 15.0.3 | Framework React con App Router |
| React | 18.3.1 | UI Library |
| TypeScript | 5.x | Tipado estático |
| React Query | 5.59.20 | Server state management |
| Firebase | 11.0.1 | Backend (Auth, Firestore, Storage) |
| Firebase Admin | 12.7.0 | Server-side Firebase |
| Tailwind CSS | 3.4.1 | Estilos |
| Radix UI | Varios | Componentes accesibles |
| Zod | 3.23.8 | Validación de esquemas |
| Zustand | 5.0.1 | Estado global (instalado, no usado) |
| Sentry | 10.27.0 | Monitoreo de errores |

### 1.4 Dependencias Críticas

```
├── @tanstack/react-query       → Estado del servidor
├── firebase / firebase-admin   → Backend completo
├── @sentry/nextjs              → Error tracking y monitoring
├── zod                         → Validación de datos
├── react-hook-form             → Manejo de formularios
├── @radix-ui/*                 → Componentes UI base
├── date-fns                    → Manipulación de fechas
└── @uiw/react-md-editor        → Editor Markdown
```

---

## 2. Arquitectura Completa

### 2.1 Estructura de Carpetas

```
zunitex/
├── functions/                    # Cloud Functions (Firebase)
│   ├── src/
│   │   ├── config.ts            # Inicialización Admin SDK
│   │   ├── index.ts             # Exports de funciones
│   │   ├── types.ts             # Tipos compartidos
│   │   ├── triggers/            # Triggers de Firestore
│   │   │   ├── post-likes.ts    # ✅ Implementado
│   │   │   ├── blog-likes.ts    # ⏳ Placeholder
│   │   │   ├── followers.ts     # ⏳ Placeholder
│   │   │   ├── resource-likes.ts # ⏳ Placeholder
│   │   │   └── reviews.ts       # ⏳ Placeholder
│   │   └── utils/
│   │       └── firestore-helpers.ts
│   ├── package.json
│   └── tsconfig.json
│
├── src/
│   ├── app/                      # App Router (Next.js 15)
│   │   ├── (auth)/               # Rutas de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (protected)/          # Rutas protegidas
│   │   │   ├── layout.tsx        # Layout con ProtectedRoute + Navbar
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── projects/
│   │   │   └── admin/
│   │   ├── (public)/             # Rutas públicas
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── blog/
│   │   │   └── community/
│   │   ├── api/                  # API Routes
│   │   ├── layout.tsx            # Root Layout
│   │   ├── global-error.tsx      # Error handler global
│   │   └── globals.css
│   │
│   ├── components/               # Componentes React
│   │   ├── admin/
│   │   ├── blog/
│   │   ├── community/
│   │   ├── dashboard/
│   │   ├── followers/
│   │   ├── forms/
│   │   ├── home/
│   │   ├── profile/
│   │   ├── projects/
│   │   ├── providers/
│   │   ├── shared/               # Componentes compartidos
│   │   │   ├── error-boundary.tsx
│   │   │   ├── global-error-boundary.tsx
│   │   │   ├── protected-route.tsx
│   │   │   └── protected-navbar.tsx
│   │   └── ui/                   # Componentes base (shadcn/ui)
│   │
│   ├── hooks/                    # Custom Hooks
│   │   ├── queries/              # Hooks específicos de queries
│   │   │   ├── use-profile.ts
│   │   │   ├── use-projects.ts
│   │   │   └── use-comments.ts
│   │   └── use-toast.ts
│   │
│   ├── lib/                      # Lógica de negocio
│   │   ├── context/
│   │   │   └── auth-context.tsx  # Context de autenticación
│   │   ├── firebase/             # Servicios Firebase
│   │   │   ├── config.ts         # Inicialización Firebase
│   │   │   ├── projects.ts
│   │   │   ├── community.ts
│   │   │   ├── blog.ts
│   │   │   ├── blog-comments.ts
│   │   │   ├── blog-likes.ts
│   │   │   ├── comments.ts
│   │   │   ├── followers.ts
│   │   │   ├── resources.ts
│   │   │   ├── reviews.ts
│   │   │   └── storage.ts
│   │   ├── providers/
│   │   │   └── query-provider.tsx
│   │   ├── react-query/
│   │   │   └── queries.ts        # Centralización de queries
│   │   ├── services/
│   │   │   ├── db-service.ts     # (Comentado/legacy)
│   │   │   └── storage-service.ts
│   │   ├── utils/
│   │   │   └── logger.ts         # Sistema de logging + Sentry
│   │   ├── validations/          # Schemas Zod
│   │   │   ├── community.ts
│   │   │   ├── followers.ts
│   │   │   ├── resources.ts
│   │   │   └── reviews.ts
│   │   └── utils.ts
│   │
│   └── types/                    # TypeScript Types
│       ├── blog.ts
│       ├── comment.ts
│       ├── community.ts
│       ├── error-boundary.ts
│       ├── followers.ts
│       ├── profile.ts
│       ├── project.ts
│       ├── resources.ts
│       └── reviews.ts
│
├── firestore.rules               # Reglas de seguridad Firestore
├── firestore.indexes.json        # Índices de Firestore
├── storage.rules                 # Reglas de seguridad Storage
├── firebase.json                 # Configuración Firebase
└── next.config.ts                # Configuración Next.js + Sentry
```

### 2.2 Patrón Arquitectónico

El proyecto sigue un patrón **Feature-Based** con **Service Layer**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Components │  │    Pages    │  │   Layouts   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    REACT QUERY LAYER                        ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      ││
│  │  │   Queries    │  │  Mutations   │  │ Query Keys   │      ││
│  │  │ (useProjects)│  │(useCreate*)  │  │ (queryKeys)  │      ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────┘      ││
│  └─────────┼─────────────────┼──────────────────────────────────┘│
│            │                 │                                   │
│            ▼                 ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    SERVICE LAYER                            ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      ││
│  │  │projectsService│ │communityService│ │followersService│     ││
│  │  │ blogService  │  │reviewsService │  │resourcesService│     ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      ││
│  └─────────┼─────────────────┼─────────────────┼────────────────┘│
│            │                 │                 │                 │
│            └─────────────────┼─────────────────┘                 │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    FIREBASE SDK                             ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      ││
│  │  │  Firestore   │  │   Storage    │  │     Auth     │      ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FIREBASE BACKEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Cloud        │  │ Firestore    │  │ Cloud        │          │
│  │ Functions    │──│ Database     │  │ Storage      │          │
│  │ (Triggers)   │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Router / Layout Structure

```
app/
├── layout.tsx                    # Root: Providers globales
│   ├── GlobalErrorBoundary       # Captura errores React
│   ├── NavigationProgress        # Barra de progreso
│   ├── QueryProvider             # React Query
│   ├── AuthProvider              # Firebase Auth Context
│   ├── ToastProvider             # Sistema de notificaciones
│   ├── Analytics                 # Vercel Analytics
│   └── SpeedInsights             # Vercel Speed Insights
│
├── (auth)/
│   └── layout.tsx                # Layout minimalista para auth
│       ├── /login
│       ├── /register
│       └── /forgot-password
│
├── (protected)/
│   └── layout.tsx                # ProtectedRoute + Navbar
│       ├── /dashboard
│       ├── /profile/[userId]
│       ├── /projects
│       └── /admin
│
└── (public)/
    └── layout.tsx                # Layout público con navbar diferente
        ├── /                     # Homepage
        ├── /blog/[postId]
        └── /community/[postId]
```

### 2.4 Integración con Firebase

```
┌────────────────────────────────────────────────────────────────┐
│                     CLIENT (Next.js)                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │  Firebase SDK   │     │  Firebase Admin │                   │
│  │  (Client)       │     │  (API Routes)   │                   │
│  └────────┬────────┘     └────────┬────────┘                   │
│           │                       │                             │
└───────────┼───────────────────────┼─────────────────────────────┘
            │                       │
            ▼                       ▼
┌───────────────────────────────────────────────────────────────┐
│                     FIREBASE SERVICES                          │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │    Auth     │  │  Firestore  │  │   Storage   │            │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤            │
│  │ • Email/Pass│  │ • users     │  │ • profiles/ │            │
│  │ • Persistence│ │ • projects  │  │ • projects/ │            │
│  │ • Sessions  │  │ • community │  │ • posts/    │            │
│  │             │  │ • blog      │  │ • blog/     │            │
│  │             │  │ • reviews   │  │ • resources/│            │
│  └─────────────┘  │ • resources │  └─────────────┘            │
│                   │ • followers │                              │
│                   └──────┬──────┘                              │
│                          │                                     │
│                          ▼                                     │
│                   ┌─────────────┐                              │
│                   │   Cloud     │                              │
│                   │  Functions  │                              │
│                   ├─────────────┤                              │
│                   │ • Triggers  │                              │
│                   │ • Counters  │                              │
│                   └─────────────┘                              │
└───────────────────────────────────────────────────────────────┘
```

### 2.5 Flujo de Datos

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   UI     │───▶│  React   │───▶│ Firebase │───▶│Firestore │
│Component │    │  Query   │    │ Service  │    │    DB    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     │  useQuery()   │  service.*()  │   getDocs()   │
     │               │               │   addDoc()    │
     │               │               │   updateDoc() │
     │               │               │               │
     ▼               ▼               ▼               ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Estado  │◀───│  Cache   │◀───│Respuesta │◀───│  Datos   │
│   UI     │    │  Query   │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**Flujo de Mutación con Optimistic Update:**

```
1. Usuario hace click en "Like"
2. useMutation ejecuta onMutate:
   - Cancela queries pendientes
   - Guarda estado previo (snapshot)
   - Actualiza caché optimísticamente (UI inmediata)
3. mutationFn ejecuta operación en Firestore
4. Si éxito:
   - Cloud Function actualiza contador (post-likes)
   - onSuccess invalida queries relacionadas
5. Si error:
   - onError restaura snapshot (rollback)
   - Toast muestra error
```

---

## 3. Cloud Functions

### 3.1 Resumen de Cloud Functions

| Función | Tipo | Estado | Trigger Path |
|---------|------|--------|--------------|
| `onPostLike` | `onCreate` | ✅ Activo | `post-likes/{likeId}` |
| `onPostUnlike` | `onDelete` | ✅ Activo | `post-likes/{likeId}` |
| `onBlogLike` | - | ⏳ Placeholder | - |
| `onBlogUnlike` | - | ⏳ Placeholder | - |
| `onFollowCreate` | - | ⏳ Placeholder | - |
| `onFollowDelete` | - | ⏳ Placeholder | - |
| `onResourceLike` | - | ⏳ Placeholder | - |
| `onResourceUnlike` | - | ⏳ Placeholder | - |
| `onReviewCreate` | - | ⏳ Placeholder | - |
| `onReviewUpdate` | - | ⏳ Placeholder | - |
| `onReviewDelete` | - | ⏳ Placeholder | - |

### 3.2 Documentación Detallada: `onPostLike`

**Archivo:** `functions/src/triggers/post-likes.ts`

```typescript
/**
 * Función: onPostLike
 * Tipo: Firestore Trigger (onCreate)
 * Path: post-likes/{likeId}
 * 
 * Propósito: Incrementar contador de likes de forma atómica
 * cuando un usuario da like a un post de comunidad.
 */
```

| Campo | Valor |
|-------|-------|
| **Nombre** | `onPostLike` |
| **Tipo** | `onCreate` |
| **Path** | `post-likes/{likeId}` |
| **Colección que actualiza** | `community-posts` |
| **Campo que modifica** | `likes` (+1), `updatedAt` |

**Lógica Interna:**

```
1. Trigger se activa cuando se crea documento en post-likes
2. Extrae postId y userId del documento creado
3. Valida que postId y userId existan
4. Valida que el post existe en community-posts
5. Incrementa atómicamente el campo 'likes' (+1)
6. Actualiza 'updatedAt' con serverTimestamp
```

**Datos que recibe:**

```typescript
{
  postId: string;    // ID del post en community-posts
  userId: string;    // ID del usuario que da like
  createdAt: Timestamp;
}
```

**⚠️ Riesgos:**

- Si el post se elimina entre la creación del like y el trigger, el contador se incrementará en un documento que no existe (manejado con validación)
- No hay control de rate limiting

---

### 3.3 Documentación Detallada: `onPostUnlike`

| Campo | Valor |
|-------|-------|
| **Nombre** | `onPostUnlike` |
| **Tipo** | `onDelete` |
| **Path** | `post-likes/{likeId}` |
| **Colección que actualiza** | `community-posts` |
| **Campo que modifica** | `likes` (-1), `updatedAt` |

**Lógica Interna:**

```
1. Trigger se activa cuando se elimina documento en post-likes
2. Extrae postId y userId del documento eliminado
3. Valida que postId y userId existan
4. Valida que el post existe en community-posts
5. Decrementa atómicamente el campo 'likes' (-1)
6. Actualiza 'updatedAt' con serverTimestamp
```

### 3.4 Helpers de Cloud Functions

**Archivo:** `functions/src/utils/firestore-helpers.ts`

| Función | Propósito | Parámetros |
|---------|-----------|------------|
| `incrementCounter` | Incrementar campo numérico atómicamente | `documentPath`, `fieldName`, `amount` |
| `documentExists` | Verificar si documento existe | `documentPath` |
| `getDocument` | Obtener datos de documento | `documentPath` |
| `validateEntities` | Validar usuario y documento existen | `userId`, `documentPath` |

### 3.5 ⚠️ Lo que FALTA Migrar a Cloud Functions

| Operación | Ubicación Actual | Prioridad | Complejidad |
|-----------|------------------|-----------|-------------|
| Blog likes counter | Cliente (`blog-likes.ts`) | 🔴 Alta | Media |
| Resource likes counter | Cliente (`resources.ts`) | 🔴 Alta | Media |
| Followers counter | Cliente (`followers.ts`) | 🔴 Alta | Media |
| Reviews rating calculation | Cliente (`reviews.ts`) | 🔴 Alta | Alta |
| Comments counter (community) | Cliente (`community.ts`) | 🟡 Media | Baja |
| Comments counter (blog) | Cliente (`blog-comments.ts`) | 🟡 Media | Baja |
| Views counter | Cliente | 🟢 Baja | Baja |
| Downloads counter | Cliente (`resources.ts`) | 🟢 Baja | Baja |

---

## 4. Firestore

### 4.1 Colecciones Principales

```
Firestore Database
├── users/                    # Perfiles de usuario
├── projects/                 # Proyectos de electricistas
├── comments/                 # Comentarios en proyectos
├── blog-posts/               # Posts del blog
├── blog-comments/            # Comentarios en blog
├── blog-likes/               # Likes en blog
├── community-posts/          # Posts de comunidad
├── post-comments/            # Comentarios en comunidad
├── post-likes/               # Likes en comunidad (con trigger)
├── followers/                # Relaciones follow
├── resources/                # Recursos compartidos
├── resource-likes/           # Likes en recursos
├── reviews/                  # Reseñas de usuarios
└── user-ratings/             # Ratings calculados
```

### 4.2 Estructura Detallada de Colecciones

#### 📁 `users`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email` | `string` | ✅ | Email único |
| `displayName` | `string` | ✅ | Nombre para mostrar |
| `phone` | `string` | ✅ | Teléfono |
| `role` | `'user' \| 'electrician' \| 'provider' \| 'admin'` | ✅ | Rol del usuario |
| `createdAt` | `string (ISO)` | ✅ | Fecha de registro |
| `lastLogin` | `string (ISO)` | ❌ | Último acceso |
| `photoURL` | `string \| null` | ❌ | URL de foto de perfil |
| `about` | `string` | ❌ | Descripción personal |
| `location` | `string` | ❌ | Ubicación |
| `specialties` | `string[]` | ✅ | Especialidades |
| `projectsCount` | `number` | ✅ | Contador de proyectos |
| `rating` | `number` | ✅ | Rating promedio |
| `active` | `boolean` | ❌ | Estado de cuenta |
| `certifications` | `string[]` | ❌ | Certificaciones |

**Ejemplo:**

```json
{
  "email": "electricista@example.com",
  "displayName": "Juan Pérez",
  "phone": "+56912345678",
  "role": "electrician",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "lastLogin": "2024-11-25T14:22:00.000Z",
  "photoURL": "https://firebasestorage.googleapis.com/.../profile.jpg",
  "about": "Electricista con 10 años de experiencia",
  "location": "Santiago, Chile",
  "specialties": ["Residencial", "Solar", "Industrial"],
  "projectsCount": 15,
  "rating": 4.8,
  "active": true
}
```

---

#### 📁 `projects`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `title` | `string` | ✅ | Título del proyecto |
| `description` | `string` | ✅ | Descripción detallada |
| `status` | `'Pendiente' \| 'En Progreso' \| 'Completado'` | ✅ | Estado |
| `category` | `'Residencial' \| 'Comercial' \| 'Industrial' \| 'Solar'` | ✅ | Categoría |
| `budget` | `number` | ✅ | Presupuesto (≥0) |
| `location` | `string` | ✅ | Ubicación |
| `clientName` | `string` | ✅ | Nombre del cliente |
| `clientId` | `string` | ❌ | ID del cliente |
| `createdBy` | `string` | ✅ | UID del creador |
| `createdAt` | `Timestamp` | ✅ | Fecha de creación |
| `startDate` | `Date` | ❌ | Fecha de inicio |
| `images` | `string[]` | ✅ | URLs de imágenes |
| `tags` | `string[]` | ✅ | Etiquetas |

---

#### 📁 `community-posts`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `userId` | `string` | ✅ | UID del autor |
| `userName` | `string` | ✅ | Nombre del autor |
| `userAvatar` | `string` | ❌ | URL avatar |
| `userRole` | `'technician' \| 'engineer' \| 'vendor' \| 'company'` | ✅ | Rol |
| `content` | `string` | ✅ | Contenido del post |
| `images` | `string[]` | ❌ | URLs de imágenes |
| `category` | `'question' \| 'discussion' \| 'showcase' \| 'tip' \| 'news'` | ✅ | Categoría |
| `tags` | `string[]` | ✅ | Tags |
| `likes` | `number` | ✅ | Contador (inicia 0) |
| `commentsCount` | `number` | ✅ | Contador (inicia 0) |
| `views` | `number` | ✅ | Contador (inicia 0) |
| `isPinned` | `boolean` | ✅ | Post destacado |
| `createdAt` | `Timestamp` | ✅ | Fecha creación |
| `updatedAt` | `Timestamp` | ✅ | Última modificación |

---

#### 📁 `blog-posts`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `title` | `string` | ✅ | Título |
| `content` | `string` | ✅ | Contenido (Markdown) |
| `summary` | `string` | ✅ | Resumen |
| `category` | `string` | ✅ | Categoría |
| `authorId` | `string` | ✅ | UID autor |
| `authorName` | `string` | ✅ | Nombre autor |
| `authorPhotoURL` | `string \| null` | ❌ | Foto autor |
| `status` | `'published' \| 'draft'` | ✅ | Estado |
| `likesCount` | `number` | ✅ | Contador (inicia 0) |
| `commentsCount` | `number` | ✅ | Contador (inicia 0) |
| `imageUrl` | `string` | ❌ | Imagen principal |
| `imageUrls` | `string[]` | ❌ | Galería |
| `createdAt` | `Timestamp` | ✅ | Fecha |
| `updatedAt` | `Timestamp` | ❌ | Última modificación |

---

#### 📁 `reviews`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reviewerId` | `string` | ✅ | UID del que reseña |
| `reviewedUserId` | `string` | ✅ | UID del reseñado |
| `projectId` | `string` | ❌ | Proyecto relacionado |
| `rating` | `1 \| 2 \| 3 \| 4 \| 5` | ✅ | Calificación |
| `comment` | `string` | ✅ | Comentario (10-1000 chars) |
| `reviewerName` | `string` | ✅ | Nombre |
| `reviewerAvatar` | `string` | ❌ | Avatar |
| `category` | `'technical' \| 'communication' \| 'quality' \| 'punctuality'` | ✅ | Categoría |
| `createdAt` | `Timestamp` | ✅ | Fecha |
| `updatedAt` | `Timestamp` | ✅ | Modificación |

---

#### 📁 `user-ratings`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | `string` | UID del usuario |
| `averageRating` | `number` | Promedio calculado |
| `totalReviews` | `number` | Total de reseñas |
| `ratingBreakdown` | `{ 5: n, 4: n, 3: n, 2: n, 1: n }` | Desglose |
| `lastUpdated` | `Timestamp` | Última actualización |

**⚠️ Nota:** Esta colección se actualiza mediante transacciones desde el cliente. Debería migrarse a Cloud Functions.

---

#### 📁 `resources`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `userId` | `string` | ✅ | UID del dueño |
| `userName` | `string` | ✅ | Nombre |
| `title` | `string` | ✅ | Título |
| `description` | `string` | ✅ | Descripción |
| `category` | `'diagram' \| 'document' \| 'photo' \| 'video' \| 'tool' \| 'guide'` | ✅ | Tipo |
| `fileUrl` | `string` | ✅ | URL del archivo |
| `fileName` | `string` | ✅ | Nombre archivo |
| `fileSize` | `number` | ✅ | Tamaño en bytes |
| `fileType` | `string` | ✅ | MIME type |
| `tags` | `string[]` | ✅ | Tags |
| `downloads` | `number` | ✅ | Contador |
| `likes` | `number` | ✅ | Contador |
| `views` | `number` | ✅ | Contador |
| `isPublic` | `boolean` | ✅ | Visibilidad |
| `isPremium` | `boolean` | ✅ | Premium |
| `createdAt` | `Timestamp` | ✅ | Fecha |

---

#### 📁 `followers`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `followerId` | `string` | UID del seguidor |
| `followingId` | `string` | UID del seguido |
| `followerName` | `string` | Nombre del seguidor |
| `followerAvatar` | `string \| null` | Avatar seguidor |
| `followingName` | `string` | Nombre del seguido |
| `followingAvatar` | `string \| null` | Avatar seguido |
| `createdAt` | `Timestamp` | Fecha |

---

### 4.3 Colecciones de Likes/Joins

| Colección | Campos Clave | Propósito |
|-----------|--------------|-----------|
| `post-likes` | `postId`, `userId`, `createdAt` | Likes de comunidad |
| `blog-likes` | `postId`, `userId`, `createdAt` | Likes de blog |
| `resource-likes` | `resourceId`, `userId`, `createdAt` | Likes de recursos |

### 4.4 Índices Necesarios

**Archivo:** `firestore.indexes.json`

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

**⚠️ IMPORTANTE:** El archivo de índices está vacío. Se necesitan crear índices para:

| Colección | Campos | Tipo |
|-----------|--------|------|
| `community-posts` | `isPinned` (desc), `createdAt` (desc) | Compuesto |
| `community-posts` | `category`, `createdAt` (desc) | Compuesto |
| `community-posts` | `userId`, `createdAt` (desc) | Compuesto |
| `projects` | `createdBy`, `createdAt` (desc) | Compuesto |
| `reviews` | `reviewedUserId`, `createdAt` (desc) | Compuesto |
| `followers` | `followingId`, `createdAt` (desc) | Compuesto |
| `followers` | `followerId`, `createdAt` (desc) | Compuesto |
| `post-likes` | `userId`, `postId` | Compuesto |
| `blog-likes` | `userId`, `postId` | Compuesto |
| `resource-likes` | `userId`, `resourceId` | Compuesto |

### 4.5 Problemas/Inconsistencias Detectadas

| Problema | Descripción | Impacto | Solución |
|----------|-------------|---------|----------|
| Contadores en cliente | Likes/comments se actualizan desde cliente | 🔴 Race conditions, inconsistencia | Migrar a Cloud Functions |
| Índices vacíos | No hay índices definidos | 🟡 Queries pueden fallar | Definir índices compuestos |
| Timestamps mixtos | Algunos campos usan `string`, otros `Timestamp` | 🟡 Inconsistencia | Estandarizar a `Timestamp` |
| user-ratings mutable | Se actualiza con transacciones en cliente | 🔴 Bypass de seguridad | Hacer `write: false` y usar Functions |

---

## 5. Reglas de Firestore (Security Rules)

### 5.1 Helper Functions

```javascript
// Verificar autenticación
function isAuthenticated() {
  return request.auth != null;
}

// Verificar propietario
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

// Verificar rol
function hasRole(role) {
  return isAuthenticated() && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
}

// Verificar admin (hardcoded email)
function isAdmin() {
  return isAuthenticated() && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.email 
      in ['diego.zuni@gmail.com'];
}
```

### 5.2 Análisis de Reglas por Colección

#### `users`

| Operación | Regla | Análisis |
|-----------|-------|----------|
| **read** | `isAuthenticated()` | ✅ Correcto - Solo usuarios autenticados |
| **create** | `isOwner(userId)` + campos requeridos + `role == 'user'` | ✅ Correcto - Fuerza rol inicial |
| **update** | `isOwner(userId)` + protege `email`, `createdAt` | ✅ Correcto - Campos sensibles protegidos |
| **delete** | `isAdmin()` | ✅ Correcto - Solo admin puede eliminar |

**⚠️ Riesgo:** `isAdmin()` usa email hardcodeado. Si se compromete esa cuenta, hay acceso total.

---

#### `projects`

| Operación | Regla | Análisis |
|-----------|-------|----------|
| **read** | `isAuthenticated()` | ✅ OK |
| **create** | Validación completa de campos, status, category, budget | ✅ Muy bien implementado |
| **update** | Owner o admin, protege `createdBy`, `createdAt` | ✅ OK |
| **delete** | Owner o admin | ✅ OK |

---

#### `community-posts`

| Operación | Regla | Análisis |
|-----------|-------|----------|
| **read** | `isAuthenticated()` | ✅ OK |
| **create** | Owner + validación completa + contadores en 0 | ✅ Excelente |
| **update** | Permite actualizar contadores a cualquier auth user | ⚠️ **RIESGO** |
| **delete** | Owner o admin | ✅ OK |

**⚠️ RIESGO CRÍTICO:** La regla de update permite a cualquier usuario autenticado modificar `commentsCount`, `likes`, `views`. Esto debería hacerse SOLO vía Cloud Functions.

---

#### `blog-posts`

| Operación | Regla | Análisis |
|-----------|-------|----------|
| **read** | `true` (público) | ✅ Correcto para blog público |
| **create** | Author + campos + contadores en 0 | ✅ OK |
| **update** | Author o admin | ✅ OK |
| **delete** | Author o admin | ✅ OK |

---

#### `followers`

| Operación | Regla | Análisis |
|-----------|-------|----------|
| **read** | `isAuthenticated()` | ✅ OK |
| **create** | Follower = auth.uid + no seguirse a sí mismo | ✅ Excelente |
| **delete** | Solo el follower puede eliminar | ✅ OK |

---

#### `reviews`

| Operación | Regla | Análisis |
|-----------|-------|----------|
| **read** | `isAuthenticated()` | ✅ OK |
| **create** | Reviewer + validación rating 1-5 + comment 10-1000 chars + no autoreseña | ✅ Excelente |
| **update** | Reviewer o admin + validaciones | ✅ OK |
| **delete** | Reviewer o admin | ✅ OK |

---

#### `user-ratings`

| Operación | Regla | Análisis |
|-----------|-------|----------|
| **read** | `isAuthenticated()` | ✅ OK |
| **write** | `false` | ✅ Correcto - Solo Cloud Functions |

**✅ Esto está BIEN implementado** - Solo el servidor puede modificar ratings.

---

#### `resources`

| Operación | Regla | Análisis |
|-----------|-------|----------|
| **read** | Auth + (isPublic OR owner OR admin) | ✅ Excelente |
| **create** | Owner + validación completa + contadores 0 + fileSize ≤ 100MB | ✅ Muy completo |
| **update** | Owner o admin | ✅ OK |
| **delete** | Owner o admin | ✅ OK |

---

### 5.3 Tabla de Riesgos de Seguridad

| Regla | Riesgo | Severidad | Recomendación |
|-------|--------|-----------|---------------|
| Update contadores en `community-posts` | Cualquier usuario puede manipular likes/views | 🔴 Alto | Migrar a Cloud Functions |
| `isAdmin()` con email hardcoded | Compromiso de cuenta = acceso total | 🟡 Medio | Usar claims personalizados |
| Likes/unlikes sin rate limiting | Posible spam/abuse | 🟡 Medio | Implementar throttling |
| No hay validación de URLs | Posible XSS en imageUrls | 🟢 Bajo | Validar URLs de imágenes |

### 5.4 Reglas que están Correctas ✅

- Validación de campos requeridos en create
- Protección de campos inmutables (createdAt, createdBy, authorId)
- Validación de enums (status, category, role)
- Prevención de auto-follow y auto-review
- Límites de tamaño en comentarios (1000 chars)
- Límites de tamaño en archivos (100MB)
- Contadores inicializados en 0

---

## 6. Firebase Storage

### 6.1 Estructura de Carpetas

```
Firebase Storage
├── profiles/{userId}/           # Fotos de perfil
│   └── profile.{ext}            # profile.jpg, profile.png, etc.
│
├── projects/{projectId}/        # Imágenes de proyectos
│   └── {fileName}
│
├── posts/{postId}/              # Imágenes de comunidad
│   └── {fileName}
│
├── blog/{postId}/               # Imágenes de blog
│   └── {fileName}
│
└── resources/{userId}/          # Archivos de recursos
    └── {fileName}
```

### 6.2 Reglas de Storage Actuales

#### `profiles/{userId}/{fileName}`

| Operación | Regla | Límites |
|-----------|-------|---------|
| **read** | `true` (público) | - |
| **write (create)** | Owner + isImage + hasImageExtension | 5MB máx |
| **write (update/delete)** | Owner o admin + validaciones | 5MB máx |

#### `projects/{projectId}/{fileName}`

| Operación | Regla | Límites |
|-----------|-------|---------|
| **read** | `isAuth()` | - |
| **write** | `isProjectOwner(projectId)` o admin + isImage | 10MB máx |

#### `posts/{postId}/{fileName}`

| Operación | Regla | Límites |
|-----------|-------|---------|
| **read** | `isAuth()` | - |
| **write** | `isCommunityPostOwner(postId)` o admin + isImage | 10MB máx |

#### `blog/{postId}/{fileName}`

| Operación | Regla | Límites |
|-----------|-------|---------|
| **read** | `true` (público) | - |
| **write** | `isBlogOwner(postId)` o admin + isImage | 10MB máx |

#### `resources/{userId}/{fileName}`

| Operación | Regla | Límites |
|-----------|-------|---------|
| **read** | `true` (público) | - |
| **write** | Owner o admin | 100MB máx |

### 6.3 Validaciones Implementadas

| Validación | Implementación |
|------------|----------------|
| **MIME Type** | `request.resource.contentType.matches('image/.*')` |
| **Extensión** | Regex: `.*\.(jpg\|jpeg\|png\|webp\|gif\|svg)$` |
| **Tamaño** | `request.resource.size <= N bytes` |
| **Ownership** | Consulta a Firestore para validar dueño |

### 6.4 Cómo se Asigna Ownership

1. **Profiles:** `userId` viene del `request.auth.uid`
2. **Projects:** Se consulta Firestore `projects/{projectId}.createdBy`
3. **Community Posts:** Se consulta Firestore `community-posts/{postId}.userId`
4. **Blog:** Se consulta Firestore `blog-posts/{postId}.authorId`
5. **Resources:** `userId` en el path debe coincidir con `request.auth.uid`

### 6.5 Riesgos y Recomendaciones

| Riesgo | Descripción | Recomendación |
|--------|-------------|---------------|
| ⚠️ Consultas a Firestore | Las reglas hacen `get()` para verificar ownership | Puede afectar latencia y costos |
| ⚠️ Sin validación de contenido | Solo se valida MIME, no contenido real | Implementar Cloud Function para escaneo |
| ⚠️ Resources públicos | Todos los recursos son públicos para lectura | Evaluar si es intencional |
| ✅ Límites de tamaño | Bien definidos por tipo de archivo | - |
| ✅ Doble validación | MIME + extensión | - |

---

## 7. Servicios del Cliente

### 7.1 Vista General de Servicios

| Servicio | Archivo | Propósito |
|----------|---------|-----------|
| `projectsService` | `src/lib/firebase/projects.ts` | CRUD de proyectos |
| `communityService` | `src/lib/firebase/community.ts` | Posts y comentarios de comunidad |
| `blogService` | `src/lib/firebase/blog.ts` | Posts del blog |
| `blogCommentsService` | `src/lib/firebase/blog-comments.ts` | Comentarios de blog |
| `blogLikesService` | `src/lib/firebase/blog-likes.ts` | Likes de blog |
| `commentService` | `src/lib/firebase/comments.ts` | Comentarios de proyectos |
| `followersService` | `src/lib/firebase/followers.ts` | Sistema de followers |
| `resourcesService` | `src/lib/firebase/resources.ts` | Recursos compartidos |
| `reviewsService` | `src/lib/firebase/reviews.ts` | Reseñas y ratings |
| `storageService` | `src/lib/services/storage-service.ts` | Upload de imágenes |

---

### 7.2 `projectsService`

**Archivo:** `src/lib/firebase/projects.ts`

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `createProject(data)` | Crea proyecto con `serverTimestamp()` | `string` (ID) |
| `updateProject(id, data)` | Actualiza campos parciales | `void` |
| `deleteProject(id)` | Elimina proyecto + imágenes de Storage | `boolean` |
| `getUserProjects(userId)` | Proyectos de un usuario ordenados por fecha | `Project[]` |
| `getProjects(options)` | Paginación con cursor, filtros | `{ projects, nextCursor, hasMore }` |
| `getProject(id)` | Obtiene proyecto por ID | `Project \| null` |

**⚠️ Riesgo:** `deleteProject` elimina imágenes en paralelo sin transacción. Si falla parcialmente, puede quedar inconsistente.

---

### 7.3 `communityService`

**Archivo:** `src/lib/firebase/community.ts`

| Método | Descripción | Nota |
|--------|-------------|------|
| `getPosts(options)` | Posts con paginación y filtros | Ordena por `isPinned` primero |
| `getPost(id)` | Post individual | - |
| `createPost(data)` | Crea post con contadores en 0 | - |
| `updatePost(id, data)` | Actualiza con `serverTimestamp()` | - |
| `deletePost(id)` | Elimina post + imágenes | - |
| `likePost(userId, postId)` | **Solo crea documento en post-likes** | ✅ Cloud Function incrementa |
| `unlikePost(userId, postId)` | **Solo elimina documento** | ✅ Cloud Function decrementa |
| `isPostLiked(userId, postId)` | Verifica si existe like | - |
| `incrementPostView(postId)` | Incrementa vistas | ⚠️ En cliente |
| `getPostComments(postId)` | Comentarios del post | - |
| `addPostComment(data)` | Agrega comentario + incrementa contador | ⚠️ En cliente |
| `deletePostComment(id, postId)` | Elimina + decrementa contador | ⚠️ En cliente |

**✅ Bueno:** `likePost`/`unlikePost` ya NO actualizan contadores (lo hace Cloud Function)

**⚠️ Migrar:** `incrementPostView`, `addPostComment`, `deletePostComment`

---

### 7.4 `blogLikesService`

**Archivo:** `src/lib/firebase/blog-likes.ts`

| Método | Descripción | Problema |
|--------|-------------|----------|
| `likePost` | Crea like + incrementa `likesCount` | ⚠️ En cliente |
| `unlikePost` | Elimina like + decrementa | ⚠️ En cliente |
| `isPostLiked` | Verifica like | ✅ OK |
| `getPostLikesCount` | Cuenta likes | ✅ OK |

**⚠️ CRÍTICO:** Debe migrarse a Cloud Functions como `post-likes`.

---

### 7.5 `followersService`

**Archivo:** `src/lib/firebase/followers.ts`

| Método | Descripción | Notas |
|--------|-------------|-------|
| `followUser(data)` | Crea relación con validación Zod | No actualiza contadores |
| `unfollowUser(followerId, followingId)` | Elimina relación | - |
| `getUserFollowers(userId)` | Lista seguidores | - |
| `getUserFollowing(userId)` | Lista seguidos | - |
| `isFollowing(followerId, followingId)` | Verifica relación | - |
| `getFollowerCount(userId)` | Usa `getCountFromServer` | ✅ Eficiente |
| `getFollowingCount(userId)` | Usa `getCountFromServer` | ✅ Eficiente |
| `getFollowerStats(userId)` | Stats combinadas | - |

**✅ Bueno:** Usa `getCountFromServer()` para conteos eficientes.

**⚠️ Faltante:** No hay Cloud Function para mantener contadores denormalizados en `users`.

---

### 7.6 `reviewsService`

**Archivo:** `src/lib/firebase/reviews.ts`

| Método | Descripción | Complejidad |
|--------|-------------|-------------|
| `getReviews(options)` | Paginación con filtros | - |
| `getReviewsForUser(userId)` | Reviews recibidas | - |
| `getReviewsByUser(userId)` | Reviews hechas | - |
| `getReview(id)` | Review individual | - |
| `createReview(data)` | **Transacción**: crea review + actualiza user-ratings | 🔴 Alta |
| `updateReview(id, data)` | **Transacción**: actualiza + recalcula rating | 🔴 Alta |
| `deleteReview(id)` | **Transacción**: elimina + recalcula rating | 🔴 Alta |
| `getUserRating(userId)` | Obtiene rating calculado | - |
| `updateUserRating(userId)` | Recalcula desde todas las reviews | - |

**⚠️ CRÍTICO:** Las operaciones de create/update/delete usan `runTransaction` desde el cliente. Esto funciona pero:
- El cliente tiene acceso completo a la lógica de cálculo
- Posible manipulación de ratings
- Debería moverse a Cloud Functions

---

### 7.7 `resourcesService`

**Archivo:** `src/lib/firebase/resources.ts`

| Método | Descripción | Problema |
|--------|-------------|----------|
| `getResources(options)` | Paginación + filtros | - |
| `getResource(id)` | Individual | - |
| `uploadResource(file, metadata)` | Sube a Storage | - |
| `createResource(data)` | Crea con validación Zod | - |
| `updateResource(id, data)` | Actualiza | - |
| `deleteResource(id)` | Elimina + archivos de Storage | - |
| `likeResource` | Crea like + incrementa en cliente | ⚠️ Migrar |
| `unlikeResource` | Elimina + decrementa en cliente | ⚠️ Migrar |
| `incrementDownload(id)` | Incrementa contador | ⚠️ En cliente |
| `incrementView(id)` | Incrementa vistas | ⚠️ En cliente |

---

### 7.8 `storageService`

**Archivo:** `src/lib/services/storage-service.ts`

| Método | Descripción |
|--------|-------------|
| `uploadProfileImage(userId, file, currentUrl)` | Sube foto de perfil, elimina anterior |
| `deleteProfileImage(userId, imageUrl)` | Elimina foto de Storage |

**Validaciones implementadas:**
- ✅ Verifica `file.type.startsWith('image/')`
- ✅ Límite de 5MB
- ✅ Extrae extensión real del archivo
- ✅ Normaliza extensiones (jpeg → jpg)

---

### 7.9 Tabla de Operaciones Críticas a Migrar

| Servicio | Operación | Prioridad | Razón |
|----------|-----------|-----------|-------|
| `blogLikesService` | `likePost`/`unlikePost` | 🔴 Alta | Race conditions |
| `resourcesService` | `likeResource`/`unlikeResource` | 🔴 Alta | Race conditions |
| `communityService` | `addPostComment`/`deletePostComment` | 🟡 Media | Contador inconsistente |
| `reviewsService` | `createReview`/`updateReview`/`deleteReview` | 🔴 Alta | Lógica sensible en cliente |
| `resourcesService` | `incrementDownload`/`incrementView` | 🟢 Baja | Menos crítico |

---

## 8. React Query

### 8.1 Configuración Global

**Archivo:** `src/lib/providers/query-provider.tsx`

```typescript
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => Sentry.captureException(error)
  }),
  mutationCache: new MutationCache({
    onError: (error) => Sentry.captureException(error)
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutos
      gcTime: 10 * 60 * 1000,          // 10 minutos (antes cacheTime)
      retry: 3,
      retryDelay: (n) => Math.min(1000 * 2 ** n, 30000),
      refetchOnWindowFocus: false,     // Desactivado
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
```

### 8.2 Query Keys

**Archivo:** `src/lib/react-query/queries.ts`

```typescript
export const queryKeys = {
  projects: {
    all: ['projects'],
    lists: () => [...queryKeys.projects.all, 'list'],
    list: (filters?) => [...queryKeys.projects.lists(), filters],
    details: () => [...queryKeys.projects.all, 'detail'],
    detail: (id) => [...queryKeys.projects.details(), id],
  },
  comments: { /* similar */ },
  blog: { /* similar */ },
  community: { /* similar */ },
  profile: { /* similar */ },
  followers: { /* similar */ },
  resources: { /* similar */ },
  reviews: { /* similar */ },
};
```

### 8.3 Queries Principales

| Query Hook | Tipo | staleTime | Descripción |
|------------|------|-----------|-------------|
| `useProjects` | Infinite | 5 min | Lista paginada de proyectos |
| `useUserProjects` | Query | 2 min | Proyectos del usuario actual |
| `useProject(id)` | Query | 5 min | Proyecto individual |
| `useCommunityPosts` | Infinite | 3 min | Posts de comunidad |
| `useCommunityPost(id)` | Query | 3 min | Post individual |
| `useBlogPosts` | Infinite | 10 min | Posts del blog |
| `useBlogPost(id)` | Query | 10 min | Post de blog |
| `useUserProfile` | Query | 5 min | Perfil del usuario actual |
| `useUserProfileById(id)` | Query | 5 min | Perfil de cualquier usuario |
| `useFollowers(id)` | Query | 3 min | Seguidores de usuario |
| `useFollowing(id)` | Query | 3 min | Seguidos por usuario |
| `useIsFollowing(a, b)` | Query | 2 min | Verifica relación follow |
| `useResources` | Infinite | 5 min | Lista de recursos |
| `useReviews` | Infinite | 3 min | Lista de reviews |
| `useUserRating(id)` | Query | 5 min | Rating de usuario |
| `useProjectComments(id)` | Query | 2 min | Comentarios de proyecto |
| `useBlogComments(id)` | Query | 2 min | Comentarios de blog |
| `useCommunityPostComments(id)` | Query | 2 min | Comentarios de post |
| `useIsBlogPostLiked(id)` | Query | 2 min | Estado de like blog |
| `useIsCommunityPostLiked(id)` | Query | 2 min | Estado de like comunidad |

### 8.4 Mutaciones Principales

| Mutation Hook | Optimistic Update | Invalidaciones |
|---------------|-------------------|----------------|
| `useCreateProject` | ✅ Sí | `projects.lists()` |
| `useUpdateProject` | ✅ Sí | `projects.lists()`, `projects.detail(id)` |
| `useDeleteProject` | ✅ Sí | `projects.lists()` |
| `useAddComment` | ✅ Sí | `comments.list(projectId)` |
| `useCreateCommunityPost` | ❌ No | `community.lists()` |
| `useUpdateCommunityPost` | ❌ No | `community.lists()`, `community.detail(id)` |
| `useDeleteCommunityPost` | ❌ No | `community.lists()` |
| `useLikeCommunityPost` | ✅ Sí (status + contador) | Múltiples |
| `useAddCommunityComment` | ❌ No | `community.commentsList(id)` |
| `useFollowUser` | ✅ Sí | `followers.status`, `followers.followers` |
| `useLikeBlogPost` | ✅ Sí | `blog.likeStatus`, `blog.detail` |
| `useAddBlogComment` | ✅ Sí | `blog.commentsList` |
| `useCreateReview` | ❌ No | `reviews.lists()` |
| `useLikeResource` | ❌ No | `resources.detail`, `resources.lists` |
| `useUpdateProfile` | ❌ No | `profile.detail(uid)` |

### 8.5 Patrón de Optimistic Update

**Ejemplo:** `useLikeCommunityPost`

```typescript
const useLikeCommunityPost = () => {
  return useMutation({
    mutationFn: async ({ postId, like }) => { /* ... */ },
    
    onMutate: async ({ postId, like }) => {
      // 1. Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: queryKeys.community.likeStatus(postId, userId) });
      
      // 2. Guardar snapshot
      const previousStatus = queryClient.getQueryData(likeStatusKey);
      const previousPost = queryClient.getQueryData(postDetailKey);
      const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.community.lists() });
      
      // 3. Actualizar optimísticamente
      queryClient.setQueryData(likeStatusKey, like);
      queryClient.setQueryData(postDetailKey, (old) => ({
        ...old,
        likes: like ? old.likes + 1 : old.likes - 1
      }));
      
      // 4. Actualizar listas (infinite query)
      queryClient.setQueriesData({ queryKey: queryKeys.community.lists() }, (oldData) => ({
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) =>
            post.id === postId ? { ...post, likes: like ? post.likes + 1 : post.likes - 1 } : post
          )
        }))
      }));
      
      return { previousStatus, previousPost, previousLists };
    },
    
    onError: (error, variables, context) => {
      // Rollback
      queryClient.setQueryData(likeStatusKey, context.previousStatus);
      queryClient.setQueryData(postDetailKey, context.previousPost);
      context.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    
    onSuccess: () => {
      // Invalidar para sincronizar con servidor
      queryClient.invalidateQueries({ queryKey: queryKeys.community.lists() });
    }
  });
};
```

### 8.6 Problemas de Re-render

| Problema | Ubicación | Solución |
|----------|-----------|----------|
| `useCommunityPostCard` hace query por cada card | Lista de posts | Los likes ya están en el post, no hacer query extra |
| `useUserProfile` se llama múltiples veces | Varios componentes | Está bien, React Query deduplica |
| Infinite queries se invalidan completamente | `useLikeCommunityPost` | Considerar update puntual en vez de invalidar todo |

---

## 9. Componentes Críticos

### 9.1 Componentes de Feed/Community

#### `CommunityPostCard`

**Archivo:** `src/components/community/community-post-card.tsx`

| Aspecto | Detalle |
|---------|---------|
| **Props** | `post: CommunityPost` |
| **Queries** | `useIsCommunityPostLiked(postId)` |
| **Mutaciones** | `useLikeCommunityPost()` |
| **Dependencias** | Avatar, Badge, Button, Card, Heart, MessageSquare, Eye, Pin |

**Flujo interno:**
1. Renderiza card con datos del post
2. Avatar y nombre son links al perfil del autor
3. Contenido es clickeable para ir al detalle
4. Like button usa mutación con optimistic update
5. Convierte diferentes formatos de fecha a Date

**Datos que obtiene:**
- Post completo viene como prop
- Estado de like viene de query

---

#### `CreatePostForm`

**Archivo:** `src/components/community/create-post-form.tsx`

| Aspecto | Detalle |
|---------|---------|
| **Mutaciones** | `useCreateCommunityPost()` |
| **Dependencias** | react-hook-form, zod, useUserProfile |

---

### 9.2 Componentes de Proyectos

#### `ProjectList`

**Archivo:** `src/components/projects/project-list.tsx`

| Aspecto | Detalle |
|---------|---------|
| **Queries** | `useUserProjects()` |
| **Mutaciones** | `useDeleteProject()` |
| **Dependencias** | ProjectDeleteDialog, ProjectForm |

---

#### `ProjectForm`

**Archivo:** `src/components/projects/project-form.tsx`

| Aspecto | Detalle |
|---------|---------|
| **Mutaciones** | `useCreateProject()`, `useUpdateProject()` |
| **Validación** | Zod schema |
| **Upload** | ProjectImageUpload para imágenes |

---

### 9.3 Componentes de Blog

#### `BlogCard` / `BlogGrid`

**Archivos:** `src/components/blog/blog-card.tsx`, `blog-grid.tsx`

| Aspecto | Detalle |
|---------|---------|
| **Queries** | `useBlogPosts()` (infinite) |
| **Dependencias** | Image carousel para múltiples imágenes |

---

#### `BlogLikeButton`

**Archivo:** `src/components/blog/blog-like-button.tsx`

| Aspecto | Detalle |
|---------|---------|
| **Queries** | `useIsBlogPostLiked(postId)` |
| **Mutaciones** | `useLikeBlogPost()` |

---

### 9.4 Componentes de Perfil

#### `ProfileHeader`

**Archivo:** `src/components/profile/profile-header.tsx`

| Aspecto | Detalle |
|---------|---------|
| **Props** | `profile`, `isOwnProfile`, `userId` |
| **Estado local** | `currentAvatar`, `currentProfile`, `isEditing` |
| **Dependencias** | ProfileImageUpload, ProfileStats, ProfileEditDialog |

**Flujo interno:**
1. Muestra avatar editable si es perfil propio
2. ProfileStats muestra followers/following
3. ProfileEditDialog para editar perfil

---

#### `ProfileImageUpload`

**Archivo:** `src/components/profile/profile-image-upload.tsx`

| Aspecto | Detalle |
|---------|---------|
| **Mutaciones** | `useUpdateProfile()` |
| **Servicio** | `storageService.uploadProfileImage()` |
| **Validación** | 5MB máximo, solo imágenes |

---

### 9.5 Componentes de Uploads

#### Patrón común de upload:

```typescript
// 1. Validar archivo
if (!file.type.startsWith('image/')) throw Error;
if (file.size > limit) throw Error;

// 2. Subir a Storage
const url = await storageService.upload*(userId, file);

// 3. Actualizar documento en Firestore
await updateMutation.mutateAsync({ photoURL: url });

// 4. Invalidar queries
queryClient.invalidateQueries({ queryKey: profileKeys });
```

---

## 10. Estado Global

### 10.1 Zustand

**Estado:** Instalado pero NO utilizado

```json
// package.json
"zustand": "^5.0.1"
```

Zustand está instalado pero no hay ningún store implementado en el proyecto.

### 10.2 Estado Manejado por React Query

| Tipo de Estado | Manejo | Ejemplo |
|----------------|--------|---------|
| Datos del servidor | React Query | Posts, proyectos, usuarios |
| Estado de carga | React Query | `isLoading`, `isFetching` |
| Estado de error | React Query | `error`, `isError` |
| Cache | React Query | `gcTime`, `staleTime` |
| Autenticación | Context | `AuthContext` |
| Toast/Notificaciones | Context | `ToastProvider` |

### 10.3 Qué debería ir a Global State

| Estado | Ubicación Actual | Recomendación |
|--------|------------------|---------------|
| Usuario autenticado | AuthContext | ✅ Correcto |
| Tema (dark/light) | No implementado | Zustand o CSS variables |
| Preferencias de UI | No implementado | Zustand + localStorage |
| Sidebar abierto/cerrado | No implementado | Zustand |
| Filtros globales | Local en componentes | Considerar Zustand |
| Notificaciones pendientes | No implementado | Zustand |

### 10.4 Recomendaciones

1. **Mantener React Query** para todo el estado del servidor
2. **Usar Zustand** para:
   - Preferencias de usuario (tema, idioma)
   - Estado de UI global (sidebars, modales)
   - Carrito/selección (si aplica en futuro)
3. **NO usar Zustand** para:
   - Datos que vienen del servidor (usar React Query)
   - Estado de formularios (usar react-hook-form)

---

## 11. Error Boundaries

### 11.1 Implementación Actual

#### `GlobalErrorBoundary`

**Archivo:** `src/components/shared/global-error-boundary.tsx`

```typescript
export function GlobalErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      scope="global"
      fallback={(reset) => <GlobalErrorFallback onReset={reset} />}
      onError={(error, errorInfo) => {
        logger.error('Global app error', error, {
          component: 'GlobalErrorBoundary',
          scope: 'global',
          errorInfo: { componentStack: errorInfo.componentStack }
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

#### `ErrorBoundary` (Base)

**Archivo:** `src/components/shared/error-boundary.tsx`

- Class component con `getDerivedStateFromError` y `componentDidCatch`
- Soporta `fallback` como ReactNode o función
- Acepta `scope`: `'global' | 'section' | 'component'`
- Callback `onError` para logging personalizado
- Botón de reset y link a home

#### `global-error.tsx`

**Archivo:** `src/app/global-error.tsx`

```typescript
export default function GlobalError({ error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
```

### 11.2 Dónde Existen Error Boundaries

| Ubicación | Tipo | Scope |
|-----------|------|-------|
| `app/layout.tsx` | `GlobalErrorBoundary` | global |
| `app/global-error.tsx` | Next.js Error | global |

### 11.3 Qué Capturan

- **GlobalErrorBoundary:** Errores de rendering React
- **global-error.tsx:** Errores de Next.js (server/client)
- **React Query:** Errores de queries/mutations (via onError)

### 11.4 Lo que Falta Implementar

| Componente/Área | Recomendación | Prioridad |
|-----------------|---------------|-----------|
| Secciones individuales | ErrorBoundary por sección | 🟡 Media |
| Forms complejos | ErrorBoundary local | 🟢 Baja |
| Infinite scrolls | ErrorBoundary con retry | 🟡 Media |
| Image loaders | Fallback de imagen | 🟢 Baja |

### 11.5 Estructura Recomendada

```
app/layout.tsx
└── GlobalErrorBoundary (scope="global")
    └── QueryProvider
        └── AuthProvider
            └── (routes)
                └── SectionErrorBoundary (scope="section")
                    └── ComponentErrorBoundary (scope="component")
```

---

## 12. Testing

### 12.1 Estado Actual

| Aspecto | Estado |
|---------|--------|
| Tests unitarios | ❌ No implementados |
| Tests de integración | ❌ No implementados |
| Tests E2E | ❌ No implementados |
| Testing library | ❌ No configurado |
| Mocks de Firebase | ❌ No configurados |

### 12.2 Partes Sin Tests (Prioridad Alta)

| Módulo | Criticidad | Razón |
|--------|------------|-------|
| `reviewsService` | 🔴 Alta | Maneja transacciones y cálculos de rating |
| Reglas de Firestore | 🔴 Alta | Seguridad de datos |
| Cloud Functions | 🔴 Alta | Lógica de servidor |
| `communityService` | 🟡 Media | CRUD complejo |
| Hooks de React Query | 🟡 Media | Lógica de negocio |
| Formularios | 🟡 Media | Validaciones |

### 12.3 Tests Prioritarios a Implementar

1. **Security Rules Tests (Firestore)**
```typescript
// Ejemplo con @firebase/rules-unit-testing
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

test('users can only read their own data', async () => {
  const db = getTestFirestore({ uid: 'user1' });
  await assertSucceeds(db.collection('users').doc('user1').get());
  await assertFails(db.collection('users').doc('user2').get());
});
```

2. **Cloud Functions Tests**
```typescript
// Ejemplo con firebase-functions-test
import * as functionsTest from 'firebase-functions-test';
const test = functionsTest();

test('onPostLike increments counter', async () => {
  const snap = test.firestore.makeDocumentSnapshot({
    postId: 'post1',
    userId: 'user1'
  }, 'post-likes/like1');
  
  await onPostLike(snap);
  
  const post = await admin.firestore().doc('community-posts/post1').get();
  expect(post.data().likes).toBe(1);
});
```

3. **Service Tests**
```typescript
// Ejemplo con vitest + msw
import { reviewsService } from '@/lib/firebase/reviews';

describe('reviewsService', () => {
  it('creates review and updates rating', async () => {
    const reviewId = await reviewsService.createReview({
      reviewerId: 'user1',
      reviewedUserId: 'user2',
      rating: 5,
      comment: 'Excelente trabajo',
      category: 'quality'
    });
    
    expect(reviewId).toBeDefined();
    const rating = await reviewsService.getUserRating('user2');
    expect(rating.averageRating).toBe(5);
  });
});
```

### 12.4 Stack Recomendado

| Herramienta | Propósito |
|-------------|-----------|
| **Vitest** | Test runner (más rápido que Jest con Vite) |
| **@testing-library/react** | Testing de componentes |
| **@firebase/rules-unit-testing** | Testing de Security Rules |
| **firebase-functions-test** | Testing de Cloud Functions |
| **msw** | Mock de API/Firebase |
| **Playwright** | Tests E2E |

### 12.5 Mock de Firebase para Tests

```typescript
// __mocks__/firebase.ts
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
};

vi.mock('firebase/firestore', () => ({
  getFirestore: () => mockFirestore,
  collection: mockFirestore.collection,
  doc: mockFirestore.doc,
  // ... etc
}));
```

---

## 13. Performance & Optimización

### 13.1 Problemas de Re-render Identificados

| Problema | Ubicación | Impacto | Solución |
|----------|-----------|---------|----------|
| Query por cada card | `CommunityPostCard` | 🟡 Medio | El like status podría precargarse |
| Invalidación masiva | `useLikeCommunityPost` | 🟡 Medio | Actualizar solo el item afectado |
| Profile refetch | Múltiples componentes | 🟢 Bajo | React Query deduplica |

### 13.2 Componentes Pesados

| Componente | Razón | Recomendación |
|------------|-------|---------------|
| `ProfileHeader` | Múltiples sub-componentes + queries | Memoizar sub-componentes |
| `CommunityPostCard` | Formateo de fechas en cada render | `useMemo` para fechas |
| Listas infinitas | Todos los items en DOM | Virtualización |

### 13.3 Oportunidades de Memoización

```typescript
// Ejemplo: Memoizar items de lista
const MemoizedPostCard = memo(CommunityPostCard, (prev, next) => {
  return prev.post.id === next.post.id && 
         prev.post.likes === next.post.likes &&
         prev.post.commentsCount === next.post.commentsCount;
});

// Ejemplo: useMemo para cálculos
const formattedDate = useMemo(() => 
  formatDistanceToNow(convertToDate(post.createdAt), { locale: es }),
  [post.createdAt]
);
```

### 13.4 Virtualización Recomendada

Para listas grandes (>50 items), implementar virtualización:

```typescript
// Recomendado: @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualPostList({ posts }) {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // altura estimada de cada post
  });

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          >
            <CommunityPostCard post={posts[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 13.5 Estructura Recomendada para Listas

```
┌─────────────────────────────────────────────────┐
│              Infinite Query                      │
│  ┌─────────────────────────────────────────────┐│
│  │           Virtual Scroller                   ││
│  │  ┌─────────────────────────────────────────┐││
│  │  │        Memoized Card                    │││
│  │  │  ┌─────────────────────────────────────┐│││
│  │  │  │  Memoized Date | Memoized Avatar    ││││
│  │  │  └─────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────┘││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### 13.6 Configuración de React Query para Performance

```typescript
// Configuración optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      // Structural sharing para evitar re-renders innecesarios
      structuralSharing: true,
    },
  },
});
```

---

## 14. Pendientes Críticos

### Tabla de Pendientes

| # | Pendiente | Riesgo | Prioridad | Impacto | Esfuerzo | Responsable |
|---|-----------|--------|-----------|---------|----------|-------------|
| 1 | Migrar blog-likes a Cloud Functions | Race conditions, inconsistencia de datos | 🔴 Crítico | Alto | Medio | Backend |
| 2 | Migrar resource-likes a Cloud Functions | Race conditions, inconsistencia de datos | 🔴 Crítico | Alto | Medio | Backend |
| 3 | Migrar reviews a Cloud Functions | Manipulación de ratings desde cliente | 🔴 Crítico | Alto | Alto | Backend |
| 4 | Migrar contadores de comentarios | Inconsistencia en contadores | 🟡 Alto | Medio | Medio | Backend |
| 5 | Implementar índices de Firestore | Queries pueden fallar en producción | 🔴 Crítico | Alto | Bajo | DevOps |
| 6 | Corregir regla update de community-posts | Cualquier usuario puede modificar likes | 🔴 Crítico | Alto | Bajo | Backend |
| 7 | Implementar rate limiting | Posible abuso de likes/follows | 🟡 Alto | Medio | Medio | Backend |
| 8 | Agregar tests de Security Rules | Sin validación de seguridad | 🔴 Crítico | Alto | Medio | QA |
| 9 | Agregar tests de Cloud Functions | Sin validación de lógica | 🟡 Alto | Medio | Medio | QA |
| 10 | Implementar virtualización en listas | Performance en listas grandes | 🟡 Alto | Medio | Medio | Frontend |
| 11 | Memoización de componentes | Re-renders innecesarios | 🟢 Medio | Bajo | Bajo | Frontend |
| 12 | Migrar isAdmin a custom claims | Email hardcodeado es inseguro | 🟡 Alto | Medio | Medio | Backend |
| 13 | Implementar Zustand para UI state | Estado de UI disperso | 🟢 Bajo | Bajo | Bajo | Frontend |
| 14 | Configurar testing environment | Sin tests automatizados | 🟡 Alto | Alto | Medio | DevOps |
| 15 | Documentar API interna | Falta documentación de servicios | 🟢 Medio | Medio | Bajo | Docs |

---

## 15. Recomendaciones Senior

### 15.1 Arquitectura

1. **Completar migración a Cloud Functions**
   - El patrón actual (post-likes) está correcto
   - Replicar para todas las operaciones de contador
   - Usar transacciones en el servidor, no en el cliente

2. **Separar responsabilidades**
   - Los servicios del cliente deberían ser thin wrappers
   - La lógica de negocio compleja debe estar en Cloud Functions
   - Considerar Cloud Functions callable para operaciones complejas

3. **Implementar API Layer**
   - Considerar agregar API Routes de Next.js como middleware
   - Esto permite validación extra, rate limiting, y logging centralizado

### 15.2 Seguridad

1. **Custom Claims para roles**
   ```typescript
   // En Cloud Function
   await admin.auth().setCustomUserClaims(uid, { admin: true });
   
   // En Security Rules
   function isAdmin() {
     return request.auth.token.admin == true;
   }
   ```

2. **Rate Limiting**
   - Implementar en Cloud Functions o Edge Middleware
   - Especialmente para likes, follows, y creación de contenido

3. **Validación de URLs**
   - Agregar validación de URLs de imágenes en Security Rules
   - Verificar que las URLs pertenezcan al Storage bucket correcto

4. **Auditoría**
   - Implementar logging de operaciones sensibles
   - Sentry ya está configurado, agregar breadcrumbs estratégicos

### 15.3 Escalabilidad

1. **Índices de Firestore**
   - Crear todos los índices compuestos necesarios ANTES del lanzamiento
   - Monitorear queries lentas en Firebase Console

2. **Denormalización estratégica**
   - Contadores en documentos padre (ya implementado parcialmente)
   - Considerar duplicar nombre/avatar de usuario en documentos relacionados

3. **Paginación consistente**
   - El patrón de cursor está bien implementado
   - Considerar límite máximo en el servidor

4. **Caching**
   - React Query está bien configurado
   - Considerar Redis para datos frecuentemente accedidos (si crece mucho)

### 15.4 Mantenibilidad

1. **Testing**
   - Prioridad máxima: Security Rules y Cloud Functions
   - Agregar tests antes de cada cambio en lógica de negocio
   - CI/CD con tests obligatorios

2. **Monitoreo**
   - Sentry ya está configurado ✅
   - Agregar métricas de negocio (usuarios activos, posts/día)
   - Alertas en errores críticos

3. **Documentación**
   - Mantener este documento actualizado
   - Agregar JSDoc a funciones públicas
   - Documentar decisiones de arquitectura

4. **Code Review**
   - Establecer guidelines de PR
   - Revisar especialmente cambios en reglas de seguridad
   - Verificar que los tests pasen

### 15.5 Próximos Pasos Recomendados

```
Fase 1 (Semana 1-2): Seguridad
├── Corregir regla de update en community-posts
├── Crear índices de Firestore
├── Implementar tests de Security Rules
└── Migrar blog-likes a Cloud Functions

Fase 2 (Semana 3-4): Cloud Functions
├── Migrar resource-likes
├── Migrar reviews
├── Migrar contadores de comentarios
└── Implementar tests de Cloud Functions

Fase 3 (Semana 5-6): Performance
├── Implementar virtualización
├── Memoización de componentes
├── Optimizar queries de React Query
└── Benchmark de performance

Fase 4 (Continuo): Mantenimiento
├── Configurar CI/CD con tests
├── Documentación continua
├── Monitoreo y alertas
└── Code reviews estrictos
```

---

## Apéndice A: Glosario

| Término | Definición |
|---------|------------|
| **Cloud Function** | Función serverless que se ejecuta en Firebase |
| **Trigger** | Evento que dispara una Cloud Function |
| **Firestore** | Base de datos NoSQL de Firebase |
| **Security Rules** | Reglas que definen permisos de lectura/escritura |
| **React Query** | Librería para manejo de estado del servidor |
| **Optimistic Update** | Actualizar UI antes de confirmar con el servidor |
| **staleTime** | Tiempo que los datos se consideran frescos |
| **gcTime** | Tiempo que los datos permanecen en caché |
| **Infinite Query** | Query con paginación infinita |
| **Mutation** | Operación que modifica datos |

---

## Apéndice B: Comandos Útiles

```bash
# Desarrollo local
npm run dev                    # Iniciar Next.js
firebase emulators:start       # Iniciar emuladores

# Deploy
npm run build                  # Build de producción
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage

# Testing (cuando se implemente)
npm test                       # Ejecutar tests
npm run test:coverage          # Tests con coverage
```

---

**Documento generado para STARLOGIC**  
**Última actualización:** Noviembre 2025






