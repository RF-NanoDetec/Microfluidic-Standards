# Tech‑Stack Conventions

- **Language:** TypeScript everywhere; avoid `any`; use `import type` for type‑only imports.
- **Components:** `function MyComponent()` (not arrow/const). Keep pure helpers below export.
- **Styling:** Tailwind utility‑first plus shadcn/ui & Radix primitives. Mobile‑first responsive design.
- **Server/Client split:** Prefer React Server Components; use `'use client'` only for DOM APIs.
- **Validation:** Zod schemas; infer types from schemas to keep single source of truth.
- **Data fetching:** Use the preload pattern; minimise waterfalls; fall back to TanStack Query on the client.
