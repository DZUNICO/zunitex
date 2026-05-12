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

  async function fetchClaims(currentUser: User) {
    try {
      const tokenResult = await currentUser.getIdTokenResult(true);
      setClaims({
        role: (tokenResult.claims.role as UserRole) || 'user',
        admin: tokenResult.claims.admin === true,
      });
    } catch (error) {
      console.error('Error obteniendo custom claims:', error);
      setClaims({ role: 'user', admin: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setClaims(null);
      setLoading(false);
      return;
    }
    fetchClaims(user);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetchClaims = async () => {
    if (!user) return;
    await fetchClaims(user);
  };

  return { claims, loading, refetchClaims };
}





