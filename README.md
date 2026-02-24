# smartTickets MVP

Aplicación full-stack para registrar bugs y features con dashboard ejecutivo.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind + Recharts
- Backend: NestJS + TypeScript + Prisma + PostgreSQL
- Auth: JWT + RBAC
- Storage de imágenes: local (`backend/uploads`)

## Demo users

- `admin@demo.com / Admin123!`
- `manager@demo.com / Admin123!`
- `dev@demo.com / Admin123!`
- `reporter@demo.com / Admin123!`

## Levantar con Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Desarrollo local

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Estructura

- `backend/`: API REST, Prisma, seed, uploads
- `frontend/`: App React (dashboard, tickets, sistemas, usuarios)
