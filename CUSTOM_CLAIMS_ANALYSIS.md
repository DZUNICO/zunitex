# ANÁLISIS CUSTOM CLAIMS - STARLOGIC

**Fecha:** 2024  
**Proyecto:** STARLOGIC  
**Fase:** Implementar Custom Claims (4/5)  
**Progreso:** 3/5 completados (maxPages, Backups, Testing)

---

## 1. ESTADO ACTUAL

### Autenticación

**Sistema actual:** Firebase Authentication (Email/Password)

**Archivo principal:** `src/lib/context/auth-context.tsx`

**Propiedades del objeto `user`:**
- Tipo: `User` (Firebase Auth)
- Propiedades disponibles:
  - `uid`: ID único del usuario
  - `email`: Correo electrónico
  - `displayName`: Nombre de visualización
  - `photoURL`: URL de foto de perfil
  - `emailVerified`: Estado de verificación de email
  - `metadata`: Metadatos de creación/último acceso

**Campo de "role" o "permissions":**
- ❌ **NO existe en el token de autenticación**
- ✅ **SÍ existe en Firestore** (`users/{userId}.role`)
- Valores posibles en Firestore: `'user'`, `'electrician'`, `'provider'`
- Valor por defecto al registrarse: `'user'`

**Manejo de login/logout:**
- **Login:** `signInWithEmailAndPassword()` en `signIn()`
- **Logout:** `signOut()` en `logout()`
- **Registro:** `createUserWithEmailAndPassword()` + creación de documento en Firestore con `role: 'user'`
- **Estado:** Se mantiene con `onAuthStateChanged()` y `browserLocalPersistence`
- **Actualización:** Al iniciar sesión, se actualiza `lastLogin` en Firestore

**Contexto de autenticación:**
```12:23:src/lib/context/auth-context.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Problema identificado:**
- El contexto NO expone información de roles del usuario
- No hay forma de verificar roles sin hacer una consulta adicional a Firestore
- El componente `ProtectedRoute` tiene soporte para `allowedRoles` pero no está implementado

---

### Security Rules

**Archivo:** `firestore.rules`

**Funciones de verificación:**

1. **`isAuthenticated()`**
   - Verifica que `request.auth != null`
   - Usada en todas las reglas

2. **`isOwner(userId)`**
   - Verifica que el usuario autenticado es el propietario
   - `request.auth.uid == userId`

3. **`hasRole(role)`** ⚠️ **PROBLEMA DE RENDIMIENTO**
   ```14:17:firestore.rules
   function hasRole(role) {
     return isAuthenticated() && 
            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
   }
   ```
   - Hace un `get()` a Firestore en cada verificación
   - **Costoso en términos de lecturas y latencia**
   - **NO se usa actualmente** en ninguna regla

4. **`isAdmin()`** ⚠️ **PROBLEMA DE ESCALABILIDAD**
   ```19:22:firestore.rules
   function isAdmin() {
     return isAuthenticated() && 
            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.email in ['diego.zuni@gmail.com'];
   }
   ```
   - Email hardcodeado: `'diego.zuni@gmail.com'`
   - Requiere `get()` a Firestore
   - **No escalable** - requiere deploy para agregar nuevos admins
   - **Riesgo de seguridad** si el email cambia o se compromete

5. **`isValidEmail(email)`**
   - Validación de formato de email

**Colecciones protegidas:**

| Colección | Lectura | Creación | Actualización | Eliminación |
|-----------|---------|----------|---------------|-------------|
| `users` | Autenticados | Autenticados (propio) + `role == 'user'` | Propio (con restricciones) | Solo admin |
| `projects` | Público | Autenticados (propio) | Propio o admin | Propio o admin |
| `blog-posts` | Público | **Solo admin** | Autor o admin | Autor o admin |
| `blog-comments` | Público | Autenticados | Propio o admin | Propio o admin |
| `community-posts` | Público | Autenticados | Propio | Propio o admin |
| `post-comments` | Público | Autenticados | Propio o admin | Propio o admin |
| `resources` | Público (si `isPublic`) o admin | **Solo admin** | Propio o admin | Propio o admin |
| `reviews` | Autenticados | Autenticados (propio) | Propio o admin | Propio o admin |

**Custom claims usados:**
- ❌ **NO** - No hay referencias a `request.auth.token.*` en las reglas
- Todas las verificaciones de roles se hacen consultando Firestore

**Storage Rules:**
- Archivo: `storage.rules`
- También usa `isAdmin()` con email hardcodeado:
  ```11:13:storage.rules
  function isAdmin() {
    return isAuth() && request.auth.token.email == "diego.zuni@gmail.com";
  }
  ```
- ⚠️ **Inconsistencia:** Usa `request.auth.token.email` (que SÍ está disponible) pero sigue siendo hardcodeado

---

### Cloud Functions

**Archivo principal:** `functions/src/index.ts`

**Funciones relacionadas con usuarios:**
- ❌ **NO hay** funciones `onUserCreate` o `onUserUpdate`
- ❌ **NO hay** funciones que sincronicen roles a Custom Claims
- ❌ **NO hay** funciones que gestionen permisos

**Funciones existentes:**
- `onPostLikeCreate` / `onPostLikeDelete` - Gestión de likes en posts de comunidad
- `onBlogLikeCreate` / `onBlogLikeDelete` - Gestión de likes en blog
- `onResourceLikeCreate` / `onResourceLikeDelete` - Gestión de likes en recursos
- `onFollowerCreate` / `onFollowerDelete` - Gestión de seguidores
- `onReviewCreate` / `onReviewUpdate` / `onReviewDelete` - Gestión de reviews
- `scheduledFirestoreBackup` - Backups programados

**Verificación de roles:**
- ❌ **NO** - Ninguna función verifica roles actualmente
- Las funciones solo actualizan contadores y relaciones

**Estructura de triggers:**
```
functions/src/triggers/
  - blog-likes.ts
  - followers.ts
  - post-likes.ts
  - resource-likes.ts
  - reviews.ts
