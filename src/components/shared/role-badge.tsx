// src/components/shared/role-badge.tsx

'use client';

import { UserRole, UserType } from '@/types/roles';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ShieldCheck, 
  Briefcase, 
  Store, 
  Building2, 
  Factory,
  ShoppingCart,
  GraduationCap,
  User as UserIcon
} from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

interface UserTypeBadgeProps {
  userType: UserType;
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

export function UserTypeBadge({ userType, className }: UserTypeBadgeProps) {
  const config = {
    electrician: { label: '⚡ Electricista', variant: 'default' as const },
    corporate_pro: { label: '👔 Profesional Corporativo', variant: 'secondary' as const },
    retailer: { label: '🏪 Minorista', variant: 'default' as const },
    distributor: { label: '📦 Distribuidor', variant: 'default' as const },
    manufacturer: { label: '🏭 Fabricante', variant: 'default' as const },
    buyer: { label: '🛒 Comprador', variant: 'default' as const },
    student: { label: '🎓 Estudiante', variant: 'outline' as const },
    general: { label: '👤 Usuario General', variant: 'outline' as const }
  };

  const { label, variant } = config[userType];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}








