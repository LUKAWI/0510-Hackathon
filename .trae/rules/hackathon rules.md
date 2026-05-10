# Hackathon Project Rules

## Tech Stack
- Frontend: React 18+ (not Next.js) + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui components
- Backend API: Vercel Functions (same origin, no CORS)
- Database: Neon PostgreSQL (serverless)
- ORM: Drizzle ORM (type-safe, lightweight)

## UI/UX Standards
- Always use shadcn/ui components first, custom CSS last
- All pages must be responsive (mobile-first)
- Include loading skeletons, empty states, and error boundaries
- Use React Hook Form + Zod for all forms
- Dark mode support via Tailwind dark: prefix

## Code Quality Standards
- Every component must have TypeScript types
- Use functional components + hooks (no class components)
- Extract reusable logic into custom hooks
- No `any` types — use proper interfaces
- Run `npm run build` before considering a feature "done"

## Database Conventions
- Use Drizzle ORM for all queries
- Run `npx drizzle-kit push` after schema changes
- Connection string from `DATABASE_URL` env variable