# AGENTS.md (SMARTTICKETS root)

## Producto
SmartTickets MVP: app full-stack para registrar Bugs y Features con dashboard ejecutivo.
Meta: "se ve real" + flujos completos + listo para producción incremental.

## Output fijo (token-lean)
Responde siempre con:
1) Plan (máx 5 bullets)
2) Archivos tocados (lista)
3) Comandos para validar (copy/paste)

## Reglas generales
- No pegues bloques largos de código en la respuesta: edita archivos y referencia rutas.
- Si falta info NO bloqueante: asume defaults razonables y decláralos en 1 línea.
- Cambios mínimos que compilen. Evita refactors grandes.
- No agregues dependencias salvo necesidad clara; si agregas, justifica en 1 línea.
- Nunca escribas secretos. Usa `.env.example`.

## Estructura del repo
- `frontend/` React + TS + Vite + Tailwind + Recharts
- `backend/` NestJS + TS + Prisma + Postgres + JWT/RBAC + uploads
- Storage imágenes: `backend/uploads` (local)