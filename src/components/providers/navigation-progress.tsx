'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader } from '@/components/ui/loader';

function NavigationProgressContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cuando inicia la navegación
    setIsNavigating(true);

    // Limpiar timeout anterior si existe
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Configurar un nuevo timeout
    const newTimeoutId = setTimeout(() => {
      setIsNavigating(false);
    }, 500); // Ajusta este valor según necesites

    setTimeoutId(newTimeoutId);

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pathname, searchParams]); // Se ejecuta cuando cambia la ruta o los parámetros

  return isNavigating ? <Loader /> : null;
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressContent />
    </Suspense>
  );
}