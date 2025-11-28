import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ EMULADORES DESHABILITADOS - Usando Firestore de producción
// Para volver a usar emuladores, descomentar el bloque de abajo

/*
// Conectar a emuladores en desarrollo local
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Solo conectar una vez
  try {
    // Firestore Emulator (puerto 8080)
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log('✅ Conectado a Firestore Emulator (localhost:8080)');
  } catch (error) {
    // Ignorar si ya está conectado
    if ((error as Error).message?.includes('already been called')) {
      console.log('Firestore emulator ya está conectado');
    } else {
      console.warn('No se pudo conectar a Firestore emulator:', error);
    }
  }
  
  // Auth Emulator (opcional, descomentar si usas Auth)
  // try {
  //   connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  //   console.log('✅ Conectado a Auth Emulator');
  // } catch (error) {
  //   console.log('Auth emulator ya está conectado o no disponible');
  // }
  
  // Storage Emulator (opcional, descomentar si usas Storage)
  // try {
  //   connectStorageEmulator(storage, '127.0.0.1', 9199);
  //   console.log('✅ Conectado a Storage Emulator');
  // } catch (error) {
  //   console.log('Storage emulator ya está conectado o no disponible');
  // }
}
*/

console.log('🔥 Firebase conectado a producción');

export { app, auth, db, storage };