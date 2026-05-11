// src/types/roles.ts

export type UserRole = 'admin' | 'verified_seller' | 'user';

export type UserType = 'profesional' | 'proveedor';

export interface CustomClaims {
  role: UserRole;
  admin: boolean;
}

export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | null;

export interface UserVerificationInfo {
  verificationStatus: VerificationStatus;
  verificationRequestedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
}

export const RolePermissions = {
  canCreateBlogPosts: (role: UserRole): boolean => role === 'admin',
  canDeleteOthersBlogPosts: (role: UserRole): boolean => role === 'admin',
  canDeleteOthersCommunityPosts: (role: UserRole): boolean => role === 'admin',
  canPublishResources: (role: UserRole): boolean => role === 'admin' || role === 'verified_seller',
  canDeleteOthersResources: (role: UserRole): boolean => role === 'admin',
  canDeleteUsers: (role: UserRole): boolean => role === 'admin',
  canAssignRoles: (role: UserRole): boolean => role === 'admin',
  canOfferProducts: (role: UserRole): boolean => role === 'admin' || role === 'verified_seller',
  isAdmin: (role: UserRole): boolean => role === 'admin',
} as const;

export const DEFAULT_ROLE: UserRole = 'user';
export const DEFAULT_USER_TYPE: UserType = 'profesional';
export const ADMIN_EMAIL = 'diego.zuni@gmail.com';
