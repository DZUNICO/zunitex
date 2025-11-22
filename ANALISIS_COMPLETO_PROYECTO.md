# 📊 ANÁLISIS COMPLETO DEL PROYECTO ELECTRICIANHUB

**Fecha del análisis**: Diciembre 2024  
**Última actualización**: Diciembre 2024 - Visualización de perfiles visitantes y correcciones de Timestamps  
**Proyecto**: ElectricianHub (Zunitex)  
**Framework**: Next.js 15.0.3 con React 18.1

---

## 📁 TAREA 1: ESTRUCTURA DE CARPETAS Y ARCHIVOS

### 1.1 Árbol Visual Completo

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   ├── forgot-password/
│   │   │   └── page.tsx          # Recuperación de contraseña
│   │   ├── login/
│   │   │   └── page.tsx          # Página de login
│   │   ├── register/
│   │   │   └── page.tsx          # Página de registro
│   │   └── layout.tsx            # Layout para rutas auth
│   ├── (protected)/              # Grupo de rutas protegidas
│   │   ├── admin/                # Panel de administración
│   │   │   ├── blog/
│   │   │   │   ├── newpost/
│   │   │   │   │   └── page.tsx  # Crear nuevo post de blog
│   │   │   │   └── page.tsx      # Lista de posts del blog
│   │   │   ├── layout.tsx        # Layout admin con protección
│   │   │   └── page.tsx          # Dashboard admin
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard principal del usuario
│   │   ├── profile/
│   │   │   ├── [userId]/
│   │   │   │   └── page.tsx      # Página de perfil de otro usuario
│   │   │   └── page.tsx          # Página de perfil del usuario autenticado
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Detalle de proyecto
│   │   │   └── page.tsx          # Lista de proyectos
│   │   └── layout.tsx            # Layout protegido con navbar
│   ├── (public)/                 # Grupo de rutas públicas
│   │   ├── blog/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Detalle de post de blog
│   │   │   └── page.tsx          # Lista de posts del blog
│   │   ├── community/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Detalle de post de comunidad
│   │   │   └── page.tsx          # Lista de posts de comunidad
│   │   ├── layout.tsx            # Layout público con navbar
│   │   └── page.tsx              # Página de inicio
│   ├── api/                      # API Routes
│   │   └── init-blog/
│   │       └── route.ts          # Endpoint para inicializar blog
│   ├── favicon.ico
│   ├── fonts/                    # Fuentes personalizadas
│   │   ├── GeistMonoVF.woff
│   │   └── GeistVF.woff
│   ├── globals.css               # Estilos globales
│   └── layout.tsx                # Layout raíz de la aplicación
├── components/                   # Componentes React
│   ├── admin/
│   │   └── database-initializer.tsx  # Inicializador de BD (admin)
│   ├── blog/                     # Componentes del blog
│   │   ├── blog-card.tsx         # Tarjeta de post del blog
│   │   ├── blog-comment-section.tsx  # Sección de comentarios
│   │   ├── blog-filters.tsx      # Filtros del blog
│   │   ├── blog-grid.tsx         # Grid de posts
│   │   ├── blog-like-button.tsx  # Botón de like
│   │   ├── category-tabs.tsx     # Pestañas de categorías
│   │   ├── featured-posts.tsx    # Posts destacados
│   │   └── image-carousel.tsx    # Carrusel de imágenes
│   ├── community/                # Componentes de comunidad
│   │   ├── community-comment-section.tsx  # Comentarios de post
│   │   ├── community-post-card.tsx        # Tarjeta de post
│   │   ├── community-post-filters.tsx     # Filtros
│   │   ├── community-sidebar.tsx          # Barra lateral
│   │   └── create-post-form.tsx           # Formulario crear post
│   ├── dashboard/                # Componentes del dashboard
│   │   ├── recent-projects.tsx   # Proyectos recientes
│   │   └── stats-cards.tsx       # Tarjetas de estadísticas
│   ├── dev/                      # Componentes de desarrollo
│   │   └── create-sample-post.tsx  # Generar posts de ejemplo
│   ├── followers/                # Sistema de seguidores
│   │   └── follow-button.tsx     # Botón seguir/dejar de seguir
│   ├── forms/                    # Formularios
│   │   ├── forgot-password-form.tsx
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── home/                     # Componentes de inicio
│   │   ├── blog-posts.tsx        # Posts del blog en home
│   │   ├── featured-projects.tsx # Proyectos destacados
│   │   └── hero.tsx              # Sección hero
│   ├── profile/                  # Componentes de perfil
│   │   ├── profile-edit-dialog.tsx    # Diálogo editar perfil
│   │   ├── profile-header.tsx         # Encabezado de perfil (soporta perfil propio/visitante)
│   │   ├── profile-image-upload.tsx   # Subir imagen de perfil
│   │   ├── profile-sidebar.tsx        # Sidebar con información adicional (ubicación, especialidades)
│   │   ├── profile-stats.tsx          # Estadísticas del perfil (soporta userId opcional)
│   │   └── profile-tabs.tsx           # Pestañas del perfil (soporta userId opcional)
│   ├── projects/                 # Componentes de proyectos
│   │   ├── project-comment-section.tsx  # Comentarios de proyecto
│   │   ├── project-delete-dialog.tsx    # Diálogo eliminar
│   │   ├── project-form.tsx             # Formulario crear/editar
│   │   ├── project-image-upload.tsx     # Subir imágenes
│   │   └── project-list.tsx             # Lista de proyectos
│   ├── providers/                # Providers de React
│   │   ├── navigation-progress.tsx      # Barra de progreso de navegación
│   │   └── toast-provider.tsx           # Provider de toasts
│   ├── shared/                   # Componentes compartidos
│   │   ├── admin-route.tsx       # Protección de rutas admin
│   │   ├── protected-navbar.tsx  # Navbar para usuarios autenticados
│   │   ├── protected-route.tsx   # Componente de protección
│   │   └── public-navbar.tsx     # Navbar público
│   └── ui/                       # Componentes UI base (shadcn/ui)
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── loader.tsx
│       ├── select.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       └── toaster.tsx
├── hooks/                        # Custom Hooks
│   ├── queries/                  # Hooks de React Query
│   │   ├── use-comments.ts       # Hooks de comentarios
│   │   ├── use-profile.ts        # Hooks de perfil
│   │   └── use-projects.ts       # Hooks de proyectos
│   └── use-toast.ts              # Hook de toast notifications
├── lib/                          # Librerías y utilidades
│   ├── context/                  # Contextos de React
│   │   └── auth-context.tsx      # Contexto de autenticación
│   ├── error-handler.ts          # Manejador centralizado de errores
│   ├── firebase/                 # Servicios Firebase
│   │   ├── blog-comments.ts      # CRUD comentarios del blog
│   │   ├── blog-likes.ts         # Sistema de likes del blog
│   │   ├── blog.ts               # CRUD posts del blog
│   │   ├── comments.ts           # CRUD comentarios de proyectos
│   │   ├── community.ts          # CRUD posts de comunidad
│   │   ├── config.ts             # Configuración Firebase
│   │   ├── followers.ts          # CRUD sistema de seguidores
│   │   ├── init-db.ts            # Inicialización de base de datos
│   │   ├── projects.ts           # CRUD proyectos
│   │   ├── resources.ts          # CRUD recursos
│   │   ├── reviews.ts            # CRUD reseñas y ratings
│   │   └── storage.ts            # Servicio de almacenamiento
│   ├── providers/                # Providers personalizados
│   │   └── query-provider.tsx    # Provider de React Query
│   ├── react-query/              # Configuración React Query
│   │   └── queries.ts            # Hooks centralizados de queries
│   ├── services/                 # Servicios adicionales
│   │   ├── db-service.ts         # Servicio de base de datos
│   │   └── storage-service.ts    # Servicio de storage
│   ├── utils/                    # Utilidades
│   │   ├── logger.ts             # Sistema de logging
│   │   └── utils.ts              # Utilidades generales
│   ├── validations/              # Schemas Zod
│   │   ├── community.ts          # Validaciones de comunidad
│   │   ├── followers.ts          # Validaciones de seguidores
│   │   ├── resources.ts          # Validaciones de recursos
│   │   └── reviews.ts            # Validaciones de reseñas
│   └── utils.ts                  # Utilidades compartidas
└── types/                        # Tipos TypeScript
    ├── blog.ts                   # Tipos del blog
    ├── comment.ts                # Tipos de comentarios
    ├── community.ts              # Tipos de comunidad
    ├── followers.ts              # Tipos de seguidores
    ├── profile.ts                # Tipos de perfil
    ├── project.ts                # Tipos de proyectos
    ├── resources.ts              # Tipos de recursos
    └── reviews.ts                # Tipos de reseñas
