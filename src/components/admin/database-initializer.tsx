'use client';

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";
import { initializeDatabase, seedDatabase } from "@/lib/firebase/init-db";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DatabaseInitializer() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { user } = useAuth();

  const handleInitialize = async () => {
    try {
      setLoading(true);
      setStatus('idle');
      setErrorMessage('');
      
      // Inicializar estructura de la base de datos
      await initializeDatabase();
      
      // Crear datos de ejemplo si hay un usuario autenticado
      if (user?.uid) {
        await seedDatabase(user.uid);
      }
      
      setStatus('success');
    } catch (error: any) {
      console.error('Error:', error);
      setStatus('error');
      setErrorMessage(
        error.code === 'permission-denied' 
          ? 'Error de permisos. Verifica las reglas de Firestore en la consola de Firebase.'
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicialización de Base de Datos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Este proceso creará la estructura inicial de la base de datos y agregará algunos datos de ejemplo.
          Use esto solo en desarrollo o cuando configure una nueva instancia.
        </div>
        
        {status === 'success' && (
          <Alert className="bg-green-50 text-green-900">
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>
              Base de datos inicializada correctamente.
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert className="bg-red-50 text-red-900">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorMessage || 'Error al inicializar la base de datos. Revisa la consola para más detalles.'}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleInitialize} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Inicializando...' : 'Inicializar Base de Datos'}
        </Button>
      </CardContent>
    </Card>
  );
}