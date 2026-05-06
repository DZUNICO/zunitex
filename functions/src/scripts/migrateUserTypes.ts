// functions/src/scripts/migrateUserTypes.ts
/**
 * Script de migración: userType legacy → 'profesional' | 'proveedor'
 *
 * Mapeo:
 *   electrician, corporate_pro, buyer, student, general → 'profesional'
 *   retailer, distributor, manufacturer             → 'proveedor'
 *
 * Ejecutar desde el directorio functions/:
 *   npm run migrate:user-types
 */

import * as admin from "firebase-admin";

const LEGACY_TO_NEW: Record<string, "profesional" | "proveedor"> = {
  electrician: "profesional",
  corporate_pro: "profesional",
  buyer: "profesional",
  student: "profesional",
  general: "profesional",
  retailer: "proveedor",
  distributor: "proveedor",
  manufacturer: "proveedor",
};

const NEW_VALUES = new Set(["profesional", "proveedor"]);

export async function migrateUserTypes(): Promise<void> {
  const db = admin.firestore();
  const snapshot = await db.collection("users").get();

  if (snapshot.empty) {
    console.log("✅ No hay usuarios en la colección");
    return;
  }

  const batchSize = 500;
  let batch = db.batch();
  let pendingInBatch = 0;
  let batchNum = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const doc of snapshot.docs) {
    const { userType, email } = doc.data() as { userType?: string; email?: string };

    if (!userType || NEW_VALUES.has(userType)) {
      totalSkipped++;
      continue;
    }

    const newType = LEGACY_TO_NEW[userType];
    if (!newType) {
      console.warn(`⚠️  Valor desconocido '${userType}' en usuario ${doc.id} (${email ?? "sin email"}) — omitido`);
      totalSkipped++;
      continue;
    }

    batch.update(doc.ref, { userType: newType });
    console.log(`📝 ${doc.id} (${email ?? "?"})  ${userType} → ${newType}`);
    totalUpdated++;
    pendingInBatch++;

    if (pendingInBatch === batchSize) {
      batchNum++;
      console.log(`💾 Commitando batch ${batchNum}...`);
      await batch.commit();
      console.log(`✅ Batch ${batchNum} OK`);
      batch = db.batch();
      pendingInBatch = 0;
    }
  }

  if (pendingInBatch > 0) {
    batchNum++;
    console.log(`💾 Commitando batch final ${batchNum}...`);
    await batch.commit();
    console.log(`✅ Batch final ${batchNum} OK`);
  }

  console.log(`\n✅ Migración completada: ${totalUpdated} actualizados, ${totalSkipped} sin cambios`);
}

if (require.main === module) {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  migrateUserTypes()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error fatal:", err);
      process.exit(1);
    });
}
