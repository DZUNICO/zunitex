// src/types/roles.ts

/**
 * ROLES - Permisos/privilegios del usuario
 * Define QUÉ puede hacer el usuario
 */
export type UserRole = 
  | 'admin'           // Admin total - puede hacer todo
  | 'moderator'       // Modera contenido (blog, comunidad)
  | 'corporate_pro'   // Profesional de empresa (puede dar capacitaciones)
  | 'verified_seller' // Puede vender productos/recursos
  | 'verified_pro'    // Profesional verificado independiente
  | 'user';           // Usuario básico (default)

/**
 * TIPOS DE USUARIO - Categoría de perfil visible
 * Define QUIÉN es el usuario (display, no afecta permisos)
 */
export type UserType =
  | 'profesional'  // Técnicos, ingenieros, contratistas, estudiantes, compradores
  | 'proveedor';   // Ferreterías, distribuidores, importadores, fabricantes

/**
 * Custom Claims en el token JWT
 */
export interface CustomClaims {
  role: UserRole;
  admin: boolean; // Helper para isAdmin() rápido
}

/**
 * Estado de verificación del usuario
 */
export type VerificationStatus = 
  | 'pending'   // Solicitud enviada, pendiente revisión
  | 'verified'  // Verificado por admin
  | 'rejected'  // Rechazado
  | null;       // No ha solicitado

/**
 * Información de verificación en Firestore
 */
export interface UserVerificationInfo {
  verificationStatus: VerificationStatus;
  verificationRequestedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: string; // UID del admin que verificó
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
}

/**
 * Helpers para verificar permisos
 */
export const RolePermissions = {
  canCreateBlogPosts: (role: UserRole): boolean => {
    return ['admin', 'moderator'].includes(role);
  },
  
  canDeleteOthersBlogPosts: (role: UserRole): boolean => {
    return ['admin', 'moderator'].includes(role);
  },
  
  canDeleteOthersCommunityPosts: (role: UserRole): boolean => {
    return ['admin', 'moderator'].includes(role);
  },
  
  canPublishResources: (role: UserRole): boolean => {
    return ['admin', 'verified_seller'].includes(role);
  },
  
  canDeleteOthersResources: (role: UserRole): boolean => {
    return role === 'admin';
  },
  
  canDeleteUsers: (role: UserRole): boolean => {
    return role === 'admin';
  },
  
  canAssignRoles: (role: UserRole): boolean => {
    return role === 'admin';
  },
  
  canGiveTraining: (role: UserRole): boolean => {
    return ['admin', 'moderator', 'corporate_pro', 'verified_seller', 'verified_pro'].includes(role);
  },
  
  isAdmin: (role: UserRole): boolean => {
    return role === 'admin';
  },
  
  isModerator: (role: UserRole): boolean => {
    return role === 'moderator';
  }
} as const;

/**
 * Constantes
 */
export const DEFAULT_ROLE: UserRole = 'user';
export const DEFAULT_USER_TYPE: UserType = 'profesional';
export const ADMIN_EMAIL = 'diego.zuni@gmail.com';








