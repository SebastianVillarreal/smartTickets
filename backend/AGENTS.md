# AGENTS.md (backend)

## Stack
NestJS + TypeScript + Prisma + PostgreSQL.
Auth: JWT + RBAC.
Uploads: local en `backend/uploads`.

## Objetivo backend (MVP sólido)
- API consistente y tipada.
- Prisma como única capa de acceso a datos.
- RBAC simple y claro (roles + permisos por recurso).
- Subida/serving de imágenes funcional, sin cloud.

## Convenciones
- Controllers delgados, lógica en Services.
- DTOs con `class-validator` y `class-transformer`.
- Responses consistentes (evitar shapes distintos por endpoint).
- Errores claros (HttpException) con mensajes accionables.

## Modelo de dominio (orientación)
- User (email, passwordHash, role)
- Ticket (type: BUG|FEATURE, title, description, status, priority, createdBy, assignedTo?, timestamps)
- Comment (ticketId, authorId, body, createdAt)
- Attachment (ticketId, uploaderId, fileName, path, mimeType, size, createdAt)
- Activity/Audit opcional si existe tiempo (para dashboard).

## Auth (JWT)
- Passwords siempre hash (bcrypt).
- `AuthGuard('jwt')` + `RolesGuard`.
- Decorador `@Roles(...)` y enum de roles (ej: ADMIN, MANAGER, DEV, REPORTER).
- Nunca exponer hashes/secretos en respuestas.

## RBAC (MVP pragmático)
- Reglas mínimas recomendadas:
  - ADMIN: todo
  - MANAGER: ver todo + asignar + cambiar estados/prioridad
  - DEV: ver asignados + comentar + cambiar estado en asignados + subir attachments
  - REPORTER: crear ticket + ver propios + comentar propios + subir attachments propios
- Implementa checks en service (no solo guard) cuando depende del recurso (ownership/asignación).

## Prisma
- Mantén migraciones limpias.
- Indexes para dashboard: `Ticket.status`, `Ticket.type`, `Ticket.createdAt`, `Ticket.assignedToId`.
- Evita queries N+1: usa `include/select` con criterio.

## Dashboard endpoints (pensados para dirección)
- KPIs: abiertos, en progreso, cerrados, vencidos (si hay SLA), tiempo promedio de resolución.
- Series: tickets creados vs resueltos por día/semana.
- Ranking: top categorías/prioridades, backlog por responsable.
- Mantén agregaciones en SQL vía Prisma (groupBy) cuando sea posible.

## Uploads (local)
- Usa `multer` con diskStorage hacia `backend/uploads`.
- Sanitiza nombre y genera filename único (uuid).
- Guarda metadatos en DB (Attachment).
- Sirve estáticos: `/uploads/<file>` con `ServeStaticModule` o `app.useStaticAssets`.
- Límite de tamaño y validación de mimeType (solo imágenes).

## Config
- `.env` + `.env.example` con:
  - DATABASE_URL
  - JWT_SECRET
  - JWT_EXPIRES_IN
  - PORT
  - UPLOAD_DIR (default: uploads)
  - CORS_ORIGIN (frontend)

## Validación
- Usa scripts existentes. Típico:
  - `npm install`
  - `npx prisma migrate dev`
  - `npx prisma generate`
  - `npm run test`
  - `npm run start:dev`