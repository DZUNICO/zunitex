// src/hooks/useRolePermissions.ts

import { useAuth } from '@/lib/context/auth-context';

export function useRolePermissions() {
  const { userRole } = useAuth();

  return {
    isAdmin:            userRole === 'admin',
    isVerifiedSeller:   userRole === 'verified_seller',
    isUser:             userRole === 'user',
    canCreateBlogPosts: userRole === 'admin',
    canDeleteOthers:    userRole === 'admin',
    canModerate:        userRole === 'admin',
    canOfferProducts:   userRole === 'verified_seller' || userRole === 'admin',
    canViewCatalog:     true,
  };
}
