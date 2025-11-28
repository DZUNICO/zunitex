'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Capturar errores de queries automáticamente
        queryCache: new QueryCache({
          onError: (error) => {
            Sentry.captureException(error, {
              tags: { type: 'query_error' },
              level: 'error',
            });
          },
        }),
        // Capturar errores de mutations automáticamente
        mutationCache: new MutationCache({
          onError: (error) => {
            Sentry.captureException(error, {
              tags: { type: 'mutation_error' },
              level: 'error',
            });
          },
        }),
        defaultOptions: {
          queries: {
            // Configuración por defecto para queries
            staleTime: 5 * 60 * 1000, // 5 minutos - datos relativamente estáticos
            gcTime: 10 * 60 * 1000, // 10 minutos en caché (antes cacheTime)
            // Reintentar 3 veces en caso de error
            retry: 3,
            // Tiempo entre reintentos: exponencial backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // NO refetch cuando la ventana recupera el foco (datos estáticos)
            refetchOnWindowFocus: false,
            // Refetch al reconectar (importante para datos que pueden cambiar)
            refetchOnReconnect: true,
            // NO refetch al montar si los datos están frescos
            refetchOnMount: true,
          },
          mutations: {
            // Reintentar 1 vez en mutaciones (operaciones de escritura)
            retry: 1,
            // Tiempo entre reintentos en mutaciones
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

