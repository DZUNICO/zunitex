#!/bin/bash

# Setup inicial del bucket de backups
PROJECT_ID="zunitex-47e0a"
BUCKET_NAME="${PROJECT_ID}-backups"
REGION="us-central1"

echo "🔧 Configurando bucket de backups..."

# Crear bucket si no existe
if ! gsutil ls -b "gs://${BUCKET_NAME}" > /dev/null 2>&1; then
  echo "📦 Creando bucket: ${BUCKET_NAME}"
  gsutil mb -p "${PROJECT_ID}" -l "${REGION}" "gs://${BUCKET_NAME}"
  
  # Configurar lifecycle (eliminar backups > 60 días)
  echo "⚙️  Configurando lifecycle policy..."
  
  # Crear archivo temporal de lifecycle
  LIFECYCLE_FILE=$(mktemp)
  cat > "${LIFECYCLE_FILE}" <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 60}
      }
    ]
  }
}
EOF
  
  gsutil lifecycle set "${LIFECYCLE_FILE}" "gs://${BUCKET_NAME}"
  rm "${LIFECYCLE_FILE}"
  
  echo "✅ Bucket creado y configurado"
else
  echo "ℹ️  Bucket ya existe: ${BUCKET_NAME}"
fi

# Verificar permisos
echo "🔐 Verificando permisos..."
firebase projects:list | grep "${PROJECT_ID}" || echo "⚠️  No se pudo verificar proyecto. Asegúrate de estar autenticado con: firebase login"

echo "✅ Setup completado"








