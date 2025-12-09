// functions/src/scripts/migrateUsers.ts
/**
 * Script de migración para actualizar usuarios existentes
 * Agrega campos faltantes: followersCount, followingCount,
 * reviewsCount, resourcesCount
 *
 * Ejecutar desde functions directory:
 * npm run migrate:users
 *
 * O desde Firebase CLI:
 * firebase functions:shell
 * > migrateUsers()
 */

import * as admin from "firebase-admin";

/**
 * Migra usuarios existentes agregando campos faltantes
 * @return {Promise<void>}
 */
export async function migrateExistingUsers(): Promise<void> {
  try {
    const db = admin.firestore();
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log("✅ No hay usuarios para migrar");
      return;
    }

    let updateCount = 0;
    // Firestore limita batches a 500 operaciones
    const batchSize = 500;
    let currentBatch = 0;
    let batch = db.batch();

    // Usar for...of en lugar de forEach para permitir await
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates: Record<string, unknown> = {};

      // Agregar campos faltantes con valores por defecto
      if (data.followersCount === undefined) {
        updates.followersCount = 0;
      }
      if (data.followingCount === undefined) {
        updates.followingCount = 0;
      }
      if (data.reviewsCount === undefined) {
        updates.reviewsCount = 0;
      }
      if (data.resourcesCount === undefined) {
        updates.resourcesCount = 0;
      }
      if (data.rating === undefined) {
        updates.rating = 0;
      }
      if (data.active === undefined) {
        updates.active = true;
      }
      if (data.location === undefined) {
        updates.location = "";
      }
      if (data.phone === undefined) {
        updates.phone = "";
      }
      if (data.about === undefined) {
        updates.about = "";
      }
      if (data.specialties === undefined) {
        updates.specialties = [];
      }

      // Si hay campos para actualizar
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        updateCount++;
        const email = data.email || "sin email";
        console.log("📝 Actualizando usuario: " + doc.id + " (" + email + ")");

        // Si el batch alcanza el límite, commit y crear nuevo batch
        if (updateCount % batchSize === 0) {
          currentBatch++;
          console.log("💾 Commitando batch " + currentBatch + "...");
          await batch.commit();
          console.log("✅ Batch " + currentBatch + " completado");
          // Crear nuevo batch para las siguientes operaciones
          batch = db.batch();
        }
      }
    }

    // Commit del batch final si hay actualizaciones pendientes
    if (updateCount % batchSize !== 0 && updateCount > 0) {
      currentBatch++;
      console.log("💾 Commitando batch final " + currentBatch + "...");
      await batch.commit();
      console.log("✅ Batch final " + currentBatch + " completado");
    }

    if (updateCount > 0) {
      const msg = "\n✅ Migración completada: " + updateCount +
        " usuarios actualizados";
      console.log(msg);
    } else {
      console.log("\n✅ Todos los usuarios ya están actualizados");
    }
  } catch (error) {
    console.error("❌ Error en migración de usuarios:", error);
    throw error;
  }
}

// Si se ejecuta directamente (no como módulo)
if (require.main === module) {
  // Inicializar admin si no está inicializado
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  migrateExistingUsers()
    .then(() => {
      console.log("✅ Script de migración finalizado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error fatal:", error);
      process.exit(1);
    });
}

