'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tiempo de caché: 5 minutos
            staleTime: 1000 * 60 * 5,
            // Tiempo de caché en memoria: 10 minutos
            gcTime: 1000 * 60 * 10,
            // Reintentar 3 veces en caso de error
            retry: 3,
            // Tiempo entre reintentos: 1 segundo
            retryDelay: 1000,
            // Refetch cuando la ventana recupera el foco
            refetchOnWindowFocus: false,
            // No refetch al reconectar
            refetchOnReconnect: true,
          },
          mutations: {
            // Reintentar 1 vez en mutaciones
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

