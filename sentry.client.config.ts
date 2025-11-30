// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://bfe123cad347e46af359ab1fbaef75d5@o4510434650292224.ingest.us.sentry.io/4510434650488832",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Configuración adicional para mejor tracking
  environment: process.env.NODE_ENV || "development",
  
  // Ignorar errores comunes que no son críticos
  ignoreErrors: [
    // Errores de navegación de Next.js
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    // Errores de extensiones del navegador
    /Extension context invalidated/,
    /Chrome extensions/,
  ],

  // Configurar antes de enviar
  beforeSend(event, hint) {
    // Filtrar errores en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry] Error capturado:', event, hint);
    }
    return event;
  },
});