```

---

## 2. ROLES REQUERIDOS

Basado en el análisis de funcionalidades, se identifican los siguientes requisitos:

### Funcionalidades analizadas

#### A. Blog Posts
**Ubicación:** `src/app/(protected)/admin/blog/newpost/page.tsx`

- **Crear posts:** Solo admin (verificado en Security Rules línea 123)
- **Moderar/eliminar:** Autor o admin (Security Rules líneas 129, 137)
- **Estado actual:** Cualquier usuario autenticado puede acceder a la UI, pero Firestore bloquea la creación si no es admin

#### B. Comunidad
**Ubicación:** `src/components/community/create-post-form.tsx`, `src/app/(public)/community/page.tsx`

- **Crear posts:** Cualquier usuario autenticado (Security Rules línea 266)
- **Moderar/eliminar:** Propio post o admin (Security Rules líneas 287, 297)
- **Aprobación:** No hay sistema de aprobación
- **Moderadores:** No existen moderadores explícitos

#### C. Recursos/Productos
**Ubicación:** `src/lib/firebase/resources.ts`, `firestore.rules` línea 225

- **Publicar recursos:** Solo admin (Security Rules línea 225)
- **Vendedores verificados:** No existe este concepto
- **Estado actual:** Recursos solo pueden ser creados por admin

#### D. Administración
**Ubicación:** `src/components/shared/admin-route.tsx`

- **Panel de admin:** Existe en `/admin/blog`
- **Verificación actual:** Email hardcodeado en frontend:
  ```8:8:src/components/shared/admin-route.tsx
  const ADMIN_EMAILS = ['diego.zuni@gmail.com']; // Reemplaza con tu correo
  ```
- **Acciones solo para admins:**
  - Crear posts de blog
  - Crear recursos
  - Eliminar usuarios
  - Eliminar cualquier contenido (posts, comentarios, reviews)

### Roles propuestos

Basado en el análisis, se proponen los siguientes roles:

- [x] `admin` - Administrador total
  - Acceso completo a todas las funcionalidades
  - Puede crear blog posts y recursos
  - Puede eliminar cualquier contenido
  - Puede eliminar usuarios

- [ ] `moderator` - Moderador comunidad/blog
  - **NUEVO** - No existe actualmente
  - Puede moderar posts de comunidad (editar/eliminar)
  - Puede moderar comentarios
  - Puede crear posts de blog (opcional)
  - **Recomendación:** Implementar para escalar moderación

- [ ] `verified_seller` - Vendedor verificado
  - **NUEVO** - No existe actualmente
  - Podría publicar recursos (actualmente solo admin)
  - **Recomendación:** Si se implementa marketplace en el futuro

- [x] `user` - Usuario básico (default)
  - Puede crear posts de comunidad
  - Puede crear proyectos
  - Puede comentar y dar likes
  - Puede crear reviews

- [x] `electrician` - Electricista
  - Mismo que `user` actualmente
  - Podría tener permisos especiales en el futuro

- [x] `provider` - Proveedor
  - Mismo que `user` actualmente
  - Podría tener permisos especiales en el futuro

### Permisos por rol

| Acción | Admin | Moderator | Verified Seller | User | Electrician | Provider |
|--------|-------|-----------|----------------|------|-------------|----------|
| Ver contenido público | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear posts comunidad | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear posts blog | ✅ | ⚠️ (opcional) | ❌ | ❌ | ❌ | ❌ |
| Crear recursos | ✅ | ❌ | ✅ (futuro) | ❌ | ❌ | ❌ |
| Editar posts propios | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Eliminar posts propios | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Eliminar posts ajenos | ✅ | ✅ (comunidad) | ❌ | ❌ | ❌ | ❌ |
| Eliminar comentarios ajenos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Eliminar usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Moderar contenido | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crear proyectos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear reviews | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Nota:** `electrician` y `provider` actualmente tienen los mismos permisos que `user`. La diferenciación podría implementarse en el futuro.

---

## 3. ARCHIVOS A MODIFICAR

### Cloud Functions

**Nuevos archivos a crear:**
- [ ] `functions/src/triggers/users.ts` - Trigger `onUserCreate` y `onUserUpdate`
  - Sincronizar `role` de Firestore a Custom Claims
  - Actualizar claims cuando cambie el rol

**Archivos a modificar:**
- [ ] `functions/src/index.ts` - Exportar nuevas funciones de usuarios
- [ ] `functions/src/config.ts` - Verificar que Admin SDK esté configurado correctamente

**Ejemplo de implementación:**
```typescript
// functions/src/triggers/users.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const userData = snap.data();
    const role = userData.role || 'user';
    
    await admin.auth().setCustomUserClaims(userId, {
      role: role,
      admin: role === 'admin'
    });
  });