```

### 1.2 Archivos de Configuración Raíz

#### `next.config.ts`
```typescript
- React Strict Mode habilitado
- Configuración de imágenes remotas (Firebase Storage)
- Configuración webpack para @uiw/react-md-editor
- Fallback para módulos Node.js (fs: false)
```

#### `tsconfig.json`
```json
- Target: ES2017
- Strict mode habilitado
- Module: esnext
- Module Resolution: bundler
- Path alias: @/* -> ./src/*
- JSX: preserve (Next.js)
```

#### `package.json` - Dependencias Principales

**Framework & Core:**
- `next`: 15.0.3
- `react`: ^18.1.1
- `react-dom`: ^18.1.1
- `typescript`: ^5

**State Management:**
- `@tanstack/react-query`: ^5.59.20
- `@tanstack/react-query-devtools`: ^5.90.2
- `zustand`: ^5.0.1

**Firebase:**
- `firebase`: ^11.0.1
- `firebase-admin`: ^12.7.0

**UI Components:**
- `@radix-ui/*`: Múltiples componentes UI (dialog, dropdown, tabs, etc.)
- `tailwindcss`: ^3.4.1
- `lucide-react`: ^0.456.0 (Iconos)

**Forms & Validation:**
- `react-hook-form`: ^7.53.2
- `@hookform/resolvers`: ^3.9.1
- `zod`: ^3.23.8

**Utilidades:**
- `date-fns`: ^4.1.0
- `class-variance-authority`: ^0.7.0
- `clsx`: ^2.1.1
- `tailwind-merge`: ^2.5.4
- `@uiw/react-md-editor`: ^4.0.5 (Editor Markdown)

#### Variables de Entorno (.env.local)

**No encontrado archivo `.env.local`** - Las variables deben configurarse:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 🔥 TAREA 2: ESTRUCTURA DE FIREBASE/FIRESTORE

### 2.1 Colecciones de Firestore

#### 📋 Tabla de Colecciones

| Colección | Descripción | Tipo Principal | Relaciones |
|-----------|-------------|----------------|------------|
| `users` | Perfiles de usuario | `UserProfile` | → projects (createdBy), → reviews (reviewedUserId) |
| `projects` | Proyectos eléctricos | `Project` | → users (createdBy), → comments (projectId) |
| `comments` | Comentarios de proyectos | `Comment` | → projects (projectId), → users (userId) |
| `blog-posts` | Posts del blog | `BlogPost` | → users (authorId), → blog-comments (postId), → blog-likes (postId) |
| `blog-comments` | Comentarios del blog | `BlogComment` | → blog-posts (postId), → users (userId) |
| `blog-likes` | Likes del blog | `BlogLike` | → blog-posts (postId), → users (userId) |
| `community-posts` | Posts de la comunidad | `CommunityPost` | → users (userId), → post-comments (postId), → post-likes (postId) |
| `post-comments` | Comentarios de posts | `PostComment` | → community-posts (postId), → users (userId) |
| `post-likes` | Likes de posts | `PostLike` | → community-posts (postId), → users (userId) |
| `followers` | Relaciones de seguimiento | `Follower` | → users (followerId, followingId) |
| `reviews` | Reseñas y calificaciones | `Review` | → users (reviewerId, reviewedUserId), → projects (projectId) |
| `user-ratings` | Ratings calculados | `UserRating` | → users (userId) |
| `resources` | Recursos compartidos | `Resource` | → users (userId), → resource-likes (resourceId) |
| `resource-likes` | Likes de recursos | `ResourceLike` | → resources (resourceId), → users (userId) |

### 2.2 Interfaces TypeScript Detalladas

#### `users` Collection
```typescript
interface UserProfile {
  id?: string;
  email: string;
  displayName: string;
  phone: string;
  role: 'admin' | 'user';
  about?: string;
  location?: string;
  specialties: string[];
  rating: number;
  projectsCount: number;
  photoURL?: string | null;
  certifications?: string[];
  createdAt: string;
  lastLogin?: string;
  active: boolean;
}
```

#### `projects` Collection
```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  status: 'Pendiente' | 'En Progreso' | 'Completado';
  category: 'Residencial' | 'Comercial' | 'Industrial' | 'Solar';
  budget: number;
  location: string;
  clientId?: string;
  clientName: string;
  startDate?: Date;
  createdBy: string;  // userId
  createdAt: Date;
  images: string[];   // URLs de Firebase Storage
  tags: string[];
}
```

#### `blog-posts` Collection
```typescript
interface BlogPost {
  id?: string;
  title: string;
  content: string;        // Markdown
  summary: string;
  category: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  likesCount: number;
  commentsCount: number;
  status: 'published' | 'draft';
  createdAt: Date | string;
  updatedAt?: Date | string;
  imageUrl: string;       // URL imagen principal
  imageUrls: string[];    // Todas las URLs
}
```

#### `community-posts` Collection
```typescript
interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'technician' | 'engineer' | 'vendor' | 'company';
  content: string;
  images?: string[];
  category: 'question' | 'discussion' | 'showcase' | 'tip' | 'news';
  tags: string[];
  likes: number;
  commentsCount: number;
  views: number;
  isPinned: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
```

#### `followers` Collection
```typescript
interface Follower {
  id: string;
  followerId: string;      // Usuario que sigue
  followingId: string;     // Usuario seguido
  followerName: string;
  followerAvatar?: string;
  followingName: string;
  followingAvatar?: string;
  createdAt: Timestamp | Date;
}
```

#### `reviews` Collection
```typescript
interface Review {
  id: string;
  reviewerId: string;
  reviewedUserId: string;
  projectId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  reviewerName: string;
  reviewerAvatar?: string;
  category: 'technical' | 'communication' | 'quality' | 'punctuality';
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
```

#### `resources` Collection
```typescript
interface Resource {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  category: 'diagram' | 'document' | 'photo' | 'video' | 'tool' | 'guide';
  subcategory?: 'residential' | 'industrial' | 'solar' | 'commercial' | 'maintenance' | 'safety';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
  tags: string[];
  downloads: number;
  likes: number;
  views: number;
  isPublic: boolean;
  isPremium: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
```

### 2.3 Índices Firestore Requeridos

**Nota:** Los índices deben crearse manualmente en Firebase Console cuando Firestore los solicite. Estos son los índices que el código requiere:

1. **`projects` Collection:**
   - `createdBy` (ASC) + `createdAt` (DESC)
   - `status` (ASC) + `createdAt` (DESC)
   - `category` (ASC) + `createdAt` (DESC)

2. **`comments` Collection:**
   - `projectId` (ASC) + `createdAt` (DESC)

3. **`community-posts` Collection:**
   - `isPinned` (DESC) + `createdAt` (DESC)
   - `category` (ASC) + `createdAt` (DESC)
   - `userId` (ASC) + `createdAt` (DESC)

4. **`post-comments` Collection:**
   - `postId` (ASC) + `createdAt` (DESC)

5. **`post-likes` Collection:**
   - `userId` (ASC) + `postId` (ASC) - **COMPUESTO ÚNICO**

6. **`followers` Collection:**
   - `followerId` (ASC) + `createdAt` (DESC)
   - `followingId` (ASC) + `createdAt` (DESC)
   - `followerId` (ASC) + `followingId` (ASC) - **COMPUESTO ÚNICO**

7. **`reviews` Collection:**
   - `reviewedUserId` (ASC) + `createdAt` (DESC)
   - `reviewerId` (ASC) + `createdAt` (DESC)
   - `projectId` (ASC) + `createdAt` (DESC)
   - `category` (ASC) + `createdAt` (DESC)

8. **`resources` Collection:**
   - `userId` (ASC) + `createdAt` (DESC)
   - `category` (ASC) + `createdAt` (DESC)
   - `subcategory` (ASC) + `createdAt` (DESC)
   - `isPublic` (ASC) + `createdAt` (DESC)

9. **`resource-likes` Collection:**
   - `userId` (ASC) + `resourceId` (ASC) - **COMPUESTO ÚNICO**

10. **`blog-posts` Collection:**
    - `status` (ASC) + `createdAt` (DESC)

11. **`blog-comments` Collection:**
    - `postId` (ASC) + `parentId` (ASC) + `createdAt` (DESC)

12. **`blog-likes` Collection:**
    - `userId` (ASC) + `postId` (ASC) - **COMPUESTO ÚNICO**

### 2.4 Firebase Storage

#### Estructura de Carpetas en Storage

```
storage/
├── projects/
│   └── {projectId}/
│       └── {timestamp}-{filename}  # Imágenes de proyectos (máx. 10MB)
├── posts/
│   └── {postId}/
│       └── {timestamp}-{filename}  # Imágenes de posts de comunidad (máx. 10MB)
├── resources/
│   └── {userId}/
│       └── {timestamp}-{filename}  # Archivos de recursos (máx. 100MB)
├── profiles/
│   └── {userId}/
│       └── profile.{ext}  # Imágenes de perfil (máx. 5MB)
└── blog/
    └── {postId}/
        └── {filename}  # Imágenes de blog (máx. 10MB)
```

#### Reglas de Seguridad (storage.rules)

**Archivo:** `storage.rules`

**Versión:** `rules_version = '2'`

**Funciones Helper:**
- `isAuth()`: Verifica que el usuario esté autenticado
- `isOwner(userId)`: Verifica que el usuario autenticado sea el propietario
- `isImage()`: Valida que el archivo sea una imagen (`image/*`)
- `maxSize(bytes)`: Valida que el tamaño del archivo no exceda el límite
- `isProjectOwner(projectId)`: Verifica que el usuario sea dueño del proyecto (lee de Firestore)
- `isCommunityPostOwner(postId)`: Verifica que el usuario sea dueño del post (lee de Firestore)
- `isBlogOwner(postId)`: Verifica que el usuario sea el autor del blog post (lee de Firestore)

**Reglas por Sección:**

1. **Proyectos (`/projects/{projectId}/{fileName}`):**
   - ✅ Lectura: Solo usuarios autenticados
   - ✅ Escritura: Solo el dueño del proyecto + debe ser imagen + máximo 10MB
   - ✅ Eliminación: Solo el dueño del proyecto

2. **Posts de Comunidad (`/posts/{postId}/{fileName}`):**
   - ✅ Lectura: Solo usuarios autenticados
   - ✅ Escritura: Solo el dueño del post + debe ser imagen + máximo 10MB
   - ✅ Eliminación: Solo el dueño del post

3. **Recursos (`/resources/{userId}/{fileName}`):**
   - ✅ Lectura: Público (todos pueden leer)
   - ✅ Escritura: Solo el propietario + máximo 100MB
   - ✅ Eliminación: Solo el propietario

4. **Imágenes de Perfil (`/profiles/{userId}/{fileName}`):**
   - ✅ Lectura: Público (todos pueden leer)
   - ✅ Escritura: Solo el propietario + debe ser imagen + máximo 5MB
   - ✅ Eliminación: Solo el propietario

5. **Blog (`/blog/{postId}/{fileName}`):**
   - ✅ Lectura: Público (todos pueden leer)
   - ✅ Escritura: Solo el autor del post + debe ser imagen + máximo 10MB
   - ✅ Eliminación: Solo el autor del post

6. **Default Deny:**
   - ✅ Cualquier otra ruta no especificada: Denegado por defecto

**Reglas Completas:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper Functions
    function isAuth() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuth() && request.auth.uid == userId;
    }

    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    function maxSize(bytes) {
      return request.resource.size < bytes;
    }

    function isProjectOwner(projectId) {
      return isAuth() &&
        get(/databases/(default)/documents/projects/$(projectId)).data.createdBy == request.auth.uid;
    }

    function isCommunityPostOwner(postId) {
      return isAuth() &&
        get(/databases/(default)/documents/community-posts/$(postId)).data.userId == request.auth.uid;
    }

    function isBlogOwner(postId) {
      return isAuth() &&
        get(/databases/(default)/documents/blog-posts/$(postId)).data.authorId == request.auth.uid;
    }

    // PROJECTS
    match /projects/{projectId}/{fileName} {
      allow read: if isAuth();
      allow write: if isProjectOwner(projectId)
                    && isImage()
                    && maxSize(10 * 1024 * 1024);
      allow delete: if isProjectOwner(projectId);
    }

    // COMMUNITY POSTS
    match /posts/{postId}/{fileName} {
      allow read: if isAuth();
      allow write: if isCommunityPostOwner(postId)
                    && isImage()
                    && maxSize(10 * 1024 * 1024);
      allow delete: if isCommunityPostOwner(postId);
    }

    // RESOURCES
    match /resources/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId)
                    && maxSize(100 * 1024 * 1024);
      allow delete: if isOwner(userId);
    }

    // PROFILE IMAGES
    match /profiles/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId)
                    && isImage()
                    && maxSize(5 * 1024 * 1024);
      allow delete: if isOwner(userId);
    }

    // BLOG
    match /blog/{postId}/{fileName} {
      allow read: if true;
      allow write: if isBlogOwner(postId)
                    && isImage()
                    && maxSize(10 * 1024 * 1024);
      allow delete: if isBlogOwner(postId);
    }

    // DEFAULT DENY
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**Notas de Seguridad:**
- ✅ Validación de propiedad mediante lectura de Firestore para proyectos, posts y blog
- ✅ Límites de tamaño por tipo de archivo (5MB-100MB)
- ✅ Validación de tipo de archivo para imágenes
- ✅ Default deny al final para prevenir accesos no autorizados
- ⚠️ Las funciones `isProjectOwner()`, `isCommunityPostOwner()` y `isBlogOwner()` realizan lecturas de Firestore que pueden generar costos adicionales

---

## 🔐 TAREA 3: AUTENTICACIÓN Y SEGURIDAD

### 3.1 Sistema de Autenticación

**Método:** Firebase Authentication (Email/Password)

**Archivo:** `src/lib/context/auth-context.tsx`

```typescript
interface AuthContextType {
  user: User | null;          // Usuario de Firebase Auth
  loading: boolean;           // Estado de carga
  signUp: (email, password, displayName, phone) => Promise<void>;
  signIn: (email, password) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Características:**
- ✅ Persistencia local (browserLocalPersistence)
- ✅ Actualización automática de `lastLogin` en Firestore
- ✅ Creación automática de documento en `users` al registrarse
- ✅ Loading state durante inicialización
- ✅ Manejo de errores con logger

**Roles/Permisos:**
- **Roles definidos:** `'admin' | 'user'`
- **Admin:** Definido por email hardcodeado: `'diego.zuni@gmail.com'`
- **Permisos admin:** Puede eliminar usuarios, actualizar cualquier proyecto, moderar posts

### 3.2 Rutas Protegidas

#### Estructura de Grupos de Rutas

**`(auth)/` - Rutas de Autenticación:**
- `/login` - Login
- `/register` - Registro
- `/forgot-password` - Recuperar contraseña
- **Protección:** Si está autenticado → redirige a `/dashboard`

**`(protected)/` - Rutas Protegidas:**
- `/dashboard` - Dashboard del usuario
- `/profile` - Perfil del usuario autenticado
- `/profile/[userId]` - Perfil de otro usuario (visitante)
  - **Validación:** Si `[userId] === user.uid` → redirige a `/profile`
  - **Error:** Si usuario no existe → muestra 404
- `/projects` - Lista de proyectos
- `/projects/[id]` - Detalle de proyecto
- **Protección:** Si NO está autenticado → redirige a `/login`

**`(protected)/admin/` - Rutas de Administración:**
- `/admin` - Dashboard admin
- `/admin/blog` - Gestión de blog
- `/admin/blog/newpost` - Crear post
- **Protección:** Admin email + autenticado → redirige a `/dashboard` si no es admin

**`(public)/` - Rutas Públicas:**
- `/` - Página de inicio
- `/blog` - Blog público
- `/blog/[id]` - Detalle de post público
- `/community` - Comunidad (requiere auth para interactuar)
- `/community/[id]` - Detalle de post
- **Protección:** Accesible a todos, pero algunas funcionalidades requieren auth

#### Componentes de Protección

**`ProtectedRoute`** (`src/components/shared/protected-route.tsx`):
```typescript
- Verifica autenticación
- Muestra loading spinner
- Redirige a /login si no autenticado
- Opcional: verificación de roles (allowedRoles)
```

**`AdminRoute`** (`src/components/shared/admin-route.tsx`):
```typescript
- Verifica autenticación
- Verifica email admin (hardcodeado)
- Redirige a /dashboard si no es admin
```

### 3.3 Reglas de Seguridad Firestore

**Archivo:** `firestore.rules`

#### Funciones Helper

```javascript
isAuthenticated()      // Verifica si hay usuario autenticado
isOwner(userId)        // Verifica si es propietario
hasRole(role)          // Verifica rol (no usado actualmente)
isAdmin()              // Verifica si es admin por email
isValidEmail(email)    // Valida formato de email
```

#### Reglas Principales por Colección

**`users`:**
- ✅ READ: Autenticados pueden leer
- ✅ CREATE: Solo el mismo usuario puede crearse
- ✅ UPDATE: Solo el propietario (no puede cambiar role/email)
- ✅ DELETE: Solo admin

**`projects`:**
- ✅ READ: Autenticados pueden leer
- ✅ CREATE: Autenticados (valida campos requeridos y tipos)
- ✅ UPDATE: Propietario o admin (no puede cambiar createdBy/createdAt)
- ✅ DELETE: Propietario o admin

**`comments`:**
- ✅ READ: Autenticados
- ✅ CREATE: Autenticados (valida longitud 1-1000 caracteres)
- ✅ UPDATE: Propietario o admin
- ✅ DELETE: Propietario o admin

**`blog-posts`:**
- ✅ READ: Público (cualquiera puede leer)
- ✅ CREATE: Autenticados (valida campos y status inicial)
- ✅ UPDATE: Autor o admin
- ✅ DELETE: Autor o admin

**`blog-comments`:**
- ✅ READ: Público
- ✅ CREATE: Autenticados (valida longitud)
- ✅ UPDATE: Propietario o admin
- ✅ DELETE: Propietario o admin

**`community-posts`:**
- ✅ READ: Autenticados
- ✅ CREATE: Autenticados (valida categoría, tags, conteos iniciales)
- ✅ UPDATE: Propietario o admin
- ✅ DELETE: Propietario o admin

**`followers`:**
- ✅ READ: Autenticados
- ✅ CREATE: Autenticados (previene auto-seguimiento)
- ✅ DELETE: Solo el follower puede dejar de seguir

**`reviews`:**
- ✅ READ: Autenticados
- ✅ CREATE: Autenticados (valida rating 1-5, previene auto-reseña)
- ✅ UPDATE: Propietario o admin
- ✅ DELETE: Propietario o admin

**`resources`:**
- ✅ READ: Autenticados (isPublic=true O propietario O admin)
- ✅ CREATE: Autenticados (valida tamaño máximo 100MB)
- ✅ UPDATE: Propietario o admin
- ✅ DELETE: Propietario o admin

**`user-ratings`:**
- ✅ READ: Autenticados
- ✅ WRITE: Prohibido (solo Cloud Functions o transacciones del servidor)

---

## 🧩 TAREA 4: COMPONENTES PRINCIPALES

### 4.1 AUTENTICACIÓN

**Componentes:** `src/components/forms/`
- ✅ `login-form.tsx` - Formulario de login con validación
- ✅ `register-form.tsx` - Formulario de registro con validación
- ✅ `forgot-password-form.tsx` - Recuperación de contraseña

**Hooks:**
- ✅ `useAuth()` - Hook principal (en `auth-context.tsx`)
  - Retorna: `{ user, loading, signUp, signIn, logout }`
  - Maneja estado global de autenticación
  - Actualiza `lastLogin` automáticamente

**Estado:**
- ✅ Login/Logout completamente funcional
- ✅ Persistencia de sesión
- ✅ Manejo de errores con toasts

### 4.2 PERFIL DE USUARIO

**Componentes:** `src/components/profile/`
- ✅ `profile-header.tsx` - Encabezado con avatar, nombre, stats
  - **Props:** `profile`, `isOwnProfile?: boolean`, `userId?: string`
  - **Funcionalidad:** Oculta botones de edición si `isOwnProfile = false`
  - **Avatar:** Muestra avatar de solo lectura para perfiles visitantes
- ✅ `profile-edit-dialog.tsx` - Diálogo para editar perfil
- ✅ `profile-image-upload.tsx` - Subir/cambiar foto de perfil
- ✅ `profile-sidebar.tsx` - Sidebar con información adicional
  - **Contenido:** Ubicación, Experiencia, Especialidades, Certificaciones
  - **Uso:** Visibles en perfil propio y de otros usuarios
- ✅ `profile-stats.tsx` - Estadísticas (proyectos, rating, seguidores)
  - **Props:** `userId?: string` (opcional, por defecto usa usuario actual)
  - **Funcionalidad:** Obtiene stats del usuario especificado o del actual
- ✅ `profile-tabs.tsx` - Pestañas (Proyectos, Reseñas, Certificaciones, Galería, Actividad)
  - **Props:** `profile`, `userId?: string` (opcional)
  - **Funcionalidad:** Muestra proyectos del usuario especificado o del actual

**Páginas:**
- ✅ `/profile` - Perfil del usuario autenticado
- ✅ `/profile/[userId]` - Perfil de otro usuario
  - **Validaciones:** Redirige a `/profile` si es tu propio perfil
  - **Protección:** Requiere autenticación
  - **Error handling:** Muestra 404 si usuario no existe
  - **Layout:** Sidebar + Tabs con información del usuario visitado

**Funcionalidades:**
- ✅ Editar: displayName, about, location, specialties, photoURL (solo perfil propio)
- ✅ Visibilidad: Público ve nombre, foto, stats; Propietario ve todo + botón editar
- ✅ Seguir/Dejar de seguir: Botón "Seguir" visible solo en perfiles ajenos
- ✅ Estadísticas en tiempo real
- ✅ Visualización de perfil de otros usuarios con información completa

**Hooks:**
- ✅ `useUserProfile()` - Obtener perfil del usuario autenticado
- ✅ `useUserProfileById(userId)` - Obtener perfil de cualquier usuario por ID
- ✅ `useUpdateProfile()` - Actualizar perfil
- ✅ `useUserProjectsById(userId)` - Obtener proyectos de cualquier usuario por ID

### 4.3 PROYECTOS

**Componentes:** `src/components/projects/`
- ✅ `project-list.tsx` - Lista paginada de proyectos
- ✅ `project-form.tsx` - Formulario crear/editar proyecto
- ✅ `project-image-upload.tsx` - Subir múltiples imágenes
- ✅ `project-comment-section.tsx` - Comentarios del proyecto
- ✅ `project-delete-dialog.tsx` - Confirmación de eliminación

**Funcionalidades:**
- ✅ **Crear:** Formulario con validación, múltiples imágenes, tags
- ✅ **Editar:** Solo propietario o admin
- ✅ **Eliminar:** Solo propietario o admin, elimina imágenes de Storage
- ✅ **Galerías:** Carrusel de imágenes con Next.js Image
- ✅ **Comentarios:** Sistema completo con optimistic updates
- ✅ **Filtros:** Por status, categoría, usuario
- ✅ **Paginación:** Infinite scroll con React Query

**Hooks:**
- ✅ `useUserProjects()` - Proyectos del usuario
- ✅ `useProject(id)` - Detalle de proyecto
- ✅ `useCreateProject()` - Crear con optimistic update
- ✅ `useUpdateProject()` - Actualizar
- ✅ `useDeleteProject()` - Eliminar
- ✅ `useProjectComments(projectId)` - Comentarios
- ✅ `useAddComment()` - Agregar comentario

### 4.4 BLOG

**Componentes:** `src/components/blog/`
- ✅ `blog-card.tsx` - Tarjeta de post con imagen, resumen, stats
- ✅ `blog-grid.tsx` - Grid responsivo de posts
- ✅ `blog-filters.tsx` - Filtros por categoría
- ✅ `blog-comment-section.tsx` - Comentarios anidados
- ✅ `blog-like-button.tsx` - Botón de like interactivo
- ✅ `category-tabs.tsx` - Pestañas de categorías
- ✅ `featured-posts.tsx` - Posts destacados
- ✅ `image-carousel.tsx` - Carrusel de imágenes

**Funcionalidades:**
- ✅ Posts públicos (cualquiera puede leer)
- ✅ Sistema de likes con optimistic updates
- ✅ Comentarios anidados (respuestas)
- ✅ Categorías y filtros
- ✅ Markdown editor para crear posts
- ✅ Gestión admin: crear, editar, publicar

**Hooks:**
- ✅ `useBlogPosts(filters)` - Lista de posts
- ✅ `useBlogPost(id)` - Detalle
- ✅ `useBlogComments(postId)` - Comentarios
- ✅ `useAddBlogComment()` - Agregar comentario
- ✅ `useIsBlogPostLiked()` - Estado de like
- ✅ `useLikeBlogPost()` - Like/unlike

### 4.5 COMUNIDAD

**Componentes:** `src/components/community/`
- ✅ `community-post-card.tsx` - Tarjeta de post con stats
- ✅ `create-post-form.tsx` - Formulario crear post
- ✅ `community-comment-section.tsx` - Comentarios
- ✅ `community-post-filters.tsx` - Filtros (categoría, tags)
- ✅ `community-sidebar.tsx` - Sidebar con categorías y tags populares

**Funcionalidades:**
- ✅ **Posts:** Crear, editar, eliminar (solo propietario/admin)
- ✅ **Likes:** Sistema completo con optimistic updates
- ✅ **Comentarios:** Comentarios con likes
- ✅ **Filtros:** Por categoría, tags, usuario, búsqueda
- ✅ **Paginación:** Infinite scroll
- ✅ **Posts fijados:** Ordenamiento por isPinned
- ✅ **Stats:** Views, likes, comments en tiempo real

**Hooks:**
- ✅ `useCommunityPosts(filters)` - Lista con paginación infinita
- ✅ `useCommunityPost(id)` - Detalle
- ✅ `useCreateCommunityPost()` - Crear
- ✅ `useUpdateCommunityPost()` - Actualizar
- ✅ `useDeleteCommunityPost()` - Eliminar
- ✅ `useCommunityPostComments(postId)` - Comentarios
- ✅ `useAddCommunityComment()` - Agregar comentario
- ✅ `useIsCommunityPostLiked()` - Estado de like
- ✅ `useLikeCommunityPost()` - Like/unlike

### 4.6 ADMIN (Panel de Administración)

**Componentes:** `src/components/admin/`
- ✅ `database-initializer.tsx` - Inicializador de BD (herramienta dev)

**Rutas Admin:**
- ✅ `/admin` - Dashboard admin
- ✅ `/admin/blog` - Gestión de posts del blog
- ✅ `/admin/blog/newpost` - Crear nuevo post

**Funcionalidades:**
- ✅ Crear posts del blog con Markdown
- ✅ Subir múltiples imágenes
- ✅ Publicar o guardar como borrador
- ✅ Acceso restringido por email admin

---

## 🎣 TAREA 5: HOOKS Y QUERIES REACT QUERY

### 5.1 Archivos de Hooks

#### `src/hooks/queries/use-projects.ts`
```typescript
Query Keys:
  - projectKeys.all
  - projectKeys.list(userId)
  - projectKeys.detail(id)

Hooks:
  - useUserProjects() → useQuery
    - Query: Obtiene proyectos del usuario autenticado
    - staleTime: 2 minutos
    - Retorna: Project[]
  
  - useUserProjectsById(userId) → useQuery
    - Query: Obtiene proyectos de cualquier usuario por ID
    - staleTime: 2 minutos
    - Retorna: Project[]
    - Convierte Timestamps de Firestore a Date
  
  - useProject(id) → useQuery
    - Query: Obtiene proyecto por ID
    - staleTime: 5 minutos
    - Retorna: Project | null
  
  - useCreateProject() → useMutation
    - Mutation: Crea proyecto
    - Optimistic update: Sí
    - Invalida: projectKeys.lists()
  
  - useUpdateProject() → useMutation
    - Mutation: Actualiza proyecto
    - Optimistic update: Sí
    - Invalida: lists y detail
  
  - useDeleteProject() → useMutation
    - Mutation: Elimina proyecto
    - Optimistic update: Sí
    - Invalida: projectKeys.lists()
```

#### `src/hooks/queries/use-comments.ts`
```typescript
Query Keys:
  - commentKeys.list(projectId)

Hooks:
  - useProjectComments(projectId) → useQuery
    - Query: Obtiene comentarios de proyecto
    - staleTime: 2 minutos
    - Retorna: Comment[]
  
  - useAddComment() → useMutation
    - Mutation: Agrega comentario
    - Optimistic update: Sí
    - Invalida: commentKeys.list(projectId)
```

#### `src/hooks/queries/use-profile.ts`
```typescript
Query Keys:
  - profileKeys.detail(userId)

Hooks:
  - useUserProfile() → useQuery
    - Query: Obtiene perfil del usuario autenticado
    - staleTime: 5 minutos
    - Retorna: UserProfile
  
  - useUpdateProfile() → useMutation
    - Mutation: Actualiza perfil
    - Invalida: profileKeys.detail(userId)
```

### 5.2 Hooks Centralizados (`src/lib/react-query/queries.ts`)

**Este archivo contiene TODOS los hooks de React Query del proyecto:**

#### PROJECTS
- `useProjects(filters?)` - Infinite query con paginación
- `useUserProjects()` - Proyectos del usuario autenticado
- `useUserProjectsById(userId)` - Proyectos de cualquier usuario por ID
- `useProject(id)` - Detalle
- `useCreateProject()` - Crear con optimistic update
- `useUpdateProject()` - Actualizar
- `useDeleteProject()` - Eliminar

#### COMMENTS
- `useProjectComments(projectId)` - Comentarios de proyecto
- `useAddComment()` - Agregar comentario

#### BLOG
- `useBlogPosts(filters?)` - Infinite query
- `useBlogPost(id)` - Detalle
- `useBlogComments(postId)` - Comentarios
- `useAddBlogComment()` - Agregar comentario
- `useIsBlogPostLiked(postId)` - Estado de like
- `useLikeBlogPost()` - Like/unlike

#### PROFILE
- `useUserProfile()` - Perfil del usuario autenticado
- `useUserProfileById(userId)` - Perfil de cualquier usuario por ID
- `useUpdateProfile()` - Actualizar perfil

#### FOLLOWERS
- `useFollowers(userId)` - Seguidores
- `useFollowing(userId)` - Usuarios seguidos
- `useIsFollowing(followerId, followingId)` - Estado
- `useFollowUser()` - Seguir/dejar de seguir

#### RESOURCES
- `useResources(filters?)` - Infinite query
- `useResource(id)` - Detalle
- `useLikeResource()` - Like/unlike

#### REVIEWS
- `useReviews(filters?)` - Infinite query
- `useCreateReview()` - Crear reseña
- `useUserRating(userId)` - Rating del usuario
- `useReview(id)` - Detalle

#### COMMUNITY
- `useCommunityPosts(filters?)` - Infinite query
- `useCommunityPost(id)` - Detalle
- `useCreateCommunityPost()` - Crear post
- `useUpdateCommunityPost()` - Actualizar
- `useDeleteCommunityPost()` - Eliminar
- `useCommunityPostComments(postId)` - Comentarios
- `useAddCommunityComment()` - Agregar comentario
- `useIsCommunityPostLiked(postId)` - Estado
- `useLikeCommunityPost()` - Like/unlike
- `useUpdateCommunityComment()` - Actualizar comentario
- `useDeleteCommunityComment()` - Eliminar comentario

### 5.3 Características de React Query

✅ **Optimistic Updates:** Implementados en:
- Crear/actualizar/eliminar proyectos
- Agregar comentarios
- Likes de posts (blog y comunidad)
- Seguir usuarios

✅ **Infinite Queries:** Implementadas en:
- Proyectos (con filtros)
- Posts de blog
- Posts de comunidad
- Recursos
- Reseñas

✅ **Cache Management:**
- staleTime configurado por tipo de dato
- gcTime (garbage collection) configurado
- Invalidación automática después de mutaciones

✅ **Error Handling:**
- Todos los hooks manejan errores con toast notifications
- Usan logger centralizado
- Mensajes de error amigables al usuario

---

## ⚙️ TAREA 6: FUNCIONES FIREBASE (CRUD)

### 6.1 `src/lib/firebase/projects.ts`

**Servicio:** `projectsService`

| Función | Parámetros | Retorna | Validación |
|---------|-----------|---------|------------|
| `createProject` | `projectData: Omit<Project, 'id'>` | `string` (projectId) | ✅ Logger |
| `updateProject` | `projectId: string, projectData: Partial<Project>` | `void` | ✅ Logger |
| `deleteProject` | `projectId: string` | `boolean` | ✅ Logger + elimina imágenes Storage |
| `getUserProjects` | `userId: string` | `Project[]` | ✅ Logger |
| `getProjects` | `options: {limit, cursor, userId, status, category}` | `{projects, nextCursor, hasMore}` | ✅ Logger + Paginación |
| `getProject` | `projectId: string` | `Project \| null` | ✅ Logger |

**Características:**
- ✅ Eliminación en cascada de imágenes de Storage
- ✅ Paginación con cursor
- ✅ Filtros opcionales
- ✅ **Conversión de Timestamps:** `getUserProjects()` convierte Timestamps de Firestore a Date automáticamente
  - Maneja Timestamps nativos con método `.toDate()`
  - Maneja objetos serializados con `seconds` y `nanoseconds`
  - Fallback a Date nativo si ya es Date

### 6.2 `src/lib/firebase/community.ts`

**Servicio:** `communityService`

| Función | Parámetros | Retorna |
|---------|-----------|---------|
| `getPosts` | `options: {limit, cursor, filters}` | `CommunityPostPage` |
| `getPost` | `postId: string` | `CommunityPost \| null` |
| `createPost` | `data: Omit<CommunityPost, ...>` | `string` (postId) |
| `updatePost` | `postId: string, data: Partial<CommunityPost>` | `void` |
| `deletePost` | `postId: string` | `void` |
| `likePost` | `userId: string, postId: string` | `void` |
| `unlikePost` | `userId: string, postId: string` | `void` |
| `isPostLiked` | `userId: string, postId: string` | `boolean` |
| `incrementPostView` | `postId: string` | `void` |
| `getPostComments` | `postId: string` | `PostComment[]` |
| `addPostComment` | `data: Omit<PostComment, ...>` | `string` (commentId) |
| `updatePostComment` | `commentId: string, content: string` | `void` |
| `deletePostComment` | `commentId: string, postId: string` | `void` |

**Características:**
- ✅ Incrementa/decrementa contadores automáticamente
- ✅ Elimina imágenes de Storage al eliminar post
- ✅ Paginación con filtros avanzados

### 6.3 `src/lib/firebase/blog.ts`

**Servicio:** `blogService`

| Función | Parámetros | Retorna |
|---------|-----------|---------|
| `getPublishedPosts` | `options: {limit}` | `BlogPost[]` |
| `getPosts` | `options: {limit}` | `BlogPost[]` |
| `createPost` | `data: CreateBlogPostData` | `string` (postId) |
| `updatePost` | `id: string, postData: Partial<BlogPost>` | `BlogPost` |
| `getPostById` | `id: string` | `BlogPost \| null` |

**Características:**
- ✅ Conversión de Timestamps a Date
- ✅ Solo posts publicados en getPublishedPosts

### 6.4 `src/lib/firebase/comments.ts`

**Servicio:** `commentService`

| Función | Parámetros | Retorna |
|---------|-----------|---------|
| `addComment` | `data: Omit<Comment, 'id'>` | `string` (commentId) |
| `getProjectComments` | `projectId: string` | `Comment[]` |

### 6.5 `src/lib/firebase/blog-comments.ts`

**Servicio:** `blogCommentsService`

| Función | Parámetros | Retorna |
|---------|-----------|---------|
| `getPostComments` | `postId: string` | `BlogComment[]` |
| `getCommentReplies` | `commentId: string` | `BlogComment[]` |
| `addComment` | `data: Omit<BlogComment, ...>` | `string` |
| `updateComment` | `commentId: string, content: string` | `void` |
| `deleteComment` | `commentId: string, postId: string` | `void` |

**Características:**
- ✅ Soporta comentarios anidados (parentId)
- ✅ Elimina respuestas en cascada
- ✅ Actualiza contador de comentarios

### 6.6 `src/lib/firebase/blog-likes.ts`

**Servicio:** `blogLikesService`

| Función | Parámetros | Retorna |
|---------|-----------|---------|
| `likePost` | `userId: string, postId: string` | `void` |
| `unlikePost` | `userId: string, postId: string` | `void` |
| `isPostLiked` | `userId: string, postId: string` | `boolean` |
| `getPostLikesCount` | `postId: string` | `number` |

### 6.7 `src/lib/firebase/followers.ts`

**Servicio:** `followersService`

| Función | Parámetros | Retorna | Validación |
|---------|-----------|---------|------------|
| `followUser` | `data: FollowUserInput` | `string` (followId) | ✅ Zod schema |
| `unfollowUser` | `followerId: string, followingId: string` | `void` | - |
| `getUserFollowers` | `userId: string, pageLimit?: number` | `Follower[]` | - |
| `getUserFollowing` | `userId: string, pageLimit?: number` | `Follower[]` | - |
| `isFollowing` | `followerId: string, followingId: string` | `boolean` | - |
| `getFollowerCount` | `userId: string` | `number` | - |
| `getFollowingCount` | `userId: string` | `number` | - |
| `getFollowerStats` | `userId: string` | `FollowerStats` | - |

**Características:**
- ✅ Validación con Zod
- ✅ Previene auto-seguimiento
- ✅ Previene duplicados

### 6.8 `src/lib/firebase/reviews.ts`

**Servicio:** `reviewsService`

| Función | Parámetros | Retorna | Validación |
|---------|-----------|---------|------------|
| `getReviews` | `options: {limit, cursor, filters}` | `ReviewPage` | - |
| `getReviewsForUser` | `userId: string, limitCount?` | `Review[]` | - |
| `getReviewsByUser` | `userId: string, limitCount?` | `Review[]` | - |
| `getReview` | `reviewId: string` | `Review \| null` | - |
| `createReview` | `data: CreateReviewInput` | `string` | ✅ Zod + Transacción |
| `updateReview` | `reviewId: string, data: UpdateReviewInput` | `void` | ✅ Zod + Transacción |
| `deleteReview` | `reviewId: string` | `void` | ✅ Transacción |
| `getUserRating` | `userId: string` | `UserRating \| null` | - |
| `updateUserRating` | `userId: string` | `UserRating` | - |

**Características:**
- ✅ **Transacciones:** Crea/actualiza/elimina rating automáticamente
- ✅ **Validación Zod:** Campos validados antes de guardar
- ✅ **Cálculo automático:** Rating promedio y breakdown

### 6.9 `src/lib/firebase/resources.ts`

**Servicio:** `resourcesService`

| Función | Parámetros | Retorna | Validación |
|---------|-----------|---------|------------|
| `getResources` | `options: {limit, cursor, filters}` | `ResourcePage` | - |
| `getResource` | `resourceId: string` | `Resource \| null` | - |
| `uploadResource` | `file: File, metadata` | `{url, thumbnailUrl?}` | - |
| `createResource` | `data: CreateResourceInput` | `string` | ✅ Zod |
| `updateResource` | `resourceId: string, data: UpdateResourceInput` | `void` | ✅ Zod |
| `deleteResource` | `resourceId: string` | `void` | ✅ Elimina archivos Storage |
| `likeResource` | `userId: string, resourceId: string` | `void` | - |
| `unlikeResource` | `userId: string, resourceId: string` | `void` | - |
| `isResourceLiked` | `userId: string, resourceId: string` | `boolean` | - |
| `incrementDownload` | `resourceId: string` | `void` | - |
| `incrementView` | `resourceId: string` | `void` | - |

**Características:**
- ✅ Subida de archivos a Storage
- ✅ Eliminación en cascada de archivos
- ✅ Contadores de downloads/views

### 6.10 `src/lib/firebase/storage.ts`

**Servicio:** `storageService`

| Función | Parámetros | Retorna |
|---------|-----------|---------|
| `uploadProjectImages` | `projectId: string, files: File[]` | `string[]` (URLs) |
| `uploadPostImages` | `postId: string, files: File[]` | `string[]` (URLs) |

**Características:**
- ✅ Subida paralela de múltiples archivos
- ✅ Nombres únicos con timestamp

---

## 📝 TAREA 7: TIPOS TYPESCRIPT

### 7.1 Archivos de Tipos

#### `src/types/project.ts`
```typescript
type ProjectStatus = 'Pendiente' | 'En Progreso' | 'Completado';
type ProjectCategory = 'Residencial' | 'Comercial' | 'Industrial' | 'Solar';

interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  category: ProjectCategory;
  budget: number;
  location: string;
  clientId?: string;
  clientName: string;
  startDate?: Date;
  createdBy: string;
  createdAt: Date;
  images: string[];
  tags: string[];
}

type CreateProjectData = Omit<Project, 'id' | 'createdBy' | 'createdAt'> & {
  title: string;
  description: string;
  category: ProjectCategory;
  budget: number;
  location: string;
  clientName: string;
};
```

#### `src/types/community.ts`
```typescript
type UserRole = 'technician' | 'engineer' | 'vendor' | 'company';
type PostCategory = 'question' | 'discussion' | 'showcase' | 'tip' | 'news';

interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: UserRole;
  content: string;
  images?: string[];
  category: PostCategory;
  tags: string[];
  likes: number;
  commentsCount: number;
  views: number;
  isPinned: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Timestamp | Date;
}

interface CommunityFilters {
  category?: PostCategory;
  userId?: string;
  tags?: string[];
  isPinned?: boolean;
  search?: string;
}
```

#### `src/types/blog.ts`
```typescript
interface BlogPost {
  id?: string;
  title: string;
  content: string;        // Markdown
  summary: string;
  category: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  likesCount: number;
  commentsCount: number;
  status: 'published' | 'draft';
  createdAt: Date | string;
  updatedAt?: Date | string;
  imageUrl: string;
  imageUrls: string[];
}

type CreateBlogPostData = Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>;
type UpdateBlogPostData = Partial<Omit<BlogPost, 'id' | 'createdAt' | 'authorName'>>;
```

#### `src/types/profile.ts`
```typescript
interface BaseProfile {
  displayName: string;
  email: string;
  about?: string;
  location?: string;
  specialties: string[];
  rating: number;
  projectsCount: number;
  createdAt: string;
  photoURL?: string | null;
}

interface UserProfile extends BaseProfile {
  id?: string;
  phone: string;
  role: 'admin' | 'user';
  photoURL?: string;
  certifications?: string[];
}

interface ProfileHeader extends BaseProfile {
  id: string;
  photoURL: string | null;
  role: 'admin' | 'user';
}

interface ProfileTabsProps {
  profile: UserProfile;
  userId?: string; // ID del usuario para obtener proyectos (si no se proporciona, usa el usuario actual)
}

// Función helper para transformar UserProfile a ProfileHeader
function transformUserToProfileHeader(user: UserProfile): ProfileHeader {
  return {
    id: user.id || user.email, // Usa ID si existe, sino email como fallback
    displayName: user.displayName,
    email: user.email,
    about: user.about,
    location: user.location,
    specialties: user.specialties,
    rating: user.rating,
    projectsCount: user.projectsCount,
    createdAt: user.createdAt,
    role: user.role,
    photoURL: user.photoURL || null
  };
}
```

#### `src/types/comment.ts`
```typescript
interface Comment {
  id?: string;
  projectId: string;
  userId: string;
  userDisplayName: string;
  photoURL?: string | null;
  content: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  parentId?: string;
  replies?: Comment[];
}
```

#### `src/types/followers.ts`
```typescript
interface Follower {
  id: string;
  followerId: string;
  followingId: string;
  followerName: string;
  followerAvatar?: string;
  followingName: string;
  followingAvatar?: string;
  createdAt: Timestamp | Date;
}

interface FollowerStats {
  followersCount: number;
  followingCount: number;
  lastUpdated: Timestamp | Date;
}
```

#### `src/types/resources.ts`
```typescript
type ResourceCategory = 'diagram' | 'document' | 'photo' | 'video' | 'tool' | 'guide';
type ResourceSubcategory = 'residential' | 'industrial' | 'solar' | 'commercial' | 'maintenance' | 'safety';

interface Resource {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  category: ResourceCategory;
  subcategory?: ResourceSubcategory;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
  tags: string[];
  downloads: number;
  likes: number;
  views: number;
  isPublic: boolean;
  isPremium: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

interface ResourceLike {
  id: string;
  userId: string;
  resourceId: string;
  createdAt: Timestamp | Date;
}

interface ResourceFilters {
  userId?: string;
  category?: ResourceCategory;
  subcategory?: ResourceSubcategory;
  tags?: string[];
  isPublic?: boolean;
  search?: string;
}
```

#### `src/types/reviews.ts`
```typescript
type RatingValue = 1 | 2 | 3 | 4 | 5;
type ReviewCategory = 'technical' | 'communication' | 'quality' | 'punctuality';

interface Review {
  id: string;
  reviewerId: string;
  reviewedUserId: string;
  projectId?: string;
  rating: RatingValue;
  comment: string;
  reviewerName: string;
  reviewerAvatar?: string;
  category: ReviewCategory;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

interface UserRating {
  userId: string;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  lastUpdated: Timestamp | Date;
}

interface ReviewFilters {
  reviewedUserId?: string;
  reviewerId?: string;
  projectId?: string;
  category?: ReviewCategory;
  minRating?: RatingValue;
}
```

---

## ✔️ TAREA 8: VALIDACIONES (ZOD)

### 8.1 Schemas Zod Encontrados

#### `src/lib/validations/community.ts`
```typescript
createPostSchema = z.object({
  content: z.string().min(10).max(1000),
  category: z.enum(['question', 'discussion', 'showcase', 'tip', 'news']),
  tags: z.array(z.string().min(1).max(20)).max(5).default([]),
  images: z.array(z.string().url()).max(5).optional().default([]),
  userRole: z.enum(['technician', 'engineer', 'vendor', 'company']).default('technician'),
});

createCommentSchema = z.object({
  content: z.string().min(1).max(500),
  postId: z.string().min(1),
});
```

#### `src/lib/validations/followers.ts`
```typescript
followUserSchema = z.object({
  followerId: z.string().min(1),
  followingId: z.string().min(1),
  followerName: z.string().min(1),
  followerAvatar: z.string().url().optional().nullable(),
  followingName: z.string().min(1),
  followingAvatar: z.string().url().optional().nullable(),
});
```

#### `src/lib/validations/resources.ts`
```typescript
createResourceSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  userAvatar: z.string().url().optional().nullable(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(1000),
  category: z.enum(['diagram', 'document', 'photo', 'video', 'tool', 'guide']),
  subcategory: z.enum([...]).optional(),
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  fileSize: z.number().positive().max(100 * 1024 * 1024), // 100MB
  fileType: z.string().min(1),
  thumbnailUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).max(10).default([]),
  isPublic: z.boolean().default(true),
  isPremium: z.boolean().default(false),
});
```

#### `src/lib/validations/reviews.ts`
```typescript
createReviewSchema = z.object({
  reviewerId: z.string().min(1),
  reviewedUserId: z.string().min(1),
  projectId: z.string().optional(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  comment: z.string().min(10).max(1000),
  reviewerName: z.string().min(1),
  reviewerAvatar: z.string().url().optional().nullable(),
  category: z.enum(['technical', 'communication', 'quality', 'punctuality']),
});
```

**Nota:** No se encontraron validaciones Zod para:
- ❌ Crear proyectos (validación solo en Firestore rules)
- ❌ Crear posts de blog (validación solo en Firestore rules)
- ❌ Formularios de login/registro (validación en componentes)

---

## 🐛 TAREA 9: ESTADO ACTUAL DEL CÓDIGO

### 9.1 Archivos con Errores

✅ **No se encontraron errores de TypeScript** (read_lints no reportó errores)

### 9.2 Console.log y console.error

⚠️ **Encontrados 47 console.log/error/warn:**

**Archivos con console.log/error:**
- `src/components/blog/blog-card.tsx` - 1 console.error
- `src/components/followers/follow-button.tsx` - 1 console.error
- `src/components/shared/protected-navbar.tsx` - 1 console.error
- `src/components/shared/public-navbar.tsx` - 1 console.log
- `src/components/profile/*.tsx` - 4 console.log/error/warn
- `src/components/projects/*.tsx` - 3 console.error
- `src/app/(protected)/admin/blog/newpost/page.tsx` - 4 console.log/error
- `src/app/(public)/blog/page.tsx` - 1 console.error
- `src/app/(protected)/admin/blog/page.tsx` - 1 console.error
- `src/lib/firebase/storage.ts` - 2 console.error
- `src/lib/firebase/init-db.ts` - 6 console.log/error
- `src/lib/services/*.ts` - 8 console.error
- `src/components/forms/*.tsx` - 2 console.error

**Recomendación:** Reemplazar todos por `logger` del sistema centralizado.

### 9.3 Código Comentado

⚠️ **Encontrado código comentado en:**
- `src/app/(protected)/layout.tsx` - Layout anterior comentado (líneas 23-58)

**Recomendación:** Eliminar código comentado si ya no se necesita.

### 9.4 TODOs y FIXMEs

✅ **Solo encontrados en documentación:**
- `REFACTORING_REPORT.md` menciona TODOs como pendientes
- No hay TODOs/FIXMEs en código de producción

### 9.5 Performance

✅ **React Query:**
- ✅ Uso correcto de `staleTime` y `gcTime`
- ✅ Infinite queries implementadas
- ✅ Optimistic updates donde corresponde
- ✅ Invalidación correcta de caché

⚠️ **Oportunidades de mejora:**
- ❌ Algunas queries podrían usar `select` para reducir re-renders
- ❌ Falta memoización en algunos componentes (useMemo/useCallback)

### 9.6 Patrones de Código

✅ **Estructura:**
- ✅ Separación clara: components, hooks, lib, types
- ✅ Servicios Firebase separados por entidad
- ✅ Hooks de React Query centralizados en `queries.ts`

✅ **Naming:**
- ✅ Convención: camelCase para funciones/variables
- ✅ PascalCase para componentes
- ✅ kebab-case para archivos

✅ **Convenciones:**
- ✅ Uso consistente de TypeScript
- ✅ Validación con Zod en servicios críticos
- ✅ Manejo de errores centralizado con logger

---

## 📦 TAREA 10: DEPENDENCIAS Y VERSIONES

### 10.1 Versiones Principales

| Dependencia | Versión | Uso |
|-------------|---------|-----|
| **Next.js** | 15.0.3 | Framework principal |
| **React** | ^18.1.1 | UI Library |
| **TypeScript** | ^5 | Type checking |
| **Firebase** | ^11.0.1 | Backend y autenticación |
| **React Query** | ^5.59.20 | State management |
| **Tailwind CSS** | ^3.4.1 | Estilos |
| **shadcn/ui** | ^0.0.4 | Componentes UI base |
| **Zod** | ^3.23.8 | Validación |
| **React Hook Form** | ^7.53.2 | Manejo de formularios |

### 10.2 Dependencias Instaladas y Uso

#### ✅ Usadas Completamente
- `@tanstack/react-query` - State management principal
- `firebase` - Backend completo
- `zod` - Validaciones en followers, resources, reviews, community
- `react-hook-form` - Formularios
- `@radix-ui/*` - Componentes UI (dialog, dropdown, tabs, etc.)
- `tailwindcss` - Estilos
- `lucide-react` - Iconos
- `date-fns` - Formateo de fechas

#### ⚠️ Parcialmente Usadas
- `@uiw/react-md-editor` - Solo en crear posts de blog (admin)
- `zustand` - Instalado pero **no se encontró uso** en el código

#### ✅ Scripts Disponibles

```json
{
  "dev": "next dev",           // Servidor de desarrollo
  "build": "next build",       // Build de producción
  "start": "next start",       // Servidor de producción
  "lint": "next lint"          // Linter ESLint
}
```

---

## 📊 TAREA 11: RESUMEN DE ESTADO ACTUAL

### 11.1 STATUS GENERAL

#### ✅ Completado

1. **Autenticación:**
   - ✅ Login/Registro/Logout
   - ✅ Context de autenticación
   - ✅ Persistencia de sesión
   - ✅ Protección de rutas

2. **Perfil de Usuario:**
   - ✅ Visualización y edición de perfil propio
   - ✅ Visualización de perfil de otros usuarios (`/profile/[userId]`)
   - ✅ Subida de imagen de perfil (solo propio)
   - ✅ Estadísticas (propias y de otros usuarios)
   - ✅ Sistema de seguimiento integrado en perfiles
   - ✅ Sidebar con información adicional (ubicación, especialidades, certificaciones)

3. **Proyectos:**
   - ✅ CRUD completo
   - ✅ Galerías de imágenes
   - ✅ Sistema de comentarios
   - ✅ Filtros y búsqueda
   - ✅ Paginación infinita

4. **Blog:**
   - ✅ Posts públicos
   - ✅ Sistema de likes
   - ✅ Comentarios anidados
   - ✅ Editor Markdown
   - ✅ Gestión admin

5. **Comunidad:**
   - ✅ Posts y comentarios
   - ✅ Sistema de likes
   - ✅ Filtros avanzados
   - ✅ Posts fijados

6. **Seguidores:**
   - ✅ Seguir/dejar de seguir
   - ✅ Estadísticas
   - ✅ Validación Zod

7. **Reseñas:**
   - ✅ Sistema completo
   - ✅ Cálculo automático de ratings
   - ✅ Transacciones Firestore

8. **Recursos:**
   - ✅ CRUD completo
   - ✅ Sistema de likes
   - ✅ Subida de archivos

9. **React Query:**
   - ✅ Migración completa
   - ✅ Optimistic updates
   - ✅ Infinite queries
   - ✅ Cache management

10. **Firestore Rules:**
    - ✅ Reglas completas de seguridad
    - ✅ Validación de datos
    - ✅ Protección de campos inmutables

11. **Visualización de Perfiles:**
    - ✅ Página de perfil propio (`/profile`)
    - ✅ Página de perfil visitante (`/profile/[userId]`)
    - ✅ Componentes reutilizables con props opcionales
    - ✅ Manejo robusto de Timestamps de Firestore
    - ✅ Validaciones y redirecciones automáticas

#### 🚧 En Progreso

- ⚠️ Limpieza de console.log/error
- ⚠️ Optimización de performance (memoización)
- ⚠️ Índices Firestore (algunos deben crearse manualmente)

#### ⏳ Pendiente

- ❌ Tests unitarios
- ❌ Tests de integración
- ❌ Error boundaries
- ❌ Service Worker (PWA)
- ❌ Firebase Storage rules (no existe archivo)
- ❌ Variables de entorno documentadas

### 11.2 ARQUITECTURA

**Patrón usado:**
- ✅ **React Query** para state management de servidor
- ✅ **Context API** para autenticación global
- ✅ **Zustand** instalado pero no usado
- ❌ **Redux** no usado

**Flujo de estado:**
```
Firebase Firestore 
  → React Query Hooks 
    → Componentes 
      → Optimistic Updates 
        → Invalidación de Cache
```

**Lógica centralizada:**
- ✅ Servicios Firebase en `lib/firebase/`
- ✅ Hooks React Query en `lib/react-query/queries.ts`
- ✅ Validaciones Zod en `lib/validations/`
- ✅ Logger centralizado en `lib/utils/logger.ts`

### 11.3 PROBLEMAS/ALERTAS

#### ⚠️ Deuda Técnica

1. **Console.logs sin limpiar:**
   - 47 ocurrencias en componentes y servicios
   - Deben reemplazarse por logger

2. **Código comentado:**
   - Layout antiguo en `(protected)/layout.tsx`
   - Debe eliminarse

3. **Zustand instalado pero no usado:**
   - Considerar eliminar si no se va a usar

4. **Falta validación Zod en algunos formularios:**
   - Proyectos (solo Firestore rules)
   - Blog posts (solo Firestore rules)

#### ⚠️ Optimizaciones Necesarias

1. **Memoización:**
   - Algunos componentes podrían usar `React.memo`
   - Callbacks podrían usar `useCallback`
   - Valores calculados podrían usar `useMemo`

2. **Queries:**
   - Usar `select` para reducir re-renders
   - Considerar prefetching en navegación

3. **Imágenes:**
   - Usar Next.js Image component consistentemente

#### 🔒 Seguridad

1. ✅ Firestore rules completas y validadas
2. ⚠️ Storage rules no encontradas (debe crearse)
3. ✅ Validación en cliente (Zod) y servidor (Firestore rules)
4. ⚠️ Admin email hardcodeado (considerar configuración)

### 11.4 RECOMENDACIONES

#### 🔴 Prioridad Alta

1. **Crear `storage.rules`** para Firebase Storage
2. **Reemplazar console.log/error** por logger
3. **Eliminar código comentado** innecesario
4. **Documentar variables de entorno** requeridas

#### 🟡 Prioridad Media

1. **Agregar validación Zod** a formularios de proyectos y blog
2. **Optimizar componentes** con memoización
3. **Crear índices Firestore** faltantes manualmente
4. **Mover admin email** a variable de entorno

#### 🟢 Prioridad Baja

1. **Agregar tests** unitarios e integración
2. **Implementar Error Boundaries**
3. **Considerar PWA** con Service Worker
4. **Evaluar uso de Zustand** o eliminarlo

---

## 🗺️ TAREA 12: MAPA DE RUTAS Y PÁGINAS

### 12.1 Rutas de Autenticación (`(auth)/`)

| Ruta | Método | Componente | Descripción |
|------|--------|-----------|-------------|
| `/login` | GET | `login/page.tsx` | Página de login |
| `/register` | GET | `register/page.tsx` | Página de registro |
| `/forgot-password` | GET | `forgot-password/page.tsx` | Recuperar contraseña |

**Protección:** Si autenticado → redirige a `/dashboard`

### 12.2 Rutas Protegidas (`(protected)/`)

| Ruta | Método | Componente | Descripción |
|------|--------|-----------|-------------|
| `/dashboard` | GET | `dashboard/page.tsx` | Dashboard del usuario |
| `/profile` | GET | `profile/page.tsx` | Perfil del usuario autenticado |
| `/profile/[userId]` | GET | `profile/[userId]/page.tsx` | Perfil de otro usuario (visitante) |
| `/projects` | GET | `projects/page.tsx` | Lista de proyectos |
| `/projects/[id]` | GET | `projects/[id]/page.tsx` | Detalle de proyecto |

**Protección:** Requiere autenticación → redirige a `/login` si no autenticado

**Validaciones Especiales (`/profile/[userId]`):**
- ✅ Si `[userId] === user.uid` → redirige automáticamente a `/profile`
- ✅ Si usuario no existe → muestra página 404 con enlaces de navegación
- ✅ Solo muestra botón "Seguir" si NO es el perfil propio

### 12.3 Rutas de Administración (`(protected)/admin/`)

| Ruta | Método | Componente | Descripción |
|------|--------|-----------|-------------|
| `/admin` | GET | `admin/page.tsx` | Dashboard admin |
| `/admin/blog` | GET | `admin/blog/page.tsx` | Lista de posts del blog |
| `/admin/blog/newpost` | GET | `admin/blog/newpost/page.tsx` | Crear nuevo post |

**Protección:** Requiere autenticación + email admin → redirige a `/dashboard` si no es admin

### 12.4 Rutas Públicas (`(public)/`)

| Ruta | Método | Componente | Descripción |
|------|--------|-----------|-------------|
| `/` | GET | `page.tsx` | Página de inicio |
| `/blog` | GET | `blog/page.tsx` | Lista de posts del blog (público) |
| `/blog/[id]` | GET | `blog/[id]/page.tsx` | Detalle de post del blog |
| `/community` | GET | `community/page.tsx` | Lista de posts de comunidad |
| `/community/[id]` | GET | `community/[id]/page.tsx` | Detalle de post de comunidad |

**Protección:** Público, pero interactuar (likes, comentarios) requiere autenticación

### 12.5 API Routes (`app/api/`)

| Ruta | Método | Handler | Descripción |
|------|--------|---------|-------------|
| `/api/init-blog` | POST | `init-blog/route.ts` | Inicializar blog (endpoint admin) |

**Nota:** No se encontraron más API routes. La aplicación usa principalmente Firebase directamente desde el cliente.

---

## 📋 CONCLUSIÓN

El proyecto **ElectricianHub** es una aplicación Next.js moderna y bien estructurada con:

✅ **Fortalezas:**
- Arquitectura clara y escalable
- Uso correcto de React Query para state management
- Sistema completo de autenticación y seguridad
- Validación en cliente y servidor
- Código TypeScript bien tipado

⚠️ **Áreas de mejora:**
- Limpieza de console.logs
- Optimización de performance
- Tests unitarios

✅ **Funcionalidades Nuevas (Diciembre 2024):**
- Visualización de perfil de otros usuarios (`/profile/[userId]`)
- Componente `ProfileSidebar` para información adicional
- Componentes reutilizables con props opcionales (`isOwnProfile`, `userId`)
- Hooks nuevos: `useUserProfileById()`, `useUserProjectsById()`
- Correcciones de manejo de Timestamps de Firestore en múltiples componentes
- Validaciones y redirecciones automáticas en perfiles visitantes

🎯 **Estado general:** ✅ **Listo para producción con mejoras menores recomendadas**

---

---

## 🔄 ACTUALIZACIÓN: Visualización de Perfil de Otros Usuarios (Diciembre 2024)

### Cambios Implementados

#### 1. Nueva Ruta de Perfil Visitante
- ✅ **Ruta:** `/profile/[userId]/page.tsx`
- ✅ **Funcionalidad:** Visualización de perfil de otros usuarios
- ✅ **Validaciones:**
  - Si `[userId] === user.uid` → redirige automáticamente a `/profile`
  - Si usuario no existe → muestra página 404 con enlaces de navegación
  - Protección de autenticación (manejado por `ProtectedRoute`)
  - Solo muestra botón "Seguir" si NO es el perfil propio

#### 2. Componentes Actualizados

**`ProfileHeader` (`src/components/profile/profile-header.tsx`):**
- ✅ Nuevo prop: `isOwnProfile?: boolean` (default: `true`)
- ✅ Nuevo prop: `userId?: string` (para `ProfileStats`)
- ✅ Oculta botones de edición cuando `isOwnProfile = false`
- ✅ Muestra avatar de solo lectura para perfiles visitantes
- ✅ No muestra `ProfileEditDialog` en perfiles ajenos

**`ProfileSidebar` (`src/components/profile/profile-sidebar.tsx`)** - **NUEVO:**
- ✅ Componente creado para mostrar información adicional
- ✅ **Contenido:** Ubicación, Experiencia (miembro desde), Especialidades, Certificaciones
- ✅ Responsive y compatible con dark mode
- ✅ Usado en perfil propio y de otros usuarios

**`ProfileStats` (`src/components/profile/profile-stats.tsx`):**
- ✅ Nuevo prop: `userId?: string` (opcional)
- ✅ Si se proporciona `userId`, obtiene stats de ese usuario
- ✅ Si no se proporciona, obtiene stats del usuario actual
- ✅ Maneja conversión de Timestamps de Firestore a Date

**`ProfileTabs` (`src/components/profile/profile-tabs.tsx`):**
- ✅ Nuevo prop: `userId?: string` (opcional)
- ✅ Usa `useUserProjectsById(userId)` si se proporciona userId
- ✅ Usa `useUserProjects()` si no se proporciona (usuario actual)
- ✅ Muestra proyectos del usuario visitado correctamente
- ✅ Manejo robusto de fechas (Timestamps de Firestore)

#### 3. Nuevos Hooks

**`useUserProfileById(userId)`** en `src/lib/react-query/queries.ts`:
- ✅ Hook para obtener perfil de cualquier usuario por ID
- ✅ Query key: `queryKeys.profile.detail(userId)`
- ✅ Retorna: `UserProfile` con `id` incluido
- ✅ Manejo de errores si usuario no existe

**`useUserProjectsById(userId)`** en `src/lib/react-query/queries.ts`:
- ✅ Hook para obtener proyectos de cualquier usuario por ID
- ✅ Query key: `queryKeys.projects.list({ userId })`
- ✅ Convierte Timestamps de Firestore a Date en el servicio
- ✅ Retorna: `Project[]` con fechas correctamente formateadas

#### 4. Correcciones de Timestamps

**Problema Identificado:**
- Firestore devuelve `Timestamp` objects, no `Date` nativos de JavaScript
- Funciones como `toLocaleDateString()` y `formatDistanceToNow()` requieren objetos `Date`

**Soluciones Implementadas:**

**`src/lib/firebase/projects.ts`** - Servicio `getUserProjects`:
- ✅ Convierte `createdAt` de Timestamp a Date al obtener proyectos
- ✅ Maneja objetos serializados de Timestamp (con `seconds` y `nanoseconds`)
- ✅ Fallback a Date nativo si ya es Date

**`src/components/profile/profile-tabs.tsx`**:
- ✅ Función helper `convertToDate()` que maneja múltiples tipos de fechas
- ✅ Soporta: Timestamp de Firestore, objetos con seconds/nanoseconds, Date, string, number
- ✅ Validación de fechas inválidas con mensaje de error amigable

**`src/components/community/community-post-card.tsx`**:
- ✅ Función helper `convertToDate()` implementada
- ✅ Corrección de error al formatear `createdAt` con `formatDistanceToNow()`

#### 5. Actualización de Tipos

**`src/types/profile.ts`:**
- ✅ `ProfileTabsProps` actualizado con prop opcional `userId?: string`
- ✅ `transformUserToProfileHeader()` mejorada para usar `user.id` si existe

#### 6. Layout y Diseño

**Página `/profile/[userId]`:**
- ✅ Layout responsive con Sidebar + Tabs
- ✅ Botón "Volver" para navegar al dashboard
- ✅ Botón "Seguir/Dejar de seguir" visible solo si no es el perfil propio
- ✅ Loading states con spinners
- ✅ Error states con mensajes claros y enlaces de navegación

---

**Documento generado:** Diciembre 2024  
**Última actualización:** Diciembre 2024 - Visualización de perfil de otros usuarios y correcciones de Timestamps


