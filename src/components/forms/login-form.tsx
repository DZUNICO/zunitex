'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/context/auth-context';
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
import { Zap, Eye, EyeOff } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const getFirebaseErrorMessage = (error: FirebaseError) => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No existe una cuenta con este email';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Intenta más tarde';
    case 'auth/invalid-email':
      return 'El email no es válido';
    case 'auth/invalid-credential':
      return 'Credenciales inválidas. Verifica tu email y contraseña';
    default:
      return 'Error al iniciar sesión: ' + error.message;
  }
};

export function LoginForm() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();

  // Nuevo: Manejar redirección cuando el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError('');
      await signIn(data.email, data.password);
    } catch (err) {
      console.error('Error de inicio de sesión:', err);
      if (err instanceof FirebaseError) {
        setError(getFirebaseErrorMessage(err));
      } else {
        setError('Error inesperado durante el inicio de sesión');
      }
    } finally {
      setLoading(false);
    }
  };
  if (user) {
    return null; // O un componente de carga
  }

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
          Bienvenido de nuevo
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Inicia sesión para continuar
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"}
                          className="h-11 pr-10"
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        </span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Link de olvidé mi contraseña */}
              <div className="text-sm">
                <Link 
                  href="/forgot-password"
                  className="text-primary hover:text-primary/90 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </form>
          </Form>
        </div>

        {/* Link de registro */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{' '}
          <Link 
            href="/register"
            className="text-primary hover:text-primary/90 font-medium"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}