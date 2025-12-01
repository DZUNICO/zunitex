// src/types/index.ts

import { Timestamp } from 'firebase/firestore';
import { UserRole, UserType, UserVerificationInfo, VerificationStatus } from './roles';

/**
 * Interfaz completa para usuarios en Firestore
 */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  phone?: string;
  
  // NUEVOS CAMPOS DE ROLES
  role: UserRole;              // Role actual del usuario
  userType: UserType;          // Tipo de usuario (categoría de negocio)
  
  // INFORMACIÓN DE VERIFICACIÓN
  verificationStatus: VerificationStatus;
  verificationRequestedAt?: Timestamp;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;
  
  // INFORMACIÓN ADICIONAL SEGÚN TIPO
  electricianInfo?: {
    experience?: string;
    certifications?: string[];
    services?: string[];
    licenseNumber?: string;
  };
  
  corporateProInfo?: {
    companyName: string;      // Nombre de la empresa
    companyId?: string;       // UID de la cuenta corporativa en Firestore
    position: string;         // Cargo (ej: "Especialista de Automatización")
    department?: string;
    corporateEmail?: string;  // Email corporativo
  };
  
  providerInfo?: {
    companyName?: string;
    ruc?: string;             // RUC (Perú)
    address?: string;
    phone?: string;
    website?: string;
    productCategories?: string[];
  };
  
  // Resto de campos existentes
  location?: string;
  website?: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  followersCount: number;
  followingCount: number;
  projectsCount: number;
  rating?: number;
  specialties?: string[];
  active?: boolean;
  // ... otros campos existentes
}

// Re-exportar tipos de roles
export type { UserRole, UserType, VerificationStatus, CustomClaims, UserVerificationInfo } from './roles';
export { RolePermissions, DEFAULT_ROLE, DEFAULT_USER_TYPE, ADMIN_EMAIL } from './roles';

