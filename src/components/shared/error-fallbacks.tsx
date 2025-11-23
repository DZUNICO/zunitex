'use client';

import { AlertCircle, RefreshCw, Home, Upload, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

/**
 * Fallback para errores globales de la aplicación
 */
export function GlobalErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-2xl w-full">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-20 w-20 text-destructive" />
          <h1 className="text-3xl font-bold">Error Crítico</h1>
          <p className="text-muted-foreground text-lg">
            La aplicación encontró un error inesperado. Por favor, intenta recargar la página.
          </p>
          <div className="flex gap-4 mt-6 flex-wrap justify-center">
            <Button 
              onClick={() => {
                onReset();
                window.location.reload();
              }} 
              variant="default"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recargar aplicación
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg">
                <Home className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Fallback para errores en componentes de upload
 */
export function UploadErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <Alert variant="destructive" className="my-4">
      <Upload className="h-4 w-4" />
      <AlertTitle>Error al subir archivo</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">
          No se pudo subir el archivo. Verifica tu conexión a internet e intenta de nuevo.
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={onReset} 
            variant="outline" 
            size="sm"
            className="bg-background"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Reintentar
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Fallback para errores en el feed de comunidad
 */
export function FeedErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <Card className="p-6 my-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <WifiOff className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Error al cargar el feed</h2>
        <p className="text-muted-foreground">
          No se pudieron cargar los posts de la comunidad. Verifica tu conexión e intenta de nuevo.
        </p>
        <div className="flex gap-4 mt-4">
          <Button onClick={onReset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

