// src/hooks/useRolePermissions.ts

import { useAuth } from '@/lib/context/auth-context';
import { RolePermissions } from '@/types/roles';

export function useRolePermissions() {
  const { userRole, isAdmin } = useAuth();

  if (!userRole) {
    return {
      canCreateBlogPosts: false,
      canDeleteOthersBlogPosts: false,
      canDeleteOthersCommunityPosts: false,
      canPublishResources: false,
      canDeleteOthersResources: false,
      canDeleteUsers: false,
      canAssignRoles: false,
      canGiveTraining: false,
      isAdmin: false,
      isModerator: false
    };
  }

  return {
    canCreateBlogPosts: RolePermissions.canCreateBlogPosts(userRole),
    canDeleteOthersBlogPosts: RolePermissions.canDeleteOthersBlogPosts(userRole),
    canDeleteOthersCommunityPosts: RolePermissions.canDeleteOthersCommunityPosts(userRole),
    canPublishResources: RolePermissions.canPublishResources(userRole),
    canDeleteOthersResources: RolePermissions.canDeleteOthersResources(userRole),
    canDeleteUsers: RolePermissions.canDeleteUsers(userRole),
    canAssignRoles: RolePermissions.canAssignRoles(userRole),
    canGiveTraining: RolePermissions.canGiveTraining(userRole),
    isAdmin,
    isModerator: RolePermissions.isModerator(userRole)
  };
}

