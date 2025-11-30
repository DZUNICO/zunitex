import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { logFunction, logError } from '../config';

/**
 * Cloud Function programada para realizar backups diarios de Firestore
 * Se ejecuta automáticamente a las 2 AM (hora de Lima) todos los días
 */
export const scheduledFirestoreBackup = onSchedule(
  {
    schedule: '0 2 * * *', // 2 AM diario
    timeZone: 'America/Lima',
    memory: '512MiB',
    timeoutSeconds: 540, // 9 minutos máximo
  },
  async (event) => {
    const projectId = process.env.GCP_PROJECT || 'zunitex-47e0a';
    const bucket = `gs://${projectId}-backups`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const timestamp = `${dateStr}_${timeStr}`;
    const backupPath = `${bucket}/firestore-backups/${timestamp}`;

    try {
      logFunction('scheduledFirestoreBackup', 'Starting backup', { backupPath });

      // Usar Firestore Admin API para exportar
      const client = new admin.firestore.v1.FirestoreAdminClient();
      const databaseName = client.databasePath(projectId, '(default)');

      const [operation] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: backupPath,
        collectionIds: [], // Empty = all collections
      });

      logFunction('scheduledFirestoreBackup', 'Backup operation started', { 
        operation: operation.name,
        backupPath 
      });

      // La operación es asíncrona, pero no esperamos a que termine
      // Firebase se encargará de completarla en segundo plano
      console.log(`✅ Backup iniciado: ${backupPath}`);
      console.log(`📋 Operación: ${operation.name}`);

      // No retornar nada (void) - onSchedule no espera return value
    } catch (error) {
      logError('scheduledFirestoreBackup', error as Error);
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }
);

