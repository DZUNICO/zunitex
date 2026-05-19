// functions/src/callable/aprobarProveedor.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

interface AprobarData {
  uid: string;
  email: string;
  nombreEmpresa: string;
  slug: string;
  ciudad: string;
  descripcion: string;
  tipoProveedor: string;
  ruc: string;
  telefono: string;
  web?: string | null;
}

const SUPABASE_URL = process.env.SUPABASE_CATALOGO_URL ?? "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_CATALOGO_SERVICE_KEY ?? "";

// eslint-disable-next-line max-len
export const aprobarProveedor = functions.https.onCall(async (data, context) => {
  // Solo admins pueden aprobar
  if (context.auth?.token?.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo administradores pueden aprobar proveedores"
    );
  }

  const typedData = data as AprobarData;

  if (!typedData.uid || !typedData.slug || !typedData.nombreEmpresa) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Faltan campos requeridos: uid, slug, nombreEmpresa"
    );
  }

  // 1. Verificar unicidad del slug en Supabase
  const checkUrl =
    `${SUPABASE_URL}/rest/v1/proveedores` +
    `?slug=eq.${encodeURIComponent(typedData.slug)}&select=id`;
  const checkRes = await fetch(checkUrl, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!checkRes.ok) {
    throw new functions.https.HttpsError(
      "internal",
      "Error al verificar slug en Supabase"
    );
  }

  const existing = await checkRes.json() as {id: string}[];
  if (existing.length > 0) {
    throw new functions.https.HttpsError(
      "already-exists",
      `El slug '${typedData.slug}' ya está en uso. Elige otro.`
    );
  }

  // 2. Asignar custom claim verified_seller
  await admin.auth().setCustomUserClaims(typedData.uid, {
    role: "verified_seller",
    admin: false,
  });

  // 3. Actualizar users/{uid} en Firestore
  await admin.firestore().doc(`users/${typedData.uid}`).update({
    role: "verified_seller",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 4. Actualizar solicitudes_proveedor/{uid} a aprobado
  await admin
    .firestore()
    .doc(`solicitudes_proveedor/${typedData.uid}`)
    .update({
      estado: "aprobado",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  // 5. Insertar proveedor en Supabase
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/proveedores`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      nombre: typedData.nombreEmpresa,
      slug: typedData.slug,
      firebase_uid: typedData.uid,
      email: typedData.email,
      ciudad: typedData.ciudad,
      descripcion: typedData.descripcion,
      telefono: typedData.telefono,
      web: typedData.web ?? null,
    }),
  });

  if (!insertRes.ok) {
    const errorText = await insertRes.text();
    console.error("Error insertando proveedor en Supabase:", errorText);
    throw new functions.https.HttpsError(
      "internal",
      "Error al crear proveedor. Claims y Firestore ya actualizados."
    );
  }

  // eslint-disable-next-line max-len
  console.log(`Proveedor aprobado: ${typedData.uid} (${typedData.nombreEmpresa})`);

  return {success: true};
});
