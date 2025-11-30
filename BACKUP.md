# 🗄️ Sistema de Backups de Firestore

## Configuración

- **Frecuencia:** Diario (automático a las 2 AM)
- **Retención:** 30 días en storage, 60 días en bucket (lifecycle)
- **Ubicación:** `gs://zunitex-47e0a-backups/firestore-backups/`
- **Tamaño estimado:** ~50-100 MB por backup

## Scripts Disponibles

### 1. Backup Manual

```bash
npm run backup
# O directamente:
./scripts/backup-firestore.sh
```

Crea un backup inmediato de Firestore.

### 2. Restore desde Backup

```bash
# Listar backups disponibles
npm run backup:list

# Restore específico
npm run backup:restore 20241130_120000
# O directamente:
./scripts/restore-firestore.sh 20241130_120000
```

⚠️ **ADVERTENCIA:** El restore sobrescribe los datos actuales.

### 3. Setup Inicial del Bucket

```bash
npm run backup:setup
# O directamente:
./scripts/setup-backup-bucket.sh
```

Ejecutar una sola vez para crear el bucket de backups.

### 4. Listar Backups

```bash
npm run backup:list
# O directamente:
gsutil ls -lh gs://zunitex-47e0a-backups/firestore-backups/
```

## Backup Automático (Cloud Function)

### Configuración

La Cloud Function `scheduledFirestoreBackup` se ejecuta automáticamente todos los días a las 2 AM (hora de Lima).

**Deploy de la función:**

```bash
cd functions
npm run build
firebase deploy --only functions:scheduledFirestoreBackup
```

**Verificar que está activa:**

```bash
firebase functions:list
```

Deberías ver `scheduledFirestoreBackup` en la lista.

### Monitoreo

#### Ver logs de backups:

```bash
# Cloud Function logs
firebase functions:log --only scheduledFirestoreBackup

# O en console
https://console.firebase.google.com/project/zunitex-47e0a/functions/logs
```

#### Verificar backups creados:

```bash
gsutil ls gs://zunitex-47e0a-backups/firestore-backups/
```

### Alertas Recomendadas

1. **Backup fallido** - Email cuando backup falla
2. **Tamaño anormal** - Alerta si backup > 500 MB
3. **No backup en 25 horas** - Alerta si no hay backup reciente

Para configurar alertas en Google Cloud Console:
- Ve a: https://console.cloud.google.com/monitoring/alerting
- Crea alertas basadas en logs de Cloud Functions

## Restore en Emergencia

### Escenario: Datos borrados accidentalmente

1. **Detener la app inmediatamente:**

```bash
   # Desactivar en Vercel (si aplica)
   vercel --prod --env MAINTENANCE_MODE=true
```

2. **Identificar último backup bueno:**

```bash
   npm run backup:list
   # O:
   gsutil ls gs://zunitex-47e0a-backups/firestore-backups/
```

3. **Restore:**

```bash
   npm run backup:restore YYYYMMDD_HHMMSS
   # Ejemplo:
   npm run backup:restore 20241130_120000
```

4. **Verificar datos:**

   - Abrir Firebase Console
   - Verificar colecciones críticas
   - Verificar contadores

5. **Reactivar app:**

```bash
   vercel --prod --env MAINTENANCE_MODE=false
```

## Costos Estimados

- **Storage:** ~$0.026/GB/mes
- **Operaciones:** ~$0.05/1000 operaciones
- **Cloud Functions:** ~$0.40 por millón de invocaciones
- **Total estimado:** ~$2-5/mes (100 GB backups, 30 backups diarios)

## Testing del Sistema

### Test 1: Backup manual

```bash
npm run backup
# Verificar que se creó en bucket
npm run backup:list
```

### Test 2: Verificar Cloud Function

```bash
# Ver logs
firebase functions:log --only scheduledFirestoreBackup

# Verificar que se ejecutó
gsutil ls gs://zunitex-47e0a-backups/firestore-backups/
```

### Test 3: Restore en desarrollo

```bash
# 1. Crear backup de prueba
npm run backup

# 2. Anotar la fecha del backup
# 3. Borrar un documento de prueba en Firestore Console
# 4. Restore
npm run backup:restore YYYYMMDD_HHMMSS

# 5. Verificar que el documento volvió
```

## Troubleshooting

### Error: "Permission denied"

```bash
# Autenticarse con Google Cloud
gcloud auth application-default login
firebase login
```

### Error: "Bucket not found"

```bash
npm run backup:setup
```

### Error: "Firebase CLI not found"

```bash
npm install -g firebase-tools
```

### Backup muy lento

- Normal para bases de datos grandes (> 1 GB)
- Puede tomar 10-30 minutos
- La Cloud Function tiene timeout de 9 minutos, pero la operación continúa en segundo plano

### Cloud Function no se ejecuta

1. Verificar que está deployada:
```bash
firebase functions:list
```

2. Verificar logs:
```bash
firebase functions:log --only scheduledFirestoreBackup
```

3. Verificar en Google Cloud Console:
   - https://console.cloud.google.com/cloudscheduler
   - Buscar job `scheduledFirestoreBackup`

## Estructura de Backups

```
gs://zunitex-47e0a-backups/
└── firestore-backups/
    ├── 20241130_020000/  # Backup del 30 Nov 2024, 2 AM
    ├── 20241201_020000/  # Backup del 1 Dic 2024, 2 AM
    └── ...
```

Cada backup contiene:
- Todos los documentos de todas las colecciones
- Metadatos de Firestore
- Índices (si aplica)

## Checklist de Implementación

- [x] Scripts creados (`backup-firestore.sh`, `restore-firestore.sh`, `setup-backup-bucket.sh`)
- [ ] Bucket configurado (`npm run backup:setup`)
- [ ] Cloud Function deployada (`firebase deploy --only functions:scheduledFirestoreBackup`)
- [ ] Backup manual testeado (`npm run backup`)
- [ ] Restore testeado en desarrollo
- [ ] Alertas configuradas (opcional)
- [ ] Equipo capacitado en proceso de restore

## Comandos Rápidos

```bash
# Setup inicial (una vez)
npm run backup:setup

# Backup manual
npm run backup

# Listar backups
npm run backup:list

# Restore
npm run backup:restore YYYYMMDD_HHMMSS

# Deploy Cloud Function
cd functions && npm run build && firebase deploy --only functions:scheduledFirestoreBackup

# Ver logs
firebase functions:log --only scheduledFirestoreBackup
```

