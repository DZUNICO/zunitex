// src/components/shared/role-badge.tsx

'use client';

import { UserRole, ADMIN_EMAIL } from '@/types/roles';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Shield,
  ShieldCheck,
  Briefcase,
  User as UserIcon
} from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

interface UserTypeBadgeProps {
  userType: string; // string para aceptar valores legacy de Firestore sin romper
  email?: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = {
    admin: { 
      label: 'Admin', 
      icon: Shield, 
      variant: 'destructive' as const 
    },
    moderator: { 
      label: 'Moderador', 
      icon: ShieldCheck, 
      variant: 'default' as const 
    },
    corporate_pro: { 
      label: 'Profesional Corporativo', 
      icon: Briefcase, 
      variant: 'secondary' as const 
    },
    verified_seller: { 
      label: 'Vendedor Verificado', 
      icon: ShieldCheck, 
      variant: 'default' as const 
    },
    verified_pro: { 
      label: 'Profesional Verificado', 
      icon: ShieldCheck, 
      variant: 'default' as const 
    },
    user: { 
      label: 'Usuario', 
      icon: UserIcon, 
      variant: 'outline' as const 
    }
  };

  const { label, icon: Icon, variant } = config[role];

  return (
    <Badge variant={variant} className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
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

  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    profesional: { label: '👷 Profesional', variant: 'default' },
    proveedor:   { label: '🏪 Proveedor',   variant: 'secondary' },
  };

  // Fallback graceful para valores legacy (electrician, general, etc.)
  const { label, variant } = config[userType] ?? { label: '👷 Profesional', variant: 'default' as const };

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}








