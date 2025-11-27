# Cloud Functions - STARLOGIC

Infraestructura base para Cloud Functions de Firebase.

## 📋 Estado Actual

✅ **Estructura base creada** - Lista para implementar funciones

⚠️ **Funciones aún no implementadas** - Los archivos en `triggers/` son placeholders

## 🚀 Próximos Pasos

### 1. Habilitar Cloud Functions en Firebase Console

1. Ir a: https://console.firebase.google.com/
2. Seleccionar proyecto STARLOGIC
3. Ir a: **Build → Functions**
4. Click en "Get started"
5. Habilitar Billing API (gratis para desarrollo)
6. Seleccionar región: **us-central1**

### 2. Instalar Firebase CLI (si no está instalado)

```bash
npm install -g firebase-tools
firebase login
```

### 3. Inicializar Firebase en el proyecto

```bash
# Desde la raíz del proyecto
firebase init functions

# Responder:
# - Seleccionar proyecto STARLOGIC
# - TypeScript: Yes
# - ESLint: Yes
# - Instalar dependencias: Yes
```

### 4. Implementar Funciones

Los siguientes archivos están listos para implementar:

- `src/triggers/post-likes.ts` - Likes de posts de comunidad
- `src/triggers/blog-likes.ts` - Likes de posts de blog
- `src/triggers/followers.ts` - Sistema de followers
- `src/triggers/resource-likes.ts` - Likes de recursos
- `src/triggers/reviews.ts` - Sistema de reviews y ratings

### 5. Compilar y Deploy

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## 📁 Estructura

```
functions/
├── src/
│   ├── config.ts              # Configuración Admin SDK
│   ├── types.ts                # Tipos TypeScript
│   ├── index.ts                # Punto de entrada
│   ├── triggers/               # Funciones por dominio
│   │   ├── post-likes.ts
│   │   ├── blog-likes.ts
│   │   ├── followers.ts
│   │   ├── resource-likes.ts
│   │   └── reviews.ts
│   └── utils/
│       └── firestore-helpers.ts # Helpers para Firestore
├── lib/                        # Código compilado (auto-generado)
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Comandos Útiles

```bash
# Compilar TypeScript
npm run build

# Ver logs de funciones
npm run logs

# Ejecutar emulador local
npm start

# Deploy a producción
npm run deploy
```

## ⚠️ Notas Importantes

- **No hacer deploy aún** - Las funciones son placeholders
- **Node 20** requerido - Verificado en `package.json`
- **TypeScript** - Código fuente en `src/`, compilado en `lib/`
- **Firebase Admin SDK** - Inicializado en `config.ts`

## 🔗 Recursos

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [TypeScript para Functions](https://firebase.google.com/docs/functions/typescript)


