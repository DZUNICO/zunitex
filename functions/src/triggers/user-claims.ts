// functions/src/triggers/user-claims.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {syncCustomClaims, getInitialRole} from "../custom-claims.js";

/**
 * Trigger: Cuando se crea un nuevo usuario en Authentication
 * Establece el role inicial y sincroniza a Custom Claims
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const {uid, email, displayName} = user;

    if (!email) {
      console.warn(`Usuario ${uid} creado sin email`);
      return;
    }

    // Determinar role inicial basado en email
    const initialRole = getInitialRole(email);

    console.log(`Nuevo usuario creado: ${email}`, {uid, role: initialRole});

    // Crear documento en Firestore con todos los campos necesarios
    const userDoc = {
      uid,
      email,
      displayName: displayName || "",
      photoURL: user.photoURL || null,
      role: initialRole,
      userType: "general" as const,
      location: "",
      phone: "",
      about: "",
      specialties: [],
      active: true,
      verificationStatus: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      // Contadores inicializados en 0
      followersCount: 0,
      followingCount: 0,
      projectsCount: 0,
      rating: 0,
      reviewsCount: 0,
      resourcesCount: 0,
    };

    await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .set(userDoc, {merge: true});

    // Sincronizar a Custom Claims
    await syncCustomClaims(uid, initialRole);

    console.log(
      `Usuario ${uid} inicializado correctamente con role: ${initialRole}`
    );
  } catch (error) {
    console.error("Error en onUserCreate:", error);
    // No lanzar error para no bloquear la creación del usuario
  }
});

/**
 * Trigger: Cuando se actualiza el documento de usuario en Firestore
 * Sincroniza cambios de role a Custom Claims
 */
export const onUserDocumentUpdate = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const userId = context.params.userId;

      // Verificar si cambió el role
      if (beforeData.role !== afterData.role) {
        const newRole = afterData.role;

        console.log(`Role cambiado para usuario ${userId}`, {
          oldRole: beforeData.role,
          newRole,
        });

        // Sincronizar a Custom Claims
        await syncCustomClaims(userId, newRole);

        console.log(`Custom claims sincronizados para ${userId}`);
      }
    } catch (error) {
      console.error("Error en onUserDocumentUpdate:", error);
      // No lanzar error para no bloquear la actualización
    }
  });

