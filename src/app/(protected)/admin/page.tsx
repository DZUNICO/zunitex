'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { FileText, Building2, Settings, DatabaseZap, BarChart2, Package } from 'lucide-react';

interface QuickLink {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  badge?: number | null;
}

function QuickLinkCard({ icon: Icon, title, description, href, badge }: QuickLink) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Icon className="h-5 w-5 text-primary mt-0.5" />
            {badge != null && badge > 0 && (
              <Badge variant="destructive" className="text-xs">{badge}</Badge>
            )}
          </div>
          <CardTitle className="text-base mt-2">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [pendingCount,         setPendingCount]         = useState<number | null>(null);
  const [pipelinePendingCount, setPipelinePendingCount] = useState<number | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'solicitudes_proveedor'),
      where('estado', '==', 'pendiente')
    );
    getCountFromServer(q)
      .then((snap) => setPendingCount(snap.data().count))
      .catch(() => setPendingCount(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch('/api/pipeline/candidates?status=pending', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d: { candidatos?: { id: string }[] }) =>
          setPipelinePendingCount(d.candidatos?.length ?? 0)
        )
        .catch(() => setPipelinePendingCount(null))
    );
  }, [user]);

  const links: QuickLink[] = [
    {
      icon: DatabaseZap,
      title: 'Pipeline de Datos',
      description: 'Extracción e ingesta de fichas técnicas con IA',
      href: '/admin/pipeline',
      badge: pipelinePendingCount,
    },
    {
      icon: Package,
      title: 'Catálogo',
      description: 'Gestionar productos_catalogo — activar, precios, filtros',
      href: '/admin/catalogo',
    },
    {
      icon: BarChart2,
      title: 'Keywords SEO',
      description: 'Keywords de Google Keyword Planner por tipo de cable',
      href: '/admin/pipeline/keywords',
    },
    {
      icon: FileText,
      title: 'Blog',
      description: 'Crear y gestionar artículos del blog',
      href: '/admin/blog',
    },
    {
      icon: Building2,
      title: 'Solicitudes de Proveedores',
      description: 'Aprobar o rechazar solicitudes pendientes',
      href: '/admin/proveedores',
      badge: pendingCount,
    },
    {
      icon: Settings,
      title: 'Sistema',
      description: 'Herramientas y configuraciones administrativas',
      href: '/admin/sistema',
    },
  ];

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">Gestión y herramientas de STARLOGIC</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {links.map((link) => (
          <QuickLinkCard key={link.href} {...link} />
        ))}
      </div>
    </div>
  );
}
