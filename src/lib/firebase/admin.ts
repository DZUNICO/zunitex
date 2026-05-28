// Firebase Admin SDK — solo para uso en API routes (servidor).
// NO importar en componentes client-side ni en 'use client' files.
//
// Inicialización:
//   - En Vercel: requiere FIREBASE_SERVICE_ACCOUNT_JSON (JSON del service account como string)
//   - En local:  si FIREBASE_SERVICE_ACCOUNT_JSON no está definido, usa ADC
//     (configura con: gcloud auth application-default login)

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth }                                  from 'firebase-admin/auth';

let adminApp: App | null = null;

function initAdmin(): void {
  if (getApps().length > 0) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    const credential = cert(JSON.parse(serviceAccountJson) as object);
    adminApp = initializeApp({ credential });
  } else {
    // Application Default Credentials (dev local con gcloud CLI)
    adminApp = initializeApp();
  }
}

/**
 * Verifica que el token Firebase sea válido y que el usuario tenga
 * custom claim `admin: true`. Retorna false ante cualquier error.
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    initAdmin();
    const decoded = await getAuth().verifyIdToken(token, /* checkRevoked */ true);
    return decoded.admin === true;
  } catch {
    return false;
  }
}

/**
 * Igual que verifyAdminToken pero también devuelve el uid del usuario.
 * Retorna null si el token es inválido o el usuario no es admin.
 */
export async function getVerifiedAdmin(
  token: string,
): Promise<{ uid: string; email: string | undefined } | null> {
  try {
    initAdmin();
    const decoded = await getAuth().verifyIdToken(token, /* checkRevoked */ true);
    if (decoded.admin !== true) return null;
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
