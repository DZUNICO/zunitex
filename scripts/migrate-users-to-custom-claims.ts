// scripts/migrate-users-to-custom-claims.ts

/**
 * Script para migrar usuarios existentes a Custom Claims
 * 
 * IMPORTANTE: Como todos los usuarios son de prueba, este script
 * simplemente asegura que todos tengan el role correcto en Firestore
 * y sus Custom Claims sincronizados.
 * 
 * Ejecutar con: npx tsx scripts/migrate-users-to-custom-claims.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Inicializar Firebase Admin
// NOTA: Requiere serviceAccountKey.json en la raíz del proyecto
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const ADMIN_EMAIL = 'diego.zuni@gmail.com';

interface UserDoc {
  uid: string;
  email: string;
  role?: string;
  userType?: string;
}

async function migrateUsers() {
  console.log('🚀 Iniciando migración de usuarios...\n');

  try {
    // 1. Obtener todos los usuarios de Authentication
    const authUsers = await auth.listUsers();
    console.log(`📊 Total usuarios en Authentication: ${authUsers.users.length}\n`);

    let updated = 0;
    let errors = 0;

    for (const authUser of authUsers.users) {
      try {
        const { uid, email } = authUser;

        if (!email) {
          console.log(`⚠️  Usuario ${uid} sin email, saltando...`);
          continue;
        }

        console.log(`📝 Procesando: ${email}`);

        // 2. Obtener documento de Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        let userData = userDoc.data() as UserDoc | undefined;

        // 3. Determinar role
        let role: string;
        if (email === ADMIN_EMAIL) {
          role = 'admin';
          console.log(`   👑 Admin detectado: ${email}`);
        } else if (userData?.role) {
          role = userData.role;
          console.log(`   ✅ Role existente: ${role}`);
        } else {
          role = 'user';
          console.log(`   🆕 Role default asignado: user`);
        }

        // 4. Actualizar/crear documento en Firestore
        const firestoreData = {
          uid,
          email,
          role,
          userType: userData?.userType || 'general',
          verificationStatus: null,
          ...(!userDoc.exists && {
            displayName: authUser.displayName || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: admin.firestore.FieldValue.serverTimestamp(),
            followersCount: 0,
            followingCount: 0,
            projectsCount: 0
          })
        };

        await db.collection('users').doc(uid).set(firestoreData, { merge: true });

        // 5. Sincronizar Custom Claims
        const claims = {
          role,
          admin: role === 'admin'
        };

        await auth.setCustomUserClaims(uid, claims);

        console.log(`   ✅ Custom claims sincronizados: ${JSON.stringify(claims)}\n`);
        updated++;

      } catch (error) {
        console.error(`❌ Error procesando usuario ${authUser.uid}:`, error);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Migración completada!');
    console.log(`   📊 Usuarios procesados: ${authUsers.users.length}`);
    console.log(`   ✅ Actualizados exitosamente: ${updated}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error fatal en migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateUsers()
  .then(() => {
    console.log('🎉 Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script finalizado con errores:', error);
    process.exit(1);
  });








