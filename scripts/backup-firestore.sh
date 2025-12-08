#!/bin/bash

# Script de backup automático de Firestore
# Uso: ./scripts/backup-firestore.sh

set -e  # Exit on error

# Configuración
PROJECT_ID="zunitex-47e0a"
BUCKET="gs://${PROJECT_ID}-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BUCKET}/firestore-backups/${DATE}"

echo "🔄 Iniciando backup de Firestore..."
echo "📅 Fecha: ${DATE}"
echo "📦 Destino: ${BACKUP_PATH}"

# Exportar Firestore
firebase firestore:export "${BACKUP_PATH}" \
  --project "${PROJECT_ID}"

echo "✅ Backup completado exitosamente"
echo "📍 Ubicación: ${BACKUP_PATH}"

# Listar backups existentes (últimos 10)
echo ""
echo "📋 Backups recientes:"
gsutil ls -l "${BUCKET}/firestore-backups/" 2>/dev/null | tail -n 10 || echo "No hay backups anteriores"

# Calcular tamaño total de backups
TOTAL_SIZE=$(gsutil du -s "${BUCKET}/firestore-backups/" 2>/dev/null | awk '{print $1}' || echo "0")
if [ "$TOTAL_SIZE" != "0" ] && [ -n "$TOTAL_SIZE" ]; then
  TOTAL_SIZE_MB=$((TOTAL_SIZE / 1024 / 1024))
  echo ""
  echo "💾 Tamaño total de backups: ${TOTAL_SIZE_MB} MB"
else
  echo ""
  echo "💾 Tamaño total de backups: 0 MB"
fi

# Limpieza de backups antiguos (> 30 días)
echo ""
echo "🧹 Limpiando backups antiguos (> 30 días)..."

# Obtener fecha de corte (30 días atrás)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  CUTOFF_DATE=$(date -v-30d +%Y%m%d)
else
  # Linux
  CUTOFF_DATE=$(date -d '30 days ago' +%Y%m%d)
fi

gsutil ls "${BUCKET}/firestore-backups/" 2>/dev/null | while read -r backup; do
  if [ -n "$backup" ]; then
    BACKUP_DATE=$(echo "${backup}" | grep -oE '[0-9]{8}' | head -1)
    if [ -n "$BACKUP_DATE" ] && [ "$BACKUP_DATE" != "" ] && [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
      echo "🗑️  Eliminando: ${backup}"
      gsutil -m rm -r "${backup}" 2>/dev/null || true
    fi
  fi
done

echo "✅ Limpieza completada"





