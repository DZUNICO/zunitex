'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, app } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Clock, Building2, Phone, Globe, MapPin, FileText } from 'lucide-react';
import { CIUDADES, TIPOS_PROVEEDOR } from '@/lib/validations/registro-proveedor';

interface Solicitud {
  uid: string;
  email: string;
  nombreEmpresa: string;
  ruc: string;
  ciudad: string;
  telefono: string;
  web?: string | null;
  descripcion: string;
  tipoProveedor: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  motivoRechazo?: string;
  origen?: string;
  createdAt: { seconds: number } | null;
}

interface AprobarPayload {
  uid: string;
  email: string;
  nombreEmpresa: string;
  slug: string;
  ciudad: string;
  descripcion: string;
  tipoProveedor: string;
  ruc: string;
  telefono: string;
  web?: string | null;
}

function formatDate(ts: { seconds: number } | null) {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function SolicitudCard({
  s,
  onAprobar,
  onRechazar,
}: {
  s: Solicitud;
  onAprobar?: (s: Solicitud) => void;
  onRechazar?: (s: Solicitud) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{s.nombreEmpresa}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{s.email}</p>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(s.createdAt)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span>RUC {s.ruc}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{s.ciudad}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{s.telefono}</span>
          </div>
          {s.web && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{s.web.replace(/^https?:\/\//, '')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Badge variant="secondary" className="text-xs">{s.tipoProveedor}</Badge>
          {s.origen === 'upgrade' && (
            <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
              Upgrade
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{s.descripcion}</p>

        {s.estado === 'pendiente' && onAprobar && onRechazar && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={() => onAprobar(s)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Aprobar
            </Button>
            <Button size="sm" variant="destructive" className="flex-1" onClick={() => onRechazar(s)}>
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Rechazar
            </Button>
          </div>
        )}

        {s.estado === 'rechazado' && s.motivoRechazo && (
          <p className="text-xs text-destructive mt-1">
            <span className="font-medium">Motivo:</span> {s.motivoRechazo}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminProveedoresPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Dialog Aprobar
  const [aprobarTarget, setAprobarTarget] = useState<Solicitud | null>(null);
  const [aprobarForm, setAprobarForm] = useState({
    nombreEmpresa: '',
    slug: '',
    ciudad: '',
    descripcion: '',
    tipoProveedor: '',
  });
  const [aprobando, setAprobando] = useState(false);

  // Dialog Rechazar
  const [rechazarTarget, setRechazarTarget] = useState<Solicitud | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [rechazando, setRechazando] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'solicitudes_proveedor'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setSolicitudes(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as Solicitud)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente');
  const aprobados = solicitudes.filter((s) => s.estado === 'aprobado');
  const rechazados = solicitudes.filter((s) => s.estado === 'rechazado');

  const openAprobar = (s: Solicitud) => {
    setAprobarTarget(s);
    setAprobarForm({
      nombreEmpresa: s.nombreEmpresa,
      slug: slugify(s.nombreEmpresa),
      ciudad: s.ciudad,
      descripcion: s.descripcion,
      tipoProveedor: s.tipoProveedor,
    });
  };

  const handleAprobar = async () => {
    if (!aprobarTarget) return;
    setAprobando(true);
    try {
      const fns = getFunctions(app, 'us-central1');
      const aprobarFn = httpsCallable<AprobarPayload, { success: boolean }>(fns, 'aprobarProveedor');
      await aprobarFn({
        uid: aprobarTarget.uid,
        email: aprobarTarget.email,
        nombreEmpresa: aprobarForm.nombreEmpresa,
        slug: aprobarForm.slug,
        ciudad: aprobarForm.ciudad,
        descripcion: aprobarForm.descripcion,
        tipoProveedor: aprobarForm.tipoProveedor,
        ruc: aprobarTarget.ruc,
        telefono: aprobarTarget.telefono,
        web: aprobarTarget.web,
      });
      // El proveedor debe refrescar su JWT para que los nuevos claims (verified_seller)
      // sean visibles — esto ocurre al cerrar sesión y volver a entrar.
      toast({
        title: 'Proveedor aprobado',
        description: `${aprobarForm.nombreEmpresa} aprobado. El proveedor debe cerrar sesión y volver a entrar para ver su portal.`,
      });
      setAprobarTarget(null);
    } catch (err: unknown) {
      toast({
        title: 'Error al aprobar',
        description: (err as Error).message ?? 'Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setAprobando(false);
    }
  };

  const handleRechazar = async () => {
    if (!rechazarTarget) return;
    setRechazando(true);
    try {
      await updateDoc(doc(db, 'solicitudes_proveedor', rechazarTarget.uid), {
        estado: 'rechazado',
        motivoRechazo: motivoRechazo.trim() || null,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Solicitud rechazada' });
      setRechazarTarget(null);
      setMotivoRechazo('');
    } catch {
      toast({ title: 'Error al rechazar', variant: 'destructive' });
    } finally {
      setRechazando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Solicitudes de Proveedores</h1>
          <p className="text-sm text-muted-foreground">Gestiona el acceso verificado de proveedores</p>
        </div>
      </div>

      <Tabs defaultValue="pendientes">
        <TabsList>
          <TabsTrigger value="pendientes" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pendientes
            {pendientes.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">
                {pendientes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="aprobados" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Aprobados
            {aprobados.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                {aprobados.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rechazados" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Rechazados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="mt-4">
          {pendientes.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No hay solicitudes pendientes</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {pendientes.map((s) => (
                <SolicitudCard
                  key={s.uid}
                  s={s}
                  onAprobar={openAprobar}
                  onRechazar={(s) => { setRechazarTarget(s); setMotivoRechazo(''); }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="aprobados" className="mt-4">
          {aprobados.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Ningún proveedor aprobado aún</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {aprobados.map((s) => <SolicitudCard key={s.uid} s={s} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rechazados" className="mt-4">
          {rechazados.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Ninguna solicitud rechazada</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {rechazados.map((s) => <SolicitudCard key={s.uid} s={s} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Aprobar */}
      <Dialog open={!!aprobarTarget} onOpenChange={(o) => !o && setAprobarTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprobar proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Nombre empresa</label>
              <Input
                value={aprobarForm.nombreEmpresa}
                onChange={(e) => setAprobarForm((f) => ({ ...f, nombreEmpresa: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slug (URL pública)</label>
              <Input
                value={aprobarForm.slug}
                onChange={(e) => setAprobarForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="electro-distribuciones-sac"
              />
              <p className="text-xs text-muted-foreground mt-1">/proveedores/{aprobarForm.slug}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ciudad</label>
              <Select
                value={aprobarForm.ciudad}
                onValueChange={(v) => setAprobarForm((f) => ({ ...f, ciudad: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CIUDADES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              <Select
                value={aprobarForm.tipoProveedor}
                onValueChange={(v) => setAprobarForm((f) => ({ ...f, tipoProveedor: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PROVEEDOR.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descripción</label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={aprobarForm.descripcion}
                onChange={(e) => setAprobarForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAprobarTarget(null)}>Cancelar</Button>
            <Button onClick={handleAprobar} disabled={aprobando || !aprobarForm.slug}>
              {aprobando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar aprobación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rechazar */}
      <Dialog open={!!rechazarTarget} onOpenChange={(o) => !o && setRechazarTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de rechazar a <strong>{rechazarTarget?.nombreEmpresa}</strong>?
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Motivo <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Información incompleta, RUC inválido..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechazarTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRechazar} disabled={rechazando}>
              {rechazando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Rechazar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