export const onUserUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Solo actualizar si cambió el rol
    if (newData.role !== oldData.role) {
      const role = newData.role || 'user';
      
      await admin.auth().setCustomUserClaims(userId, {
        role: role,
        admin: role === 'admin'
      });
    }
  });
```

### Security Rules

**Archivos a modificar:**
- [ ] `firestore.rules` - Reemplazar funciones helper
  - Modificar `isAdmin()` para usar `request.auth.token.admin`
  - Modificar `hasRole(role)` para usar `request.auth.token.role`
  - Eliminar `get()` innecesarios

**Cambios propuestos:**
```javascript
// ANTES (costoso)
function isAdmin() {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.email in ['diego.zuni@gmail.com'];
}

// DESPUÉS (eficiente)
function isAdmin() {
  return isAuthenticated() && request.auth.token.admin == true;
}

// ANTES (costoso, no usado)
function hasRole(role) {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
}

// DESPUÉS (eficiente)
function hasRole(role) {
  return isAuthenticated() && request.auth.token.role == role;
}
```

- [ ] `storage.rules` - Actualizar `isAdmin()`
  - Cambiar de `request.auth.token.email` a `request.auth.token.admin`

### Frontend

**Archivos a modificar:**
- [ ] `src/lib/context/auth-context.tsx` - Agregar claims al contexto
  - Obtener `user.getIdTokenResult()` para acceder a claims
  - Exponer `role` y `admin` en el contexto
  - Actualizar tipo `AuthContextType`

**Cambios propuestos:**
```typescript
interface AuthContextType {
  user: User | null;
  userRole: string | null;  // NUEVO
  isAdmin: boolean;         // NUEVO
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

- [ ] `src/components/shared/admin-route.tsx` - Usar Custom Claims
  - Eliminar `ADMIN_EMAILS` hardcodeado
  - Usar `isAdmin` del contexto

- [ ] `src/components/shared/protected-route.tsx` - Implementar verificación de roles
  - Usar `allowedRoles` para verificar permisos
  - Comparar con `userRole` del contexto

**Archivos que podrían necesitar cambios:**
- [ ] `src/app/(protected)/admin/blog/newpost/page.tsx` - Verificar permisos antes de mostrar UI
- [ ] `src/components/profile/profile-edit-dialog.tsx` - Restringir cambio de roles (solo admin)
- [ ] Cualquier componente que verifique permisos de admin

### Migración de datos existentes

**Script de migración necesario:**
- [ ] Crear script para establecer Custom Claims en usuarios existentes
- [ ] Leer todos los documentos de `users`
- [ ] Establecer claims basado en `role` actual
- [ ] Ejecutar una sola vez antes del deploy

**Ubicación sugerida:** `scripts/migrate-custom-claims.ts`

---

## 4. DEPENDENCIAS

**¿Se necesitan nuevas dependencias?**

- [ ] **NO** - Todas las dependencias necesarias ya están instaladas:
  - `firebase-admin` (ya en `functions/package.json`)
  - `firebase/auth` (ya en `package.json`)
  - No se requieren librerías adicionales

**Dependencias existentes relevantes:**
- `firebase-admin@^12.7.0` - Para Cloud Functions
- `firebase@^10.x` - Para cliente (ya incluye auth)

---

## 5. RIESGOS IDENTIFICADOS

### ⚠️ Riesgos técnicos

1. **Cache de tokens**
   - Los Custom Claims se incluyen en el token JWT
   - Los tokens tienen una vida útil (1 hora por defecto)
   - **Problema:** Si se actualiza un rol, el usuario debe esperar hasta que expire el token o hacer logout/login
   - **Solución:** Forzar refresh del token después de actualizar claims en Cloud Functions

2. **Usuarios existentes sin claims**
   - Usuarios creados antes de la implementación no tendrán claims
   - **Problema:** Security Rules fallarán para estos usuarios
   - **Solución:** Script de migración + establecer claims por defecto en `onUserCreate`

3. **Inconsistencia entre Firestore y Claims**
   - Si se actualiza `role` en Firestore pero falla la Cloud Function
   - **Problema:** Desincronización
   - **Solución:** Implementar retry logic y logging en Cloud Functions

### ⚠️ Riesgos de funcionalidad

1. **Componentes que dependen de email hardcodeado**
   - `src/components/shared/admin-route.tsx` verifica email
   - `storage.rules` verifica email
   - **Problema:** Si no se actualizan, seguirán funcionando pero de forma inconsistente
   - **Solución:** Actualizar todos los lugares en el mismo deploy

2. **ProtectedRoute con allowedRoles no implementado**
   - El componente acepta `allowedRoles` pero no lo usa
   - **Problema:** No hay restricción real en frontend
   - **Solución:** Implementar la verificación cuando se agreguen claims

3. **Blog posts creation**
   - Actualmente solo admin puede crear (Security Rules)
   - Si se implementa `moderator`, habrá que actualizar las reglas
   - **Problema:** Cambio de comportamiento
   - **Solución:** Documentar y probar cuidadosamente

### ⚠️ Riesgos de seguridad

1. **Exposición de claims en frontend**
   - Los Custom Claims son visibles en el token decodificado
   - **Problema:** No es un riesgo real, pero hay que ser consciente
   - **Solución:** No almacenar información sensible en claims

2. **Escalación de privilegios**
   - Si un usuario modifica su documento en Firestore (aunque las reglas lo previenen)
   - **Problema:** Teóricamente podría cambiar su rol
   - **Solución:** Las Security Rules ya previenen esto, pero verificar que `role` no se pueda actualizar sin ser admin

3. **Admin hardcodeado actual**
   - El email `diego.zuni@gmail.com` está hardcodeado
   - **Problema:** Si se compromete, hay acceso total
   - **Solución:** Migrar a Custom Claims elimina este riesgo

### ⚠️ Riesgos de rendimiento

1. **Reducción de lecturas a Firestore**
   - **BENEFICIO:** Al usar Custom Claims, se eliminan los `get()` en Security Rules
   - **Impacto:** Reducción significativa de costos y latencia

2. **Token size**
   - Los Custom Claims aumentan el tamaño del token
   - **Problema:** Mínimo, pero hay que considerar
   - **Solución:** Mantener claims simples (solo `role` y `admin`)

---

## 6. RECOMENDACIÓN

### ✅ **SEGURO implementar Custom Claims:** SÍ

**Razones principales:**

1. **Rendimiento y costo**
   - Elimina lecturas costosas a Firestore en Security Rules
   - `isAdmin()` y `hasRole()` actualmente hacen `get()` en cada verificación
   - Con Custom Claims, la verificación es instantánea y sin costo

2. **Escalabilidad**
   - Elimina el admin hardcodeado
   - Permite agregar nuevos admins sin deploy
   - Facilita la implementación de nuevos roles (moderator, verified_seller)

3. **Consistencia**
   - Unifica la verificación de roles en Security Rules y Storage Rules
   - Elimina la inconsistencia entre frontend (email) y backend (email en Firestore)

4. **Seguridad**
   - Los Custom Claims son parte del token firmado por Firebase
   - No pueden ser modificados por el cliente
   - Más seguro que verificar email o leer de Firestore

5. **Preparación para futuro**
   - Facilita la implementación de moderadores
   - Permite roles más granulares
   - Base para sistema de permisos más complejo

**Precauciones necesarias:**

1. **Migración cuidadosa**
   - Ejecutar script de migración para usuarios existentes
   - Probar en entorno de desarrollo primero
   - Tener rollback plan

2. **Actualización de tokens**
   - Forzar refresh después de actualizar claims
   - Considerar invalidar tokens existentes si es crítico

3. **Testing exhaustivo**
   - Probar todos los flujos de autenticación
   - Verificar Security Rules con diferentes roles
   - Probar Storage Rules
   - Verificar componentes de frontend

4. **Documentación**
   - Documentar el nuevo sistema de roles
   - Actualizar guías de desarrollo
   - Documentar proceso de asignación de roles

5. **Monitoreo**
   - Agregar logging en Cloud Functions de usuarios
   - Monitorear errores de permisos
   - Alertar si hay fallos en la sincronización

**Plan de implementación sugerido:**

1. **Fase 1: Preparación (1-2 días)**
   - Crear Cloud Functions para sincronizar claims
   - Crear script de migración
   - Actualizar Security Rules (mantener compatibilidad con ambos sistemas)

2. **Fase 2: Migración (1 día)**
   - Ejecutar script de migración
   - Verificar que todos los usuarios tengan claims
   - Probar en desarrollo

3. **Fase 3: Actualización (1-2 días)**
   - Actualizar Security Rules para usar solo claims
   - Actualizar Storage Rules
   - Actualizar frontend

4. **Fase 4: Testing (1 día)**
   - Testing completo
   - Verificar todos los flujos
   - Probar con diferentes roles

5. **Fase 5: Deploy (1 día)**
   - Deploy a producción
   - Monitoreo
   - Rollback si es necesario

**Tiempo estimado total:** 5-7 días

---

## 7. REFERENCIAS Y ARCHIVOS RELEVANTES

### Archivos analizados

**Autenticación:**
- `src/lib/context/auth-context.tsx` - Contexto de autenticación
- `src/components/shared/admin-route.tsx` - Ruta protegida para admin
- `src/components/shared/protected-route.tsx` - Ruta protegida genérica

**Security Rules:**
- `firestore.rules` - Reglas de Firestore
- `storage.rules` - Reglas de Storage

**Cloud Functions:**
- `functions/src/index.ts` - Punto de entrada
- `functions/src/triggers/` - Triggers existentes

**Funcionalidades:**
- `src/app/(protected)/admin/blog/newpost/page.tsx` - Creación de blog posts
- `src/components/community/create-post-form.tsx` - Creación de posts de comunidad
- `src/lib/firebase/resources.ts` - Gestión de recursos
- `src/lib/firebase/blog.ts` - Gestión de blog

**Documentación:**
- `AUDITORIA_ARQUITECTONICA.md` - Menciona problemas de admin hardcodeado
- `DOCUMENTACION.md` - Documentación del proyecto

### Problemas identificados en documentación

La auditoría arquitectónica (`AUDITORIA_ARQUITECTONICA.md`) ya identifica estos problemas:
- **VULN-001:** Admin hardcodeado en Security Rules
- **VULN-002:** `hasRole()` hace `get()` en cada verificación
- **VULN-008:** No hay Custom Claims para roles

Este análisis confirma y detalla estos problemas, proporcionando un plan de implementación.

---

## 8. CONCLUSIÓN

El proyecto STARLOGIC **está listo para implementar Custom Claims**. El sistema actual funciona pero tiene limitaciones de rendimiento, escalabilidad y seguridad que se resuelven con esta implementación.

**Beneficios inmediatos:**
- ✅ Reducción de costos (menos lecturas a Firestore)
- ✅ Mejor rendimiento (verificaciones instantáneas)
- ✅ Mayor seguridad (eliminación de admin hardcodeado)
- ✅ Escalabilidad (agregar roles sin deploy)

**Próximos pasos:**
1. Revisar y aprobar este análisis
2. Crear plan de implementación detallado
3. Iniciar Fase 1 (Preparación)

---

**Fin del análisis**

