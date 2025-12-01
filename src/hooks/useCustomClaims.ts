// src/hooks/useCustomClaims.ts

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserRole } from '@/types/roles';

interface CustomClaims {
  role: UserRole;
  admin: boolean;
}

export function useCustomClaims(user: User | null) {
  const [claims, setClaims] = useState<CustomClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClaims() {
      if (!user) {
        setClaims(null);
        setLoading(false);
        return;
      }

      try {
        // Forzar refresh del token para obtener claims actualizados
        const tokenResult = await user.getIdTokenResult(true);
        
        const customClaims = tokenResult.claims as CustomClaims;
        
        // Verificar que existan los claims
        if (customClaims && 'role' in customClaims) {
          setClaims(customClaims);
        } else {
          // Si no hay claims, asignar default
          setClaims({ role: 'user', admin: false });
        }
      } catch (error) {
        console.error('Error obteniendo custom claims:', error);
        setClaims({ role: 'user', admin: false });
      } finally {
        setLoading(false);
      }
    }

    fetchClaims();
  }, [user]);

  return { claims, loading };
}

