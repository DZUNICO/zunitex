'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              await setDoc(doc(db, 'users', user.uid), {
                lastLogin: new Date().toISOString()
              }, { merge: true });
              setUser(user);
            } catch (error) {
              logger.error('Error updating last login', error as Error, { userId: user.uid });
            }
          } else {
            setUser(null);
          }
          setLoading(false);
          setAuthInitialized(true);
        });

        return () => unsubscribe();
      } catch (error) {
        logger.error('Error initializing auth', error as Error);
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Mantener el resto de tus funciones exactamente igual
  const signUp = async (email: string, password: string, displayName: string, phone: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName,
        phone,
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        projectsCount: 0,
        rating: 0,
        specialties: [],
        photoURL: null,
        active: true
      });
    } catch (error) {
      logger.error('Error en registro', error as Error, { email });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      logger.error('Error en inicio de sesión', error as Error, { email });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      logger.error('Error en cierre de sesión', error as Error);
      throw error;
    }
  };

  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };