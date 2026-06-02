# STARLOGIC — Roadmap

> El roadmap refleja el estado del proyecto en junio 2026. Actualizar cuando cambien las prioridades.

---

## Este mes (junio 2026)

| Tarea | Prioridad | Notas |
|-------|-----------|-------|
| Implementar approve route correcto (N filas por variante) | CRÍTICA | Ver ADR-002 y `DOCUMENTACION-v2.md → ⚠️ Cambio pendiente crítico` |
| Re-aprobar NH-90, TW-80, THW-90 con nueva lógica | CRÍTICA | Después del cambio en approve route |
| Activar `disponible_peru = true` en conductores verificados | Alta | Después de re-aprobación |
| Implementar `aliases_busqueda` en `search_vector` | Alta | Activa FTS para keywords del mercado |
| Procesar fichas Nexans pendientes: TTRF-70, N2XOH, N2XY | Media | Ampliar catálogo de conductores |

---

## Próximo trimestre (Q3 2026)

- 1,000 productos en graph con datos técnicos reales
- Tráfico orgánico validado: 500+ sesiones/mes desde búsqueda
- Primera señal comercial de proveedor (pago o solicitud verificada)
- Importación estructurada Excel ELCOPE (3,919 productos)
- Página de producto individual por variante con datos técnicos completos
- Filtros por calibre en catálogo

---

## Hitos que desbloquean la siguiente etapa

| Hito | Qué desbloquea |
|------|----------------|
| **Hito 1 — Validación** | Usuario recurrente documentado + tráfico orgánico verificado → inversión en marketing o monetización |
| **Hito 2 — Conductores completos** | Todas las marcas principales peruanas procesadas → expansión a breakers y transformadores |
| **Hito 3 — Validación en Perú** | Uso real verificado en múltiples regiones → expansión a Chile, Colombia, Ecuador |

---

## Señales de avance que importan

Estas señales indican que el proyecto avanza en la dirección correcta:

- Un técnico o ingeniero que usa STARLOGIC semanalmente sin ser invitado
- Un proveedor que paga voluntariamente por estar listado
- Un usuario que encuentra una equivalencia que no encontraba en ningún otro lugar
- Un fabricante que contacta para actualizar sus datos

Ver Principio #10 en `00-PRINCIPLES.md`.

---

## Lo que NO está en el roadmap

Estas cosas no están en el roadmap intencionalmente. Antes de agregarlas, revisar `00-PRINCIPLES.md → Principio #11` (no construir sin evidencia):

- App móvil
- Notificaciones push
- Chat o mensajería entre usuarios
- Sistema de reviews de proveedores (sin masa crítica no tiene valor)
- Expansión a productos no eléctricos
