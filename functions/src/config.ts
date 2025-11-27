import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

// Inicializar Admin SDK
if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
export const auth = getAuth();

// Helpers para logging
export const logFunction = (
  functionName: string,
  action: string,
  data?: unknown
) => {
  console.log(`[${functionName}] ${action}`, data || "");
};

export const logError = (functionName: string, error: Error) => {
  console.error(`[${functionName}] ERROR:`, error.message);
};


