'use client';

import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Zap, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  LayoutDashboard,
  FileText,
  Users,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    href: '/dashboard',
    description: 'Vista general de tu actividad'
  },
  { 
    icon: FileText, 
    label: 'Proyectos', 
    href: '/projects',
    description: 'Gestiona tus proyectos'
  },
  { 
    icon: Users, 
    label: 'Comunidad', 
    href: '/community',
    description: 'Conecta con otros electricistas'
  },
  { 
    icon: BookOpen, 
    label: 'Recursos', 
    href: '/resources',
    description: 'Accede a materiales y guías'
  },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Componente para los items del menú
  const MenuItem = ({ 
    icon: Icon, 
    label, 
    href, 
    description,
    onClick,
    mobile = false
  }: {
    icon: any;
    label: string;
    href: string;
    description?: string;
    onClick?: () => void;
    mobile?: boolean;
  }) => {
    const isActive = pathname === href;
    
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
          mobile ? "hover:bg-accent" : "hover:bg-accent/50",
          isActive && "bg-accent",
          !mobile && "text-sm font-medium"
        )}
      >
        <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
        <div>
          <div className={cn(
            isActive ? "text-foreground" : "text-muted-foreground",
            "font-medium"
          )}>
            {label}
          </div>
          {mobile && description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Logo - siempre visible */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl hidden sm:inline-block">
              ElectricianHub
            </span>
          </Link>

          {/* Navegación principal - escritorio */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <MenuItem key={item.href} {...item} />
            ))}
          </div>

          {/* Controles de usuario */}
          <div className="flex items-center space-x-2">
            {/* Menú de usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Menú de usuario</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menú móvil */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menú principal</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <SheetHeader>
                  <SheetTitle>Menú</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  {menuItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <MenuItem {...item} mobile />
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-red-600 hover:bg-red-100/50 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Cerrar Sesión</div>
                        <p className="text-xs text-muted-foreground">
                          Salir de tu cuenta
                        </p>
                      </div>
                    </button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}