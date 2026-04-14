# Copilot Instructions

## Commands

```bash
pnpm dev          # dev server
pnpm build        # tsc -b && vite build
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit (type-check without building)
```

No test suite exists. Use `pnpm typecheck` to validate types.

## Architecture

React 19 + TypeScript SPA deployed to GitHub Pages, backed by Supabase (auth + PostgreSQL).

### Routing

File-based routing via **TanStack Router** in `src/routes/`. The route tree is **auto-generated** into `src/routeTree.gen.ts` — never edit that file manually.

- `__root.tsx` — root layout; injects `queryClient` into router context
- `_auth.tsx` — auth guard layout; redirects to `/login` if no session. All protected routes are prefixed `_auth.`
- `_auth.trees.$treeId.tsx` + `.lazy.tsx` — split-load tree editor (heavy canvas)
- `t.$treeId.tsx` + `.lazy.tsx` — public read-only tree view (no auth required)

### Data Layer (3-tier)

```
src/lib/api/       ← raw Supabase calls; throw on error, return typed data
src/hooks/         ← TanStack Query wrappers (useQuery + useMutation)
src/constants/queryKeys.ts ← single source of truth for all query keys
```

Persons and trees mutations use **optimistic cache updates** (`qc.setQueryData`). Union mutations use `qc.invalidateQueries` because union data includes joined `union_members` and `union_children`.

### Canvas

The family tree uses **React Flow** (`@xyflow/react`) with two custom node types registered in `TreeCanvas.tsx`:
- `person` — `PersonNode`: renders photo, name, birth year; respects user's `name_order` preference
- `union` — `UnionNode`: small dot node acting as a junction; partners connect as **targets**, children connect as **sources**

Node IDs are prefixed: `person-{uuid}` and `union-{uuid}`. Positions are persisted to Supabase on drag-end; local node state is merged (not replaced) from server data to avoid overwriting in-flight drags.

### Database Schema

Five tables in Supabase: `trees`, `persons`, `unions`, `union_members` (max 2 per union), `union_children` (ordered by `position`). All tables use **Row Level Security**: owners have full access; `is_public = true` trees are readable by anyone.

`src/lib/database.types.ts` is the TypeScript mirror of the schema — update it when running migrations.

Migrations live in `supabase/migrations/` and must be applied manually via the Supabase dashboard or CLI.

## Key Conventions

- **Path alias**: `@/` maps to `src/`
- **Class merging**: always use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge)
- **i18n**: all user-visible strings must go through `useTranslation()` / `t()`. Translations are in `src/lib/i18n/en.json` and `vi.json`
- **Name formatting**: use `formatName(firstName, lastName, nameOrder)` from `src/lib/formatName.ts`; never concatenate names directly
- **Feature co-location**: feature-specific components, forms, and Zod schemas live in `src/features/{persons,unions,settings}/`
- **Shared UI**: shadcn/ui primitives are in `src/components/ui/`; canvas-specific components (`PersonNode`, `UnionNode`, `TreeCanvas`) are in `src/components/`
- **Forms**: use TanStack Form + Zod schemas; schema files are co-located with their feature form (e.g., `personSchema.ts` beside `PersonForm.tsx`)
- **Unused vars**: ESLint allows `_`-prefixed parameters to be unused (e.g., `_treeId`)

## Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Set `DEPLOY_TARGET=github-pages` at build time to use `/family-tree/` as the Vite base path (done automatically in CI).
