# 🚀 Migración Completa a React Query

## ✅ Tareas Completadas

### 1. Archivo Centralizado de Queries
- ✅ Creado `/lib/react-query/queries.ts` con todas las queries organizadas
- ✅ Query keys organizados por entidad (projects, comments, blog, profile, followers, resources, reviews)
- ✅ Tipos de filtros definidos para cada entidad

### 2. Paginación Infinita Implementada
- ✅ `useProjects()` - Con paginación infinita usando `useInfiniteQuery`
- ✅ `useResources()` - Con paginación infinita
- ✅ `useReviews()` - Con paginación infinita
- ✅ `useBlogPosts()` - Con paginación infinita (placeholder para implementación futura)

### 3. Queries Nuevas Agregadas
- ✅ `useFollowers()` - Obtener seguidores de un usuario
- ✅ `useFollowing()` - Obtener usuarios que sigue un usuario
- ✅ `useIsFollowing()` - Verificar si un usuario sigue a otro
- ✅ `useResources()` - Obtener recursos con paginación infinita
- ✅ `useResource()` - Obtener un recurso específico
- ✅ `useReviews()` - Obtener reviews con paginación infinita
- ✅ `useReview()` - Obtener un review específico

### 4. QueryProvider Optimizado
- ✅ Configuración específica por tipo de dato:
  - **staleTime**: 5 minutos por defecto (datos estáticos)
  - **gcTime**: 10 minutos en caché
  - **refetchOnWindowFocus**: false (datos estáticos)
  - **refetchOnReconnect**: true (importante para datos que pueden cambiar)
  - **retryDelay**: Exponencial backoff (1s, 2s, 4s, hasta 30s)

### 5. Optimistic Updates Implementados
- ✅ `useCreateProject()` - Actualización optimista al crear proyecto
- ✅ `useUpdateProject()` - Actualización optimista al actualizar
- ✅ `useDeleteProject()` - Actualización optimista al eliminar
- ✅ `useAddComment()` - Actualización optimista al agregar comentario
- ✅ `useFollowUser()` - Actualización optimista al seguir/dejar de seguir

### 6. Servicios Nuevos Creados
- ✅ `src/lib/firebase/followers.ts` - Servicio completo de followers
- ✅ `src/lib/firebase/resources.ts` - Servicio completo de resources con paginación
- ✅ `src/lib/firebase/reviews.ts` - Servicio completo de reviews con paginación
- ✅ `src/lib/firebase/projects.ts` - Agregado método `getProjects()` con paginación

## 📊 Estructura del Archivo Centralizado

```typescript
// /lib/react-query/queries.ts

// Query Keys organizados
export const queryKeys = {
  projects: { ... },
  comments: { ... },
  blog: { ... },
  profile: { ... },
  followers: { ... },
  resources: { ... },
  reviews: { ... },
};

// Hooks de Projects
export function useProjects(filters?: ProjectFilters)
export function useUserProjects()
export function useProject(projectId: string | undefined)
export function useCreateProject() // Con optimistic update
export function useUpdateProject() // Con optimistic update
export function useDeleteProject() // Con optimistic update

// Hooks de Comments
export function useProjectComments(projectId: string | undefined)
export function useAddComment() // Con optimistic update

// Hooks de Blog
export function useBlogPosts(filters?: BlogFilters) // Con paginación infinita
export function useBlogPost(postId: string | undefined)

// Hooks de Profile
export function useUserProfile()
export function useUpdateProfile()

// Hooks de Followers
export function useFollowers(userId: string | undefined)
export function useFollowing(userId: string | undefined)
export function useIsFollowing(followerId: string | undefined, followingId: string | undefined)
export function useFollowUser() // Con optimistic update

// Hooks de Resources
export function useResources(filters?: ResourceFilters) // Con paginación infinita
export function useResource(resourceId: string | undefined)

// Hooks de Reviews
export function useReviews(filters?: ReviewFilters) // Con paginación infinita
export function useReview(reviewId: string | undefined)
```

## 🎯 Configuraciones de staleTime por Tipo de Dato

| Tipo de Dato | staleTime | Razón |
|--------------|-----------|-------|
| **Blog Posts** | 10 minutos | Muy estáticos, raramente cambian |
| **Project Details** | 5 minutos | Relativamente estáticos |
| **User Profile** | 5 minutos | Cambian ocasionalmente |
| **Projects List** | 5 minutos | Pueden cambiar con frecuencia |
| **Comments** | 2 minutos | Cambian frecuentemente |
| **Followers** | 3 minutos | Cambian ocasionalmente |
| **Reviews** | 3 minutos | Cambian ocasionalmente |
| **Resources** | 5 minutos | Relativamente estáticos |

## 🔄 Optimistic Updates

### Ejemplo: Crear Proyecto

```typescript
const createProject = useCreateProject();

// Al llamar mutateAsync, el proyecto aparece inmediatamente en la UI
// Si falla, se hace rollback automáticamente
await createProject.mutateAsync(projectData);
```

**Flujo:**
1. `onMutate`: Cancela queries en progreso y guarda estado anterior
2. Actualiza caché optimísticamente (proyecto aparece inmediatamente)
3. `mutationFn`: Ejecuta la operación real en Firestore
4. `onSuccess`: Invalida queries para refetch con datos reales
5. `onError`: Hace rollback al estado anterior si falla

## 📝 Ejemplos de Uso

### Paginación Infinita

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useProjects({ status: 'Completado' });

// Renderizar proyectos
{data?.pages.map((page) =>
  page.projects.map((project) => (
    <ProjectCard key={project.id} project={project} />
  ))
)}

// Botón para cargar más
{hasNextPage && (
  <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
    {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
  </Button>
)}
```

### Optimistic Update

```typescript
const addComment = useAddComment();

// El comentario aparece inmediatamente en la UI
await addComment.mutateAsync({
  projectId: '123',
  content: 'Excelente trabajo!'
});
```

### Seguir Usuario

```typescript
const followUser = useFollowUser();

await followUser.mutateAsync({
  followingId: 'user123',
  follow: true // o false para dejar de seguir
});
```

## 🔧 Componentes Actualizados

- ✅ `src/app/(protected)/projects/[id]/page.tsx` - Usa hooks centralizados
- ✅ `src/app/(protected)/projects/page.tsx` - Usa hooks centralizados
- ✅ `src/app/(protected)/profile/page.tsx` - Usa hooks centralizados

## 📈 Mejoras de Performance

### Antes:
- ❌ Sin paginación (cargaba todos los datos)
- ❌ Sin optimistic updates (espera por respuesta del servidor)
- ❌ Refetch innecesario al cambiar de ventana
- ❌ Sin caché inteligente

### Después:
- ✅ Paginación infinita (carga solo lo necesario)
- ✅ Optimistic updates (UI responde instantáneamente)
- ✅ No refetch al cambiar de ventana (datos estáticos)
- ✅ Caché inteligente con invalidación selectiva

## 🎯 Próximos Pasos (Opcional)

1. **Implementar paginación real en blogService**
   - Actualmente es un placeholder
   - Necesita método `getPosts()` con cursor

2. **Agregar más optimistic updates**
   - `useUpdateProfile()` - Actualizar perfil optimísticamente
   - `useCreateResource()` - Crear recurso optimísticamente

3. **Implementar prefetching**
   - Prefetch proyectos al hover sobre enlaces
   - Prefetch perfil al hover sobre avatar

4. **Agregar background refetching**
   - Refetch automático cada X minutos para datos críticos
   - Solo si la ventana está activa

---

**Fecha de migración**: $(date)
**Estado**: ✅ Completado - Listo para producción

