# Documentación Técnica - STARLOGIC

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
4. [Estructura de Directorios](#estructura-de-directorios)
5. [Configuración y Setup](#configuración-y-setup)
6. [Componentes Principales](#componentes-principales)
7. [Gestión de Estado y Queries](#gestión-de-estado-y-queries)
8. [Servicios de Firebase](#servicios-de-firebase)
9. [Sistema de Autenticación](#sistema-de-autenticación)
10. [Módulos Principales](#módulos-principales)
11. [Cambios Recientes](#cambios-recientes)
12. [Guías de Desarrollo](#guías-de-desarrollo)
13. [Troubleshooting](#troubleshooting)

---

## Introducción

**STARLOGIC** es una plataforma web desarrollada con Next.js 15 y Firebase, diseñada para conectar electricistas, proveedores y usuarios en un ecosistema colaborativo. La aplicación permite gestionar proyectos eléctricos, compartir conocimiento a través de blogs y comunidad, y establecer relaciones profesionales mediante un sistema de seguimiento.

### Características Principales

- ✅ **Gestión de Proyectos**: Creación, edición y seguimiento de proyectos eléctricos
- ✅ **Blog Técnico**: Publicación de artículos y contenido educativo
- ✅ **Comunidad**: Foro de discusión con posts, comentarios y likes
- ✅ **Perfiles de Usuario**: Sistema completo de perfiles con estadísticas
- ✅ **Sistema de Seguimiento**: Followers/Following entre usuarios
- ✅ **Recursos**: Biblioteca de recursos técnicos
- ✅ **Reseñas y Valoraciones**: Sistema de calificaciones para usuarios
- ✅ **Panel de Administración**: Gestión de contenido y usuarios

---

## Stack Tecnológico

### Frontend

- **Next.js 15.0.3** - Framework React con App Router
- **React 18.3.1** - Biblioteca de UI
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 3.4.1** - Framework de estilos
- **shadcn/ui** - Componentes UI basados en Radix UI
- **React Hook Form 7.53.2** - Manejo de formularios
- **Zod 3.23.8** - Validación de esquemas
- **date-fns 4.1.0** - Manipulación de fechas
- **Lucide React** - Iconos

### Estado y Datos

- **TanStack Query (React Query) 5.59.20** - Gestión de estado del servidor y caché
- **Zustand 5.0.1** - Estado global (si se requiere)

### Backend y Base de Datos

- **Firebase 11.0.1** - Backend as a Service
  - **Firestore** - Base de datos NoSQL
  - **Firebase Auth** - Autenticación
  - **Firebase Storage** - Almacenamiento de archivos
- **Firebase Admin 12.7.0** - SDK de administración (Cloud Functions)

### Cloud Functions

- **TypeScript** - Lenguaje para funciones
- Triggers de Firestore para actualizaciones automáticas de contadores

### Herramientas de Desarrollo

- **ESLint** - Linter
- **PostCSS** - Procesador de CSS
- **React Query DevTools** - Herramientas de desarrollo para queries

---

## Arquitectura del Proyecto

### Patrón de Arquitectura

El proyecto sigue una **arquitectura modular basada en features**, organizando el código por funcionalidades en lugar de por tipo de archivo. Utiliza el **App Router de Next.js 15** con grupos de rutas para separar rutas públicas, protegidas y de autenticación.

### Principios de Diseño

1. **Separación de Responsabilidades**: Cada módulo tiene responsabilidades claras
2. **Reutilización de Código**: Componentes y hooks compartidos
3. **Type Safety**: TypeScript en todo el proyecto
4. **Optimistic Updates**: Actualizaciones optimistas para mejor UX
5. **Error Handling**: Manejo centralizado de errores
6. **Código Limpio**: Componentes pequeños y enfocados

### Flujo de Datos

```
Usuario → Componente → Hook (React Query) → Servicio Firebase → Firestore
                ↓
         Optimistic Update → UI Actualizada
                ↓
         Invalidación de Query → Sincronización con Servidor
```

---

## Estructura de Directorios

```
zunitex/
├── src/
│   ├── app/                          # App Router de Next.js
│   │   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (protected)/             # Rutas protegidas (requieren auth)
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── projects/
│   │   │   └── admin/
│   │   ├── (public)/                 # Rutas públicas
│   │   │   ├── blog/
│   │   │   ├── community/
│   │   │   └── page.tsx              # Home
│   │   ├── api/                      # API Routes
│   │   └── layout.tsx                # Layout raíz
│   │
│   ├── components/                   # Componentes React
│   │   ├── ui/                       # Componentes UI base (shadcn)
│   │   ├── shared/                   # Componentes compartidos
│   │   ├── forms/                    # Formularios
│   │   ├── blog/                     # Componentes de blog
│   │   ├── community/                 # Componentes de comunidad
│   │   ├── projects/                  # Componentes de proyectos
│   │   ├── profile/                   # Componentes de perfil
│   │   └── ...
│   │
│   ├── lib/                          # Librerías y utilidades
│   │   ├── context/                  # Contextos de React
│   │   │   └── auth-context.tsx      # Contexto de autenticación
│   │   ├── firebase/                  # Servicios de Firebase
│   │   │   ├── config.ts             # Configuración de Firebase
│   │   │   ├── projects.ts           # Servicio de proyectos
│   │   │   ├── blog.ts               # Servicio de blog
│   │   │   ├── community.ts          # Servicio de comunidad
│   │   │   └── ...
│   │   ├── react-query/               # Hooks de React Query
│   │   │   └── queries.ts            # Todas las queries centralizadas
│   │   ├── providers/                 # Providers de React
│   │   │   └── query-provider.tsx    # Provider de React Query
│   │   ├── services/                  # Servicios adicionales
│   │   │   ├── storage-service.ts    # Servicio de Storage
│   │   │   └── db-service.ts         # Servicio de DB
│   │   ├── utils/                     # Utilidades
│   │   │   └── logger.ts             # Sistema de logging
│   │   └── validations/               # Esquemas de validación
│   │
│   ├── hooks/                         # Hooks personalizados
│   │   ├── queries/                  # Hooks de queries específicos
│   │   └── use-toast.ts              # Hook de toast
│   │
│   └── types/                         # Definiciones de tipos TypeScript
│       ├── project.ts
│       ├── blog.ts
│       ├── community.ts
│       └── ...
│
├── functions/                         # Cloud Functions
│   ├── src/
│   │   ├── triggers/                 # Triggers de Firestore
│   │   └── utils/                     # Utilidades de funciones
│   └── package.json
│
├── public/                            # Archivos estáticos
├── firestore.rules                    # Reglas de seguridad de Firestore
├── storage.rules                      # Reglas de seguridad de Storage
├── firestore.indexes.json             # Índices de Firestore
├── next.config.ts                     # Configuración de Next.js
├── tsconfig.json                      # Configuración de TypeScript
└── package.json                        # Dependencias del proyecto
```

---

## Configuración y Setup

### Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase
- Firebase CLI (para deploy)

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd zunitex

# Instalar dependencias
npm install

# Instalar dependencias de Cloud Functions
cd functions
npm install
cd ..
```

### Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo en localhost:3000

# Producción
npm run build           # Construye la aplicación para producción
npm start               # Inicia el servidor de producción

# Linting
npm run lint            # Ejecuta ESLint
```

### Configuración de Firebase Emulators (Desarrollo)

El proyecto está configurado para usar emuladores de Firebase en desarrollo. Los emuladores se conectan automáticamente cuando `NODE_ENV === 'development'`.

**Emuladores configurados:**
- Firestore: `localhost:8080`
- Auth: `localhost:9099` (opcional, comentado)
- Storage: `localhost:9199` (opcional, comentado)

Para iniciar los emuladores:

```bash
firebase emulators:start
```

---

## Componentes Principales

### Componentes UI Base (shadcn/ui)

Ubicación: `src/components/ui/`

Componentes reutilizables basados en Radix UI:
- `Button` - Botones con variantes
- `Card` - Tarjetas de contenido
- `Dialog` - Modales
- `Form` - Formularios con validación
- `Input`, `Textarea` - Campos de entrada
- `Select` - Selectores
- `Toast` - Notificaciones
- `Avatar` - Avatares de usuario
- `Badge` - Etiquetas
- `Tabs` - Pestañas
- Y más...

### Componentes Compartidos

Ubicación: `src/components/shared/`

- **`ProtectedRoute`**: Componente HOC para proteger rutas
- **`ErrorBoundary`**: Manejo de errores de React
- **`GlobalErrorBoundary`**: Error boundary global
- **`ProtectedNavbar`**: Navbar para usuarios autenticados
- **`PublicNavbar`**: Navbar para usuarios no autenticados

### Componentes por Feature

#### Blog (`src/components/blog/`)
- `BlogCard` - Tarjeta de post de blog
- `BlogGrid` - Grid de posts
- `BlogCommentSection` - Sección de comentarios
- `BlogLikeButton` - Botón de like
- `BlogFilters` - Filtros de búsqueda
- `FeaturedPosts` - Posts destacados

#### Comunidad (`src/components/community/`)
- `CommunityPostCard` - Tarjeta de post
- `CreatePostForm` - Formulario de creación
- `CommunityCommentSection` - Sección de comentarios
- `CommunitySidebar` - Sidebar con estadísticas
- `CommunityPostFilters` - Filtros

#### Proyectos (`src/components/projects/`)
- `ProjectList` - Lista de proyectos
- `ProjectForm` - Formulario de proyecto
- `ProjectCommentSection` - Comentarios
- `ProjectImageUpload` - Subida de imágenes
- `ProjectDeleteDialog` - Confirmación de eliminación

#### Perfil (`src/components/profile/`)
- `ProfileHeader` - Encabezado del perfil
- `ProfileEditDialog` - Diálogo de edición
- `ProfileImageUpload` - Subida de foto de perfil
- `ProfileStats` - Estadísticas del usuario
- `ProfileTabs` - Pestañas de contenido
- `ProfileSidebar` - Sidebar de información

---

## Gestión de Estado y Queries

### React Query (TanStack Query)

El proyecto utiliza **React Query** como solución principal para la gestión de estado del servidor. Todas las queries están centralizadas en `src/lib/react-query/queries.ts`.

### Configuración del Query Provider

Ubicación: `src/lib/providers/query-provider.tsx`

```typescript
// Configuración global de React Query
- staleTime: 3 minutos (datos considerados frescos)
- gcTime: 10 minutos (tiempo en caché)
- refetchOnWindowFocus: false (no refetch automático)
- refetchOnReconnect: true (refetch al reconectar)
```

### Estructura de Query Keys

Las query keys están organizadas por entidad:

```typescript
queryKeys = {
  projects: {
    all: ['projects'],
    lists: () => ['projects', 'list'],
    detail: (id) => ['projects', 'detail', id]
  },
  blog: { ... },
  community: { ... },
  profile: { ... },
  // etc.
}
```

### Hooks Principales de Queries

#### Proyectos
- `useProjects(filters?)` - Lista de proyectos con filtros
- `useUserProjects()` - Proyectos del usuario actual
- `useProject(projectId)` - Detalle de un proyecto
- `useCreateProject()` - Crear proyecto
- `useUpdateProject()` - Actualizar proyecto
- `useDeleteProject()` - Eliminar proyecto

#### Blog
- `useBlogPosts(filters?)` - Lista de posts
- `useBlogPost(postId)` - Detalle de un post
- `useBlogComments(postId)` - Comentarios de un post
- `useLikeBlogPost()` - Like/unlike de un post
- `useIsBlogPostLiked(postId)` - Estado de like

#### Comunidad
- `useCommunityPosts(filters?)` - Lista de posts (infinite query)
- `useCommunityPost(postId)` - Detalle de un post
- `useCreateCommunityPost()` - Crear post
- `useLikeCommunityPost()` - Like/unlike con optimistic updates
- `useIsCommunityPostLiked(postId)` - Estado de like
- `useCommunityPostComments(postId)` - Comentarios

#### Perfil
- `useUserProfile()` - Perfil del usuario actual
- `useUserProfileById(userId)` - Perfil de otro usuario
- `useUpdateProfile()` - Actualizar perfil

#### Seguimiento
- `useFollowers(userId)` - Seguidores de un usuario
- `useFollowing(userId)` - Usuarios que sigue
- `useIsFollowing(followerId, followingId)` - Estado de seguimiento
- `useFollowUser()` - Seguir/dejar de seguir

### Optimistic Updates

El proyecto implementa **optimistic updates** para mejorar la experiencia de usuario. Ejemplo en `useLikeCommunityPost`:

```typescript
onMutate: async ({ postId, like }) => {
  // 1. Cancelar queries en progreso
  await queryClient.cancelQueries(...)
  
  // 2. Guardar estado anterior
  const previousPost = queryClient.getQueryData(...)
  const previousLists = queryClient.getQueriesData(...)
  
  // 3. Actualizar optimísticamente
  queryClient.setQueryData(...) // Detalle
  queryClient.setQueriesData(...) // Listas
  
  // 4. Retornar contexto para rollback
  return { previousPost, previousLists }
}
```

**Ventajas:**
- UI responde instantáneamente
- Mejor experiencia de usuario
- Rollback automático en caso de error

---

## Servicios de Firebase

### Estructura de Servicios

Todos los servicios de Firebase están en `src/lib/firebase/` y siguen un patrón consistente:

```typescript
// Ejemplo: src/lib/firebase/projects.ts
export const projectsService = {
  getProjects: async (options) => { ... },
  getProject: async (id) => { ... },
  createProject: async (data) => { ... },
  updateProject: async (id, data) => { ... },
  deleteProject: async (id) => { ... }
}
```

### Servicios Disponibles

1. **`projects.ts`** - Gestión de proyectos
2. **`blog.ts`** - Gestión de posts de blog
3. **`blog-comments.ts`** - Comentarios de blog
4. **`blog-likes.ts`** - Likes de blog
5. **`community.ts`** - Posts de comunidad
6. **`comments.ts`** - Comentarios de proyectos
7. **`followers.ts`** - Sistema de seguimiento
8. **`reviews.ts`** - Reseñas y valoraciones
9. **`resources.ts`** - Recursos técnicos
10. **`storage.ts`** - Operaciones de Storage
11. **`init-db.ts`** - Inicialización de base de datos

### Configuración de Firebase

Ubicación: `src/lib/firebase/config.ts`

```typescript
// Inicialización de Firebase
- app: Firebase App
- auth: Firebase Auth
- db: Firestore Database
- storage: Firebase Storage

// Conexión automática a emuladores en desarrollo
```

---

## Sistema de Autenticación

### Auth Context

Ubicación: `src/lib/context/auth-context.tsx`

El contexto de autenticación proporciona:
- Estado del usuario actual
- Estado de carga de autenticación
- Funciones: `signUp`, `signIn`, `logout`

### Flujo de Autenticación

1. **Registro** (`signUp`):
   - Crea usuario en Firebase Auth
   - Crea documento en Firestore `users/{uid}`
   - Inicializa campos por defecto

2. **Inicio de Sesión** (`signIn`):
   - Autentica con Firebase Auth
   - Actualiza `lastLogin` en Firestore

3. **Estado de Autenticación**:
   - `onAuthStateChanged` escucha cambios
   - Actualiza contexto automáticamente
   - Muestra loader durante inicialización

### Rutas Protegidas

Las rutas protegidas están en `src/app/(protected)/` y utilizan:
- `ProtectedRoute` component
- `ProtectedLayout` para layout común
- Verificación de autenticación automática

### Roles de Usuario

- `user` - Usuario estándar
- `electrician` - Electricista
- `provider` - Proveedor
- `admin` - Administrador

---

## Módulos Principales

### 1. Módulo de Proyectos

**Rutas:**
- `/projects` - Lista de proyectos
- `/projects/[id]` - Detalle de proyecto

**Características:**
- CRUD completo de proyectos
- Sistema de comentarios
- Subida de imágenes
- Filtros por categoría, estado, ubicación
- Estadísticas de proyectos

**Colecciones Firestore:**
- `projects` - Proyectos principales
- `comments` - Comentarios de proyectos

### 2. Módulo de Blog

**Rutas:**
- `/blog` - Lista de posts
- `/blog/[id]` - Detalle de post

**Características:**
- Posts con markdown
- Sistema de likes
- Comentarios anidados
- Categorías y tags
- Posts destacados
- Filtros avanzados

**Colecciones Firestore:**
- `blog` - Posts de blog
- `blogComments` - Comentarios
- `blogLikes` - Likes

### 3. Módulo de Comunidad

**Rutas:**
- `/community` - Lista de posts
- `/community/[id]` - Detalle de post

**Características:**
- Posts de comunidad con categorías
- Sistema de likes con optimistic updates
- Comentarios
- Filtros por categoría
- Sidebar con estadísticas
- Paginación infinita

**Colecciones Firestore:**
- `community` - Posts de comunidad
- `communityComments` - Comentarios
- `communityLikes` - Likes

**Optimistic Updates Implementados:**
- Actualización inmediata del contador de likes
- Actualización en lista y detalle simultáneamente
- Rollback automático en caso de error

### 4. Módulo de Perfiles

**Rutas:**
- `/profile` - Perfil propio
- `/profile/[userId]` - Perfil de otro usuario

**Características:**
- Edición de perfil
- Subida de foto de perfil
- Estadísticas (proyectos, reseñas, seguidores)
- Tabs de contenido (proyectos, reseñas, certificaciones, galería, actividad)
- Sistema de seguimiento

**Colecciones Firestore:**
- `users` - Perfiles de usuario

### 5. Módulo de Seguimiento

**Características:**
- Seguir/dejar de seguir usuarios
- Lista de seguidores y seguidos
- Actualización de contadores en tiempo real

**Colecciones Firestore:**
- `followers` - Relaciones de seguimiento

### 6. Módulo de Recursos

**Características:**
- Biblioteca de recursos técnicos
- Sistema de likes
- Categorización

**Colecciones Firestore:**
- `resources` - Recursos
- `resourceLikes` - Likes de recursos

### 7. Módulo de Reseñas

**Características:**
- Reseñas de usuarios
- Sistema de valoración (1-5 estrellas)
- Cálculo de promedio de valoraciones

**Colecciones Firestore:**
- `reviews` - Reseñas

### 8. Módulo de Administración

**Rutas:**
- `/admin` - Panel principal
- `/admin/blog` - Gestión de blog

**Características:**
- Gestión de contenido
- Inicialización de base de datos
- Herramientas administrativas

---

## Cambios Recientes

### 1. Corrección de Persistencia de Perfil (Última actualización)

**Problema:** Los cambios en el perfil no se guardaban correctamente al navegar entre páginas.

**Solución Implementada:**

#### a) Invalidación de Queries en ProfileEditDialog
**Archivo:** `src/components/profile/profile-edit-dialog.tsx`

```typescript
// Agregado: Invalidación de query después de actualizar
await queryClient.invalidateQueries({ 
  queryKey: queryKeys.profile.detail(user.uid) 
});
```

#### b) Invalidación de Queries en ProfileImageUpload
**Archivo:** `src/components/profile/profile-image-upload.tsx`

```typescript
// Agregado: Invalidación de query después de subir/eliminar foto
await queryClient.invalidateQueries({ 
  queryKey: queryKeys.profile.detail(user.uid) 
});
```

#### c) Sincronización de Estado en ProfileHeader
**Archivo:** `src/components/profile/profile-header.tsx`

```typescript
// Agregado: useEffect para sincronizar estado local con prop profile
useEffect(() => {
  setCurrentProfile(profile);
  setCurrentAvatar(profile.photoURL ?? null);
}, [profile]);
```

#### d) Corrección de Carga de Perfil Propio
**Archivo:** `src/app/(protected)/profile/page.tsx`

```typescript
// Agregado: Esperar a que la autenticación termine de cargar
const { user, loading: authLoading } = useAuth();

if (authLoading) {
  return <Loader />;
}

if (!user) {
  return <Error message="Debes iniciar sesión" />;
}
```

#### e) Inclusión de ID en useUserProfile
**Archivo:** `src/lib/react-query/queries.ts`

```typescript
// Modificado: Incluir id del usuario en el perfil devuelto
const profileData = docSnap.data() as UserProfile;
return { ...profileData, id: user.uid } as UserProfile;
```

**Resultado:** Los cambios del perfil ahora persisten correctamente y se reflejan inmediatamente al navegar.

---

### 2. Optimistic Updates en Likes de Comunidad

**Problema:** El contador de likes no se actualizaba inmediatamente al dar like.

**Solución Implementada:**

**Archivo:** `src/lib/react-query/queries.ts` - `useLikeCommunityPost`

#### Mejoras en onMutate:

```typescript
onMutate: async ({ postId, like }) => {
  // 1. Cancelar queries en progreso
  await queryClient.cancelQueries({ 
    queryKey: queryKeys.community.likeStatus(postId, user?.uid || '') 
  });
  await queryClient.cancelQueries({ 
    queryKey: queryKeys.community.detail(postId) 
  });
  await queryClient.cancelQueries({ 
    queryKey: queryKeys.community.lists() 
  });

  // 2. Guardar estado anterior
  const previousStatus = queryClient.getQueryData<boolean>(...);
  const previousPost = queryClient.getQueryData<CommunityPost>(...);
  const previousLists = queryClient.getQueriesData<InfiniteData>(...);

  // 3. Optimistic update del estado de like
  queryClient.setQueryData(...);

  // 4. Optimistic update del contador en detalle
  if (previousPost) {
    queryClient.setQueryData<CommunityPost>(...);
  }

  // 5. Optimistic update del contador en TODAS las listas (infinite query)
  queryClient.setQueriesData<InfiniteData>(
    { queryKey: queryKeys.community.lists() },
    (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) =>
            post.id === postId
              ? { ...post, likes: like ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1) }
              : post
          ),
        })),
      };
    }
  );

  return { previousStatus, previousPost, previousLists };
}
```

#### Mejoras en onError:

```typescript
onError: (error, variables, context) => {
  // Revertir estado de like
  if (context?.previousStatus !== undefined) {
    queryClient.setQueryData(...);
  }
  // Revertir contador en detalle
  if (context?.previousPost) {
    queryClient.setQueryData<CommunityPost>(...);
  }
  // Revertir cambios en TODAS las listas
  if (context?.previousLists) {
    context.previousLists.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  }
  // ... manejo de error
}
```

**Resultado:** El contador de likes se actualiza instantáneamente tanto en la lista como en el detalle del post, sin necesidad de navegar o refrescar.

---

### 3. Migración a React Query

El proyecto migró de un sistema de estado local a **React Query (TanStack Query)** para:
- Mejor gestión de caché
- Sincronización automática con el servidor
- Optimistic updates
- Invalidación inteligente de queries
- Mejor manejo de estados de carga y error

**Archivo principal:** `src/lib/react-query/queries.ts` (1654+ líneas)

---

## Guías de Desarrollo

### Agregar una Nueva Query

1. **Definir la query key** en `queryKeys`:

```typescript
export const queryKeys = {
  nuevaEntidad: {
    all: ['nuevaEntidad'] as const,
    lists: () => [...queryKeys.nuevaEntidad.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.nuevaEntidad.all, 'detail', id] as const,
  }
}
```

2. **Crear el hook de query**:

```typescript
export function useNuevaEntidad(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.nuevaEntidad.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('ID requerido');
      return await nuevoService.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
```

3. **Crear el hook de mutación**:

```typescript
export function useCreateNuevaEntidad() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: NuevaEntidadData) => {
      return await nuevoService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.nuevaEntidad.lists() 
      });
      toast({ title: 'Éxito', description: 'Creado correctamente' });
    },
    onError: (error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: getFirebaseErrorMessage(error) 
      });
    },
  });
}
```

### Agregar Optimistic Updates

```typescript
onMutate: async (variables) => {
  // 1. Cancelar queries
  await queryClient.cancelQueries({ queryKey: ... });
  
  // 2. Guardar estado anterior
  const previousData = queryClient.getQueryData(...);
  
  // 3. Actualizar optimísticamente
  queryClient.setQueryData(..., (old) => {
    // Lógica de actualización
    return updatedData;
  });
  
  // 4. Retornar contexto
  return { previousData };
},
onError: (error, variables, context) => {
  // Revertir cambios
  if (context?.previousData) {
    queryClient.setQueryData(..., context.previousData);
  }
}
```

### Agregar un Nuevo Componente

1. Crear archivo en la carpeta correspondiente: `src/components/[feature]/nuevo-componente.tsx`
2. Usar componentes UI de `src/components/ui/`
3. Implementar tipos TypeScript
4. Usar hooks de React Query para datos
5. Manejar estados de carga y error

### Agregar una Nueva Ruta

1. Crear archivo `page.tsx` en la ruta correspondiente:
   - `src/app/(public)/` - Rutas públicas
   - `src/app/(protected)/` - Rutas protegidas
   - `src/app/(auth)/` - Rutas de autenticación

2. Para rutas dinámicas: `[param]/page.tsx`

3. Usar `useParams()` para obtener parámetros:

```typescript
const params = useParams();
const id = params.id as string;
```

### Agregar Validación de Formularios

1. Crear esquema Zod en `src/lib/validations/`:

```typescript
import { z } from 'zod';

export const nuevoSchema = z.object({
  campo1: z.string().min(2, 'Mínimo 2 caracteres'),
  campo2: z.number().positive(),
});
```

2. Usar en formulario:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(nuevoSchema),
  defaultValues: { ... }
});
```

---

## Troubleshooting

### Problema: Los cambios no se guardan

**Solución:**
- Verificar que se está invalidando la query después de la mutación
- Asegurar que `onSuccess` en la mutación invalida las queries correctas
- Verificar que el componente está usando la query actualizada

### Problema: Optimistic updates no funcionan

**Solución:**
- Verificar que se está cancelando queries en `onMutate`
- Asegurar que se guarda el estado anterior correctamente
- Verificar que la estructura de datos en `setQueryData` coincide con la estructura de la query

### Problema: Error de autenticación

**Solución:**
- Verificar variables de entorno de Firebase
- Asegurar que el usuario está autenticado antes de hacer operaciones
- Verificar reglas de seguridad de Firestore

### Problema: Imágenes no se cargan

**Solución:**
- Verificar configuración de `next.config.ts` para `remotePatterns`
- Verificar reglas de Storage
- Verificar que las URLs de imágenes son válidas

### Problema: Queries no se actualizan

**Solución:**
- Verificar que `staleTime` no es demasiado largo
- Asegurar que se están invalidando las queries correctas
- Verificar que `enabled` está configurado correctamente

---

## Convenciones de Código

### Nombres de Archivos
- Componentes: `kebab-case.tsx` (ej: `profile-header.tsx`)
- Hooks: `use-kebab-case.ts` (ej: `use-profile.ts`)
- Servicios: `kebab-case.ts` (ej: `projects.ts`)
- Tipos: `kebab-case.ts` (ej: `project.ts`)

### Nombres de Componentes
- PascalCase: `ProfileHeader`, `ProjectCard`

### Nombres de Funciones
- camelCase: `getProjects`, `createProject`

### Nombres de Constantes
- UPPER_SNAKE_CASE: `MAX_FILE_SIZE`, `API_BASE_URL`

### Imports
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

## Seguridad

### Reglas de Firestore

Ubicación: `firestore.rules`

Las reglas están configuradas para:
- Permitir lectura pública de contenido público
- Restringir escritura a usuarios autenticados
- Validar propiedad de recursos
- Proteger datos sensibles

### Reglas de Storage

Ubicación: `storage.rules`

Las reglas están configuradas para:
- Permitir subida de imágenes de perfil solo al propio usuario
- Validar tipos de archivo
- Limitar tamaño de archivos

---

## Performance

### Optimizaciones Implementadas

1. **React Query Caching**: Caché inteligente de datos
2. **Image Optimization**: Next.js Image component
3. **Code Splitting**: Automático con Next.js
4. **Lazy Loading**: Componentes cargados bajo demanda
5. **Infinite Queries**: Paginación eficiente para listas grandes

### Métricas a Monitorear

- Tiempo de carga inicial
- Tiempo de respuesta de queries
- Uso de memoria
- Tamaño del bundle

---

## Testing (Futuro)

El proyecto actualmente no incluye tests, pero se recomienda agregar:

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Para flujos completos
- **E2E Tests**: Playwright o Cypress

---

## Deployment

### Vercel (Recomendado)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

---

## Contacto y Soporte

Para preguntas o problemas:
- Revisar esta documentación
- Consultar logs en consola del navegador
- Revisar Firebase Console para errores de backend
- Consultar documentación de Next.js y Firebase

---

## Changelog

### Versión Actual
- ✅ Sistema de perfil con persistencia corregida
- ✅ Optimistic updates en likes de comunidad
- ✅ Migración completa a React Query
- ✅ Sistema de autenticación robusto
- ✅ Módulos de blog, comunidad, proyectos funcionales

---

**Última actualización:** Diciembre 2024
**Versión del documento:** 1.0.0







