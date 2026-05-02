#!/bin/bash

# Script de restore de Firestore
# Uso: ./scripts/restore-firestore.sh <backup-path>

set -e

PROJECT_ID="zunitex-47e0a"
BUCKET="gs://${PROJECT_ID}-backups"

# Verificar argumento
if [ -z "$1" ]; then
  echo "❌ Error: Debes especificar la ruta del backup"
  echo ""
  echo "Uso: ./scripts/restore-firestore.sh <backup-date>"
  echo "Ejemplo: ./scripts/restore-firestore.sh 20241130_120000"
  echo ""
  echo "📋 Backups disponibles:"
  gsutil ls "${BUCKET}/firestore-backups/" 2>/dev/null || echo "No hay backups disponibles"
  exit 1
fi

BACKUP_DATE=$1
BACKUP_PATH="${BUCKET}/firestore-backups/${BACKUP_DATE}"

# Verificar que el backup existe
if ! gsutil ls "${BACKUP_PATH}" > /dev/null 2>&1; then
  echo "❌ Error: Backup no encontrado en ${BACKUP_PATH}"
  echo ""
  echo "📋 Backups disponibles:"
  gsutil ls "${BUCKET}/firestore-backups/" 2>/dev/null || echo "No hay backups disponibles"
  exit 1
fi

echo "⚠️  ADVERTENCIA: Esta operación restaurará Firestore al estado del backup"
echo "📅 Fecha del backup: ${BACKUP_DATE}"
echo "📍 Ubicación: ${BACKUP_PATH}"
echo ""
read -p "¿Estás seguro? (escribe 'SI' para continuar): " confirm

if [ "$confirm" != "SI" ]; then
  echo "❌ Operación cancelada"
  exit 0
fi

echo "🔄 Iniciando restore de Firestore..."

# Importar Firestore
firebase firestore:import "${BACKUP_PATH}" \
  --project "${PROJECT_ID}"

echo "✅ Restore completado exitosamente"








