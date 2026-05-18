'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/context/auth-context';
import { paso2Schema, CIUDADES, TIPOS_PROVEEDOR } from '@/lib/validations/registro-proveedor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FormValues = z.infer<typeof paso2Schema>;

type PageState = 'loading' | 'form' | 'pendiente' | 'success';

export default function SolicitarProveedorPage() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(paso2Schema),
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (userRole === 'verified_seller' || userRole === 'admin') {
      router.replace('/proveedor');
      return;
    }

    // Check if there's already a solicitud
    getDoc(doc(db, 'solicitudes_proveedor', user.uid)).then((snap) => {
      if (!snap.exists()) {
        setPageState('form');
        return;
      }
      const data = snap.data();
      if (data.estado === 'aprobado') {
        router.replace('/proveedor');
      } else if (data.estado === 'pendiente') {
        setPageState('pendiente');
      } else {
        // rechazado — allow resubmit
        setPageState('form');
      }
    });
  }, [authLoading, user, userRole, router]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, 'solicitudes_proveedor', user.uid), {
        email: user.email,
        nombreEmpresa: values.nombreEmpresa,
        ruc: values.ruc,
        ciudad: values.ciudad,
        telefono: values.telefono,
        web: values.web || null,
        descripcion: values.descripcion,
        tipoProveedor: values.tipoProveedor,
        estado: 'pendiente',
        origen: 'upgrade',
        createdAt: serverTimestamp(),
      });
      setPageState('success');
    } catch {
      toast({
        title: 'Error al enviar la solicitud',
        description: 'Intenta de nuevo en unos momentos.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pageState === 'pendiente') {
    return (
      <div className="container max-w-lg mx-auto px-4 py-20 text-center">
        <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Solicitud en revisión</h1>
        <p className="text-muted-foreground mb-6">
          Ya enviaste tu solicitud para ser proveedor. El equipo de STARLOGIC la está revisando.
          Te notificaremos por email cuando sea aprobada.
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="container max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">¡Solicitud enviada!</h1>
        <p className="text-muted-foreground mb-6">
          Revisaremos tu información y te notificaremos por email. Una vez aprobado,
          cierra sesión y vuelve a entrar para acceder a tu portal de proveedor.
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Conviértete en proveedor</h1>
        <p className="text-muted-foreground mt-1">
          Completa los datos de tu empresa para solicitar acceso como proveedor verificado.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="nombreEmpresa">Nombre de la empresa</Label>
          <Input id="nombreEmpresa" {...register('nombreEmpresa')} placeholder="Electro Distribuciones SAC" />
          {errors.nombreEmpresa && (
            <p className="text-xs text-destructive">{errors.nombreEmpresa.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ruc">RUC</Label>
          <Input id="ruc" {...register('ruc')} placeholder="20123456789" maxLength={11} />
          {errors.ruc && (
            <p className="text-xs text-destructive">{errors.ruc.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Ciudad</Label>
          <Select onValueChange={(v) => setValue('ciudad', v as FormValues['ciudad'])}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una ciudad" />
            </SelectTrigger>
            <SelectContent>
              {CIUDADES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.ciudad && (
            <p className="text-xs text-destructive">{errors.ciudad.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" {...register('telefono')} placeholder="+51 999 999 999" />
          {errors.telefono && (
            <p className="text-xs text-destructive">{errors.telefono.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="web">
            Sitio web <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input id="web" {...register('web')} placeholder="https://miempresa.com" />
          {errors.web && (
            <p className="text-xs text-destructive">{errors.web.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Tipo de proveedor</Label>
          <Select onValueChange={(v) => setValue('tipoProveedor', v as FormValues['tipoProveedor'])}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_PROVEEDOR.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tipoProveedor && (
            <p className="text-xs text-destructive">{errors.tipoProveedor.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="descripcion">
            Descripción
            <span className="text-muted-foreground font-normal ml-1">
              ({watch('descripcion')?.length ?? 0}/200)
            </span>
          </Label>
          <textarea
            id="descripcion"
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Breve descripción de tu empresa, productos que ofreces..."
            {...register('descripcion')}
          />
          {errors.descripcion && (
            <p className="text-xs text-destructive">{errors.descripcion.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Enviar solicitud
        </Button>
      </form>
    </div>
  );
}
