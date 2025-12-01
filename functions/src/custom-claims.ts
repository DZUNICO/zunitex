// functions/src/custom-claims.ts

import * as admin from "firebase-admin";

/**
 * Tipos (duplicados aquí para evitar imports de src/)
 */
type UserRole =
  | "admin"
  | "moderator"
  | "corporate_pro"
  | "verified_seller"
  | "verified_pro"
  | "user";

interface CustomClaims {
  role: UserRole;
  admin: boolean;
}

const ADMIN_EMAIL = "diego.zuni@gmail.com";

/**
 * Sincroniza el role de Firestore al Custom Claim del usuario
 * @param {string} uid - ID del usuario
 * @param {UserRole} role - Role a asignar
 * @return {Promise<void>}
 */
export async function syncCustomClaims(
  uid: string,
  role: UserRole
): Promise<void> {
  try {
    const claims: CustomClaims = {
      role,
      admin: role === "admin",
    };

    await admin.auth().setCustomUserClaims(uid, claims);

    console.log(`Custom claims actualizados para usuario ${uid}`, {role});
  } catch (error) {
    console.error(`Error actualizando custom claims para ${uid}:`, error);
    throw error;
  }
}

/**
 * Obtiene los custom claims actuales del usuario
 * @param {string} uid - ID del usuario
 * @return {Promise<CustomClaims | null>} Custom claims o null
 */
export async function getUserClaims(
  uid: string
): Promise<CustomClaims | null> {
  try {
    const user = await admin.auth().getUser(uid);

    if (user.customClaims && "role" in user.customClaims) {
      return user.customClaims as CustomClaims;
    }

    return null;
  } catch (error) {
    console.error(`Error obteniendo claims para ${uid}:`, error);
    return null;
  }
}

/**
 * Verifica si un email es de admin
 * @param {string | undefined} email - Email a verificar
 * @return {boolean} True si es admin
 */
export function isAdminEmail(email: string | undefined): boolean {
  return email === ADMIN_EMAIL;
}

/**
 * Determina el role inicial basado en el email
 * @param {string} email - Email del usuario
 * @return {UserRole} Role inicial
 */
export function getInitialRole(email: string): UserRole {
  return isAdminEmail(email) ? "admin" : "user";
}

