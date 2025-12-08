// src/lib/context/auth-context.tsx

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { DEFAULT_ROLE, DEFAULT_USER_TYPE, UserRole } from '@/types/roles';
import { useCustomClaims } from '@/hooks/useCustomClaims';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Obtener custom claims
  const { claims, loading: claimsLoading } = useCustomClaims(user);

  useEffect(() => {
    // Configurar persistencia
    setPersistence(auth, browserLocalPersistence);

    // Listener de cambios de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Actualizar lastLogin en Firestore (error no-crítico)
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp()
          });
        } catch (error) {
          // Error no-crítico, solo logear warning
          console.warn('No se pudo actualizar lastLogin:', error);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    phone: string
  ) => {
    try {
      // Crear usuario en Authentication
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar perfil
      await updateProfile(result.user, { displayName });

      // Crear documento en Firestore
      // NOTA: onUserCreate Cloud Function también creará esto, pero lo hacemos aquí
      // para asegurar que existe inmediatamente
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email,
        displayName,
        phone,
        role: DEFAULT_ROLE, // 'user'
        userType: DEFAULT_USER_TYPE, // 'general'
        verificationStatus: null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        followersCount: 0,
        followingCount: 0,
        projectsCount: 0
      }, { merge: true });

      // Los custom claims se establecerán automáticamente por onUserCreate
    } catch (error: any) {
      console.error('Error en signUp:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Error en signIn:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('Error en logout:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    if (!user) return;
    
    try {
      // Forzar refresh del token
      await user.getIdToken(true);
      
      // Opcional: llamar a la Cloud Function para asegurar sincronización
      // const functions = getFunctions();
      // const refreshFn = httpsCallable(functions, 'refreshUserToken');
      // await refreshFn();
    } catch (error) {
      console.error('Error refrescando token:', error);
    }
  };

  const value = {
    user,
    userRole: claims?.role || null,
    isAdmin: claims?.admin || false,
    loading: loading || claimsLoading,
    signUp,
    signIn,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
