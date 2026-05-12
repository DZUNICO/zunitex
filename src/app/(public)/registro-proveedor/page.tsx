'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase/config';
import {
  registroProveedorSchema,
  type RegistroProveedorInput,
  CIUDADES,
  TIPOS_PROVEEDOR,
  PASO1_FIELDS,
} from '@/lib/validations/registro-proveedor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Zap, Loader2, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              step < current
                ? 'bg-green-500 text-white'
                : step === current
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {step < current ? <CheckCircle className="h-4 w-4" /> : step}
          </div>
          <span
            className={`text-sm hidden sm:inline ${
              step === current ? 'font-medium text-foreground' : 'text-muted-foreground'
            }`}
          >
            {step === 1 ? 'Cuenta' : 'Empresa'}
          </span>
          {step < 2 && <div className="w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

export default function RegistroProveedorPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegistroProveedorInput>({
    resolver: zodResolver(registroProveedorSchema),
    mode: 'onTouched',
  });

  const descripcion = watch('descripcion') ?? '';

  const handleNext = async () => {
    const valid = await trigger([...PASO1_FIELDS]);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: RegistroProveedorInput) => {
    setSubmitting(true);
    let userCredential = null;
    try {
      // Paso 1: crear cuenta Auth
      userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const { uid } = userCredential.user;

      await updateProfile(userCredential.user, { displayName: data.nombreEmpresa });

      // Paso 2: crear documento users/{uid}
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: data.email,
        displayName: data.nombreEmpresa,
        phone: data.telefono,
        role: 'user',
        userType: 'proveedor',
        active: true,
        verificationStatus: null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        followersCount: 0,
        followingCount: 0,
        projectsCount: 0,
        rating: 0,
        reviewsCount: 0,
        resourcesCount: 0,
      }, { merge: true });

      // Paso 3: crear solicitud
      await setDoc(doc(db, 'solicitudes_proveedor', uid), {
        uid,
        email: data.email,
        nombreEmpresa: data.nombreEmpresa,
        ruc: data.ruc,
        ciudad: data.ciudad,
        telefono: data.telefono,
        web: data.web || null,
        descripcion: data.descripcion,
        tipoProveedor: data.tipoProveedor,
        estado: 'pendiente',
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
    } catch (err: unknown) {
      // Rollback: si Auth se creó pero algo falló después, revertir
      if (userCredential?.user) {
        try {
          await deleteDoc(doc(db, 'users', userCredential.user.uid)).catch(() => {});
          await userCredential.user.delete();
        } catch {
          // rollback silencioso
        }
      }

      const code = (err as { code?: string }).code;
      const message =
        code === 'auth/email-already-in-use'
          ? 'Este email ya tiene una cuenta registrada.'
          : code === 'auth/weak-password'
          ? 'La contraseña es demasiado débil.'
          : 'Error al enviar la solicitud. Intenta de nuevo.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 px-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">¡Solicitud enviada!</h1>
            <p className="text-muted-foreground mb-6">
              Te contactaremos en <strong>24-48 horas</strong> para verificar tu cuenta y
              activar tu acceso al catálogo.
            </p>
            <Button asChild className="w-full">
              <Link href="/catalogo">Explorar catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Zap className="h-7 w-7 text-primary" />
          <span className="font-bold text-2xl">STARLOGIC</span>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Registro de proveedor</CardTitle>
            <CardDescription className="text-center">
              {step === 1
                ? 'Crea tu cuenta de acceso'
                : 'Información de tu empresa'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <StepIndicator current={step} />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* ── PASO 1 ── */}
              {step === 1 && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="tu@empresa.com"
                      {...register('email')}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Contraseña <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      {...register('password')}
                      aria-invalid={!!errors.password}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Confirmar contraseña <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Repite tu contraseña"
                      {...register('confirmPassword')}
                      aria-invalid={!!errors.confirmPassword}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button type="button" className="w-full" onClick={handleNext}>
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              )}

              {/* ── PASO 2 ── */}
              {step === 2 && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Nombre de empresa <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Electro Distribuciones SAC"
                      {...register('nombreEmpresa')}
                      aria-invalid={!!errors.nombreEmpresa}
                    />
                    {errors.nombreEmpresa && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.nombreEmpresa.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      RUC <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="20123456789"
                      maxLength={11}
                      {...register('ruc')}
                      aria-invalid={!!errors.ruc}
                    />
                    {errors.ruc && (
                      <p className="text-xs text-destructive mt-1">{errors.ruc.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Ciudad <span className="text-destructive">*</span>
                      </label>
                      <Select onValueChange={(val) => setValue('ciudad', val as typeof CIUDADES[number])}>
                        <SelectTrigger aria-invalid={!!errors.ciudad}>
                          <SelectValue placeholder="Ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                          {CIUDADES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.ciudad && (
                        <p className="text-xs text-destructive mt-1">{errors.ciudad.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Tipo <span className="text-destructive">*</span>
                      </label>
                      <Select onValueChange={(val) => setValue('tipoProveedor', val as typeof TIPOS_PROVEEDOR[number])}>
                        <SelectTrigger aria-invalid={!!errors.tipoProveedor}>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PROVEEDOR.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.tipoProveedor && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.tipoProveedor.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Teléfono / WhatsApp <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="+51 999 999 999"
                      {...register('telefono')}
                      aria-invalid={!!errors.telefono}
                    />
                    {errors.telefono && (
                      <p className="text-xs text-destructive mt-1">{errors.telefono.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Sitio web{' '}
                      <span className="text-muted-foreground font-normal">opcional</span>
                    </label>
                    <Input
                      placeholder="https://tuempresa.com"
                      {...register('web')}
                      aria-invalid={!!errors.web}
                    />
                    {errors.web && (
                      <p className="text-xs text-destructive mt-1">{errors.web.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Descripción breve <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Qué productos manejan, marcas, especialidad..."
                      maxLength={200}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      {...register('descripcion')}
                      aria-invalid={!!errors.descripcion}
                    />
                    <div className="flex justify-between mt-1">
                      {errors.descripcion ? (
                        <p className="text-xs text-destructive">{errors.descripcion.message}</p>
                      ) : (
                        <span />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {descripcion.length}/200
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Volver
                    </Button>
                    <Button type="submit" className="flex-1" disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Enviar solicitud
                    </Button>
                  </div>
                </>
              )}
            </form>

            {step === 1 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Iniciar sesión
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
