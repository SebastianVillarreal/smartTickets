# AGENTS.md (frontend)

## Stack
React + TypeScript + Vite + Tailwind + Recharts.

## Objetivo UX (demo ejecutiva)
- Layout consistente: Topbar + Sidebar colapsable.
- Estados en cada vista: loading / empty / error.
- Tablas: búsqueda + filtros + paginación local (mínimo).
- Dashboard: KPIs + gráficas Recharts (línea/barra/pastel) + tendencias.

## Arquitectura mínima (sin overengineering)
- `src/pages/*` vistas
- `src/components/*` UI reusable
- `src/services/*` API client + endpoints
- `src/types/*` DTOs/tipos
- `src/utils/*` helpers (fechas, formato)
- `src/routes/*` routing (si aplica)

## Datos y API
- Consumir backend vía `VITE_API_URL`.
- Un solo `apiClient` (fetch) con:
  - `Authorization: Bearer <token>` si existe auth
  - manejo estándar de errores
- Evita mocks si ya hay backend; si backend aún no está, usa `src/mocks/*` pero con el MISMO shape que la API final.

## Tailwind
- Usa clases utilitarias; evita CSS ad-hoc salvo casos puntuales.
- Componentes con spacing y jerarquía visual clara (cards, badges, chips).

## Recharts
- No sobrecargar: 1–3 charts por dashboard.
- Tooltips/legends solo si aportan.
- Datos agregados (por día/semana/estado) para lectura rápida.

## Calidad
- Mantén TS estricto (sin `any`).
- Evita dependencias nuevas (UI kits, state managers) salvo necesidad clara.
- Manejo de forms con `react-hook-form` SOLO si ya existe; si no, forms simples controlados.

## Validación
- Usa scripts del repo. Típico:
  - `npm install`
  - `npm run lint`
  - `npm run build`
  - `npm run dev`