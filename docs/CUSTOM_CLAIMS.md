# Sistema de Custom Claims - STARLOGIC

## Resumen

STARLOGIC implementa un sistema de roles basado en Firebase Custom Claims para gestionar permisos de usuarios de forma eficiente y segura.

## Roles Disponibles

### Permisos (Roles):

1. **admin** - Administrador total
   - Diego (diego.zuni@gmail.com)
   - Acceso completo a todas las funcionalidades

2. **moderator** - Moderador de contenido
   - Puede moderar blog y comunidad
   - No puede eliminar usuarios

3. **corporate_pro** - Profesional corporativo
   - Empleados de empresas grandes (ej: Ing. de SIEMENS)
   - Puede dar capacitaciones

4. **verified_seller** - Vendedor verificado
   - Puede publicar productos/recursos
   - Minoristas, distribuidores, fabricantes verificados

5. **verified_pro** - Profesional verificado
   - Electricistas verificados independientes

6. **user** - Usuario básico (default)
   - Acceso básico a la plataforma

### Tipos de Usuario:

1. **electrician** - Electricista independiente
2. **corporate_pro** - Profesional de empresa
3. **retailer** - Minorista
4. **distributor** - Distribuidor
5. **manufacturer** - Fabricante
6. **buyer** - Comprador
7. **student** - Estudiante
8. **general** - Usuario general (default)

## Arquitectura

### Custom Claims en Token JWT

Los roles se almacenan en el token JWT del usuario:

```typescript
{
  role: 'admin',
  admin: true
}
```

### Sincronización Firestore → Custom Claims

1. Usuario se registra → `role: 'user'` en Firestore
2. Cloud Function `onUserCreate` → Sincroniza a Custom Claims
3. Admin cambia role en Firestore → Cloud Function `onUserDocumentUpdate` → Sincroniza a Custom Claims

### Verificación en Security Rules

```javascript
function isAdmin() {
  return request.auth.token.admin == true;
}

function hasRole(role) {
  return request.auth.token.role == role;
}
```

## Flujos de Usuario

### Nuevo Usuario

1. Registro → `role: 'user'`, `userType: 'general'`
2. Cloud Function establece Custom Claims
3. Usuario puede usar la plataforma

### Solicitud de Verificación

1. Usuario completa perfil
2. Click "Solicitar Verificación"
3. `verificationStatus: 'pending'`
4. Admin revisa y aprueba
5. Admin cambia `role` a `verified_seller` o `verified_pro`
6. Cloud Function sincroniza Custom Claims
7. Usuario obtiene permisos adicionales

### Cambio de Rol (Solo Admin)

1. Admin accede a panel de administración
2. Selecciona usuario
3. Cambia `role` en Firestore
4. Cloud Function sincroniza automáticamente
5. Usuario debe refrescar página para ver cambios

## Uso en Frontend

### Hook useAuth

```typescript
const { user, userRole, isAdmin } = useAuth();

if (isAdmin) {
  // Mostrar funcionalidades de admin
}
```

### Hook useRolePermissions

```typescript
const { canCreateBlogPosts, canPublishResources } = useRolePermissions();

if (canCreateBlogPosts) {
  // Mostrar botón crear post
}
```

### Componente AdminRoute

```typescript
<AdminRoute>
  <AdminPanel />
</AdminRoute>
```

## Testing

### Tests Unitarios

```bash
cd functions
npm test
```

### Tests de Integración

1. Crear usuario de prueba
2. Verificar Custom Claims
3. Cambiar role
4. Verificar sincronización
5. Probar Security Rules

## Troubleshooting

### Custom Claims no se actualizan

**Solución:** El usuario debe refrescar su token:

```typescript
await user.getIdToken(true); // Force refresh
```

O llamar a:

```typescript
const { refreshToken } = useAuth();
await refreshToken();
```

### Usuario no tiene permisos después de cambiar role

**Problema:** Token no se ha refrescado

**Solución:** 
1. Logout/Login
2. O llamar a `refreshToken()`

### Cloud Function no sincroniza

**Verificar:**

1. Cloud Function está deployada: `firebase functions:list`
2. Ver logs: `firebase functions:log`
3. Verificar que el documento en Firestore se actualizó

## Mantenimiento

### Agregar nuevo role

1. Actualizar `src/types/roles.ts`
2. Actualizar `functions/src/custom-claims.ts`
3. Actualizar Security Rules en `firestore.rules`
4. Actualizar matriz de permisos en `RolePermissions`
5. Deploy: `firebase deploy`

### Cambiar admin

1. Actualizar `ADMIN_EMAIL` en `src/types/roles.ts`
2. Actualizar `ADMIN_EMAIL` en `functions/src/custom-claims.ts`
3. Ejecutar script de migración
4. Deploy: `firebase deploy`





