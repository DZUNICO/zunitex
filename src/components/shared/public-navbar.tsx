'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Search, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const menuItems = [
  {
    label: 'Blog',
    href: '/blog',
    description: 'Artículos y tutoriales'
  },
  {
    label: 'Comunidad',
    href: '/community',
    description: 'Conecta con otros electricistas'
  },
  {
    label: 'Proveedores',
    href: '/providers',
    description: 'Encuentra proveedores confiables'
  }
];

export function PublicNavbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Búsqueda:', searchQuery);
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl hidden sm:inline-block">
                ElectricianHub
              </span>
            </Link>
          </div>

          {/* Barra de búsqueda - Desktop */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex relative flex-1 max-w-md mx-4"
          >
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-10 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </form>

          {/* Navegación - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Botones de autenticación y menú móvil */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Registrarse</Link>
              </Button>
            </div>

            {/* Menú móvil */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menú</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  {menuItems.map(({ label, href, description }) => (
                    <SheetClose asChild key={href}>
                      <Link
                        href={href}
                        className="flex items-start gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <div>
                          <div className="font-medium">{label}</div>
                          {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                          )}
                        </div>
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="border-t pt-4 mt-2 sm:hidden">
                    <div className="flex flex-col gap-2">
                      <Button asChild>
                        <Link href="/register">Registrarse</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/login">Iniciar Sesión</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda - Móvil */}
      <div className="md:hidden border-t">
        <form onSubmit={handleSearch} className="container px-4 py-2">
          <div className="relative">
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full pl-10 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </form>
      </div>
    </nav>
  );
}