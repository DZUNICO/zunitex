'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // Asegúrate de tener la ruta correcta

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await sendPasswordResetEmail(auth, data.email);
      
      setSuccess('Se ha enviado un enlace de recuperación a tu correo electrónico');
      // Opcional: redirigir después de un tiempo
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('Error al enviar email de recuperación:', err);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('No existe una cuenta con este email');
            break;
          case 'auth/invalid-email':
            setError('El email no es válido');
            break;
          case 'auth/too-many-requests':
            setError('Demasiados intentos. Intenta más tarde');
            break;
          default:
            setError('Error al enviar el email de recuperación');
        }
      } else {
        setError('Error inesperado al enviar el email de recuperación');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-3 rounded-full">
            <Zap className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <h2 className="text-center text-2xl font-bold tracking-tight mb-2">
          Recuperar contraseña
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Te enviaremos un enlace para restablecer tu contraseña
        </p>

        {/* Card del formulario */}
        <div className="bg-card rounded-lg shadow-sm border p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="tu@email.com"
                        className="h-11"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                  {success}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Button>

              <div className="text-center text-sm">
                <Link 
                  href="/login"
                  className="text-primary hover:text-primary/90 font-medium"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}