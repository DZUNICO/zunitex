import {FieldValue} from "firebase-admin/firestore";
import {db} from "../config.js";

/**
 * Incrementar contador de forma segura y atómica
 * @param {string} documentPath - Ruta del documento
 *   (ej: "community-posts/postId")
 * @param {string} fieldName - Campo a incrementar (ej: "likes")
 * @param {number} amount - Cantidad a incrementar (default: 1)
 */
export async function incrementCounter(
  documentPath: string,
  fieldName: string,
  amount: number = 1
): Promise<void> {
  try {
    await db.doc(documentPath).update({
      [fieldName]: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error incrementing ${fieldName} on ${documentPath}:`, error);
    throw error;
  }
}

/**
 * Verificar si documento existe
 * @param {string} documentPath - Ruta del documento
 * @return {Promise<boolean>} True si el documento existe
 */
export async function documentExists(documentPath: string): Promise<boolean> {
  try {
    const doc = await db.doc(documentPath).get();
    return doc.exists;
  } catch (error) {
    console.error(`Error checking existence of ${documentPath}:`, error);
    return false;
  }
}

/**
 * Obtener datos de documento
 * @param {string} documentPath - Ruta del documento
 * @return {Promise<unknown>} Datos del documento o null
 */
export async function getDocument(
  documentPath: string
): Promise<unknown | null> {
  try {
    const doc = await db.doc(documentPath).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error(`Error getting document ${documentPath}:`, error);
    throw error;
  }
}

/**
 * Validar que usuario y documento existen antes de operación
 * @param {string} userId - ID del usuario
 * @param {string} documentPath - Ruta del documento
 * @return {Promise<boolean>} True si ambos existen
 */
export async function validateEntities(
  userId: string,
  documentPath: string
): Promise<boolean> {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    const targetDoc = await db.doc(documentPath).get();

    return userDoc.exists && targetDoc.exists;
  } catch (error) {
    console.error("Error validating entities:", error);
    return false;
  }
}


