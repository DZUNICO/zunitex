// src/components/shared/role-badge.tsx

'use client';

import { UserRole, ADMIN_EMAIL } from '@/types/roles';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Shield, ShieldCheck } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

interface UserTypeBadgeProps {
  userType: string;
  email?: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (role === 'admin') {
    return (
      <Badge className={cn('bg-black text-white hover:bg-black/90', className)}>
        <Shield className="mr-1 h-3 w-3" />
        Admin
      </Badge>
    );
  }
  if (role === 'verified_seller') {
    return (
      <Badge className={cn('bg-blue-600 text-white hover:bg-blue-700', className)}>
        <ShieldCheck className="mr-1 h-3 w-3" />
        Proveedor Verificado
      </Badge>
    );
  }
  return null;
}

export function UserTypeBadge({ userType, email, className }: UserTypeBadgeProps) {
  if (email === ADMIN_EMAIL) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-amber-400/70 bg-amber-50/60 text-amber-700 tracking-widest text-[10px] font-semibold',
          'dark:border-amber-500/40 dark:bg-amber-950/20 dark:text-amber-400',
          className
        )}
      >
        FUNDADOR
      </Badge>
    );
  }

  if (userType === 'proveedor') {
    return (
      <Badge className={cn('bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300', className)}>
        🏪 Proveedor
      </Badge>
    );
  }

  if (userType === 'profesional') {
    return (
      <Badge variant="secondary" className={cn(className)}>
        👷 Profesional
      </Badge>
    );
  }

  return null;
}
