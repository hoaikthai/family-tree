# Family Tree — Technical Design

**Date:** 2026-03-08
**Status:** Approved

---

## Architecture

```
Frontend (React + TypeScript + Vite)
  ├── TanStack Router      — client-side routing with auth guards
  ├── TanStack Query       — server state, Supabase data fetching/mutations
  ├── React Flow (@xyflow/react v12) — interactive canvas
  ├── Tailwind CSS         — styling
  └── Supabase JS client   — auth, db queries, photo storage

Backend (Supabase)
  ├── Auth                 — email/password sign-up/sign-in
  ├── Postgres DB          — trees, persons, unions, junction tables
  ├── Storage              — profile photos (bucket: avatars)
  └── RLS policies         — row-level security per owner + is_public flag
```

---

## Data Model

```sql
-- One or many trees per user
trees
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid()
  owner_id      uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE
  name          text        NOT NULL
  is_public     boolean     NOT NULL DEFAULT false
  created_at    timestamptz NOT NULL DEFAULT now()

-- A person (graph node)
persons
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid()
  tree_id             uuid        NOT NULL REFERENCES trees ON DELETE CASCADE
  first_name          text        NOT NULL
  last_name           text
  gender              text        CHECK (gender IN ('male', 'female', 'other'))
  birth_date          date
  is_birth_year_only  boolean     NOT NULL DEFAULT false
  death_date          date
  is_death_year_only  boolean     NOT NULL DEFAULT false
  photo_url           text
  notes               text
  position_x          float       NOT NULL DEFAULT 0
  position_y          float       NOT NULL DEFAULT 0
  created_at          timestamptz NOT NULL DEFAULT now()

-- A family unit / couple (0–2 parents → N children)
unions
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid()
  tree_id     uuid        NOT NULL REFERENCES trees ON DELETE CASCADE
  position_x  float       NOT NULL DEFAULT 0
  position_y  float       NOT NULL DEFAULT 0
  created_at  timestamptz NOT NULL DEFAULT now()

-- Parents in a union (max 2)
union_members
  union_id    uuid NOT NULL REFERENCES unions ON DELETE CASCADE
  person_id   uuid NOT NULL REFERENCES persons ON DELETE CASCADE
  PRIMARY KEY (union_id, person_id)

-- Children of a union
union_children
  union_id    uuid NOT NULL REFERENCES unions ON DELETE CASCADE
  person_id   uuid NOT NULL REFERENCES persons ON DELETE CASCADE
  PRIMARY KEY (union_id, person_id)
```

### RLS Policies

```sql
-- trees
CREATE POLICY "owner full access" ON trees
  USING (owner_id = auth.uid());

CREATE POLICY "public read" ON trees
  FOR SELECT USING (is_public = true);

-- persons (inherits tree ownership/public)
CREATE POLICY "owner full access" ON persons
  USING (tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid()));

CREATE POLICY "public read" ON persons
  FOR SELECT USING (
    tree_id IN (SELECT id FROM trees WHERE is_public = true)
  );

-- Same pattern for unions, union_members, union_children
```

---

## Routes

| Path | Auth | Description |
|---|---|---|
| `/` | public | Landing page |
| `/login` | public | Sign in / sign up |
| `/dashboard` | required | My trees list |
| `/trees/:treeId` | required + owner | Tree editor canvas |
| `/trees/:treeId/settings` | required + owner | Rename, toggle public, share |
| `/t/:treeId` | none | Public read-only tree view |

---

## Key Components

| Component | File | Purpose |
|---|---|---|
| `TreeCanvas` | `src/components/TreeCanvas.tsx` | React Flow wrapper; renders all nodes/edges |
| `PersonNode` | `src/components/PersonNode.tsx` | Card: avatar + name + birth year |
| `UnionNode` | `src/components/UnionNode.tsx` | Small connector node between parents |
| `PersonDetailPanel` | `src/components/PersonDetailPanel.tsx` | Slide-out full person info + edit |
| `AddPersonModal` | `src/components/AddPersonModal.tsx` | Form to create/edit a person |
| `AddUnionModal` | `src/components/AddUnionModal.tsx` | Select 1–2 persons to form a union |
| `TreeSettingsPanel` | `src/components/TreeSettingsPanel.tsx` | Rename, toggle public, share link |

---

## Supabase File Structure

```
src/lib/supabase.ts           — typed Supabase client (single source of truth)
src/lib/database.types.ts     — generated via `supabase gen types typescript`

src/lib/api/trees.ts          — listTrees, getTree, createTree, updateTree, deleteTree, togglePublic
src/lib/api/persons.ts        — listPersons, createPerson, updatePerson, deletePerson, uploadPhoto
src/lib/api/unions.ts         — listUnions, createUnion, addMember, addChild, removeMember, removeChild, deleteUnion

src/hooks/useAuth.ts          — session state, signIn, signUp, signOut
src/hooks/useTrees.ts         — TanStack Query hooks wrapping api/trees.ts
src/hooks/usePersons.ts       — TanStack Query hooks wrapping api/persons.ts
src/hooks/useUnions.ts        — TanStack Query hooks wrapping api/unions.ts
```

### `src/lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## Auth Flow

1. User signs up / signs in via `/login` page
2. Supabase Auth persists session to `localStorage` automatically
3. `useAuth` hook exposes `session`, `signIn`, `signUp`, `signOut`
4. TanStack Router `beforeLoad` on protected routes: if no session → redirect to `/login`
5. Public routes (`/t/:treeId`) skip auth; RLS allows SELECT on `is_public = true` trees
6. Supabase client attaches JWT to every request; RLS enforces per-row ownership

---

## Data Flow

```
User action (e.g. drag node)
  → React Flow `onNodesChange`
  → debounce 500ms
  → TanStack Query mutation → api/persons.ts → supabase.from('persons').update(...)
  → invalidate ['persons', treeId] query
  → React re-renders with fresh data
```

---

## Canvas Edge Logic

Edges are computed client-side from union data:

- For each `union_member` (person → union): edge from `person-{id}` to `union-{id}`
- For each `union_child` (union → person): edge from `union-{id}` to `person-{id}`
- React Flow renders edges automatically given source/target node IDs

---

## Environment Variables

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```
