// functions/src/callable/refresh-token.ts

import * as functions from "firebase-functions";
import {getUserClaims} from "../custom-claims.js";

/**
 * Función callable: Permite al usuario refrescar su token
 * para obtener los custom claims actualizados
 */
export const refreshUserToken = functions.https.onCall(async (request) => {
  try {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuario no autenticado"
      );
    }

    // Obtener claims actuales
    const claims = await getUserClaims(uid);

    console.log(`Token refrescado para usuario ${uid}`, {claims});

    return {
      success: true,
      claims,
      message: "Token actualizado. Por favor, recarga la página.",
    };
  } catch (error) {
    console.error("Error en refreshUserToken:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al refrescar token"
    );
  }
});

