# Family Tree Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-tenant family tree SaaS app with an interactive canvas graph, Supabase backend, and public sharing.

**Architecture:** React + TypeScript + Vite frontend. TanStack Router for routing with auth guards. TanStack Query for server state. React Flow (@xyflow/react) for the canvas. Supabase for auth, Postgres DB, and Storage.

**Tech Stack:** Vite, React 19, TypeScript, TanStack Router, TanStack Query, @xyflow/react, Tailwind CSS v4, Supabase JS

**Reference docs:**
- Business spec: `docs/specs/2026-03-08-family-tree-business-spec.md`
- Technical design: `docs/plans/2026-03-08-family-tree-design.md`

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

**Step 1: Scaffold Vite project**

```bash
cd /Users/hoai/projects/personal/family-tree
npm create vite@latest . -- --template react-ts
```

Expected: Vite project files created.

**Step 2: Install dependencies**

```bash
npm install \
  @supabase/supabase-js \
  @tanstack/react-router \
  @tanstack/react-query \
  @xyflow/react \
  @tanstack/router-devtools \
  @tanstack/react-query-devtools

npm install -D \
  @tailwindcss/vite \
  tailwindcss \
  @types/node
```

**Step 3: Configure Tailwind v4**

In `vite.config.ts`, add the Tailwind plugin:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

In `src/index.css`:
```css
@import "tailwindcss";
```

**Step 4: Create `.env` file**

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

And `.env.example`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Step 5: Create `.gitignore`**

```
node_modules
dist
.env
*.local
```

**Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server running at http://localhost:5173

**Step 7: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript project"
```

---

## Task 2: Supabase Database Setup

> This task is done in the Supabase dashboard or via Supabase CLI. Complete the SQL, then generate types.

**Files:**
- Create: `supabase/migrations/001_initial.sql`
- Create: `src/lib/database.types.ts` (generated)

**Step 1: Create migration file**

Create `supabase/migrations/001_initial.sql`:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trees
CREATE TABLE trees (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        text        NOT NULL,
  is_public   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Persons
CREATE TABLE persons (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id             uuid        NOT NULL REFERENCES trees ON DELETE CASCADE,
  first_name          text        NOT NULL,
  last_name           text,
  gender              text        CHECK (gender IN ('male', 'female', 'other')),
  birth_date          date,
  is_birth_year_only  boolean     NOT NULL DEFAULT false,
  death_date          date,
  is_death_year_only  boolean     NOT NULL DEFAULT false,
  photo_url           text,
  notes               text,
  position_x          float       NOT NULL DEFAULT 0,
  position_y          float       NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Unions (family units)
CREATE TABLE unions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id     uuid        NOT NULL REFERENCES trees ON DELETE CASCADE,
  position_x  float       NOT NULL DEFAULT 0,
  position_y  float       NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Union parents
CREATE TABLE union_members (
  union_id    uuid NOT NULL REFERENCES unions ON DELETE CASCADE,
  person_id   uuid NOT NULL REFERENCES persons ON DELETE CASCADE,
  PRIMARY KEY (union_id, person_id)
);

-- Union children
CREATE TABLE union_children (
  union_id    uuid NOT NULL REFERENCES unions ON DELETE CASCADE,
  person_id   uuid NOT NULL REFERENCES persons ON DELETE CASCADE,
  PRIMARY KEY (union_id, person_id)
);

-- RLS: Enable on all tables
ALTER TABLE trees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE unions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_children ENABLE ROW LEVEL SECURITY;

-- RLS policies: trees
CREATE POLICY "trees_owner_all" ON trees
  USING (owner_id = auth.uid());

CREATE POLICY "trees_public_read" ON trees
  FOR SELECT USING (is_public = true);

-- RLS policies: persons
CREATE POLICY "persons_owner_all" ON persons
  USING (tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid()));

CREATE POLICY "persons_public_read" ON persons
  FOR SELECT USING (
    tree_id IN (SELECT id FROM trees WHERE is_public = true)
  );

-- RLS policies: unions
CREATE POLICY "unions_owner_all" ON unions
  USING (tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid()));

CREATE POLICY "unions_public_read" ON unions
  FOR SELECT USING (
    tree_id IN (SELECT id FROM trees WHERE is_public = true)
  );

-- RLS policies: union_members
CREATE POLICY "union_members_owner_all" ON union_members
  USING (union_id IN (
    SELECT id FROM unions WHERE tree_id IN (
      SELECT id FROM trees WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "union_members_public_read" ON union_members
  FOR SELECT USING (
    union_id IN (
      SELECT id FROM unions WHERE tree_id IN (
        SELECT id FROM trees WHERE is_public = true
      )
    )
  );

-- RLS policies: union_children
CREATE POLICY "union_children_owner_all" ON union_children
  USING (union_id IN (
    SELECT id FROM unions WHERE tree_id IN (
      SELECT id FROM trees WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "union_children_public_read" ON union_children
  FOR SELECT USING (
    union_id IN (
      SELECT id FROM unions WHERE tree_id IN (
        SELECT id FROM trees WHERE is_public = true
      )
    )
  );
```

**Step 2: Run migration in Supabase**

Option A — Supabase dashboard: Open SQL editor, paste and run the SQL above.

Option B — Supabase CLI:
```bash
supabase db push
```

**Step 3: Create Storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `avatars`
- Public: yes (so photo_url links work without auth tokens)

**Step 4: Generate TypeScript types**

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/lib/database.types.ts
```

**Step 5: Commit**

```bash
git add supabase/ src/lib/database.types.ts
git commit -m "feat: add Supabase schema migration and generated types"
```

---

## Task 3: Supabase Client & API Layer

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/api/trees.ts`
- Create: `src/lib/api/persons.ts`
- Create: `src/lib/api/unions.ts`

**Step 1: Create Supabase client**

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**Step 2: Create trees API**

`src/lib/api/trees.ts`:
```ts
import { supabase } from '../supabase'
import type { Database } from '../database.types'

type Tree = Database['public']['Tables']['trees']['Row']
type TreeInsert = Database['public']['Tables']['trees']['Insert']
type TreeUpdate = Database['public']['Tables']['trees']['Update']

export async function listTrees() {
  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getTree(id: string) {
  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createTree(name: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('trees')
    .insert({ name, owner_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTree(id: string, updates: TreeUpdate) {
  const { data, error } = await supabase
    .from('trees')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTree(id: string) {
  const { error } = await supabase.from('trees').delete().eq('id', id)
  if (error) throw error
}

export async function togglePublic(id: string, isPublic: boolean) {
  return updateTree(id, { is_public: isPublic })
}
```

**Step 3: Create persons API**

`src/lib/api/persons.ts`:
```ts
import { supabase } from '../supabase'
import type { Database } from '../database.types'

type PersonInsert = Database['public']['Tables']['persons']['Insert']
type PersonUpdate = Database['public']['Tables']['persons']['Update']

export async function listPersons(treeId: string) {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('tree_id', treeId)
  if (error) throw error
  return data
}

export async function createPerson(person: PersonInsert) {
  const { data, error } = await supabase
    .from('persons')
    .insert(person)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePerson(id: string, updates: PersonUpdate) {
  const { data, error } = await supabase
    .from('persons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePerson(id: string) {
  const { error } = await supabase.from('persons').delete().eq('id', id)
  if (error) throw error
}

export async function uploadPhoto(treeId: string, personId: string, file: File) {
  const ext = file.name.split('.').pop()
  const path = `${treeId}/${personId}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
```

**Step 4: Create unions API**

`src/lib/api/unions.ts`:
```ts
import { supabase } from '../supabase'
import type { Database } from '../database.types'

export async function listUnions(treeId: string) {
  const { data, error } = await supabase
    .from('unions')
    .select(`
      *,
      union_members(person_id),
      union_children(person_id)
    `)
    .eq('tree_id', treeId)
  if (error) throw error
  return data
}

export async function createUnion(treeId: string) {
  const { data, error } = await supabase
    .from('unions')
    .insert({ tree_id: treeId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateUnionPosition(id: string, x: number, y: number) {
  const { error } = await supabase
    .from('unions')
    .update({ position_x: x, position_y: y })
    .eq('id', id)
  if (error) throw error
}

export async function addMember(unionId: string, personId: string) {
  const { error } = await supabase
    .from('union_members')
    .insert({ union_id: unionId, person_id: personId })
  if (error) throw error
}

export async function removeMember(unionId: string, personId: string) {
  const { error } = await supabase
    .from('union_members')
    .delete()
    .eq('union_id', unionId)
    .eq('person_id', personId)
  if (error) throw error
}

export async function addChild(unionId: string, personId: string) {
  const { error } = await supabase
    .from('union_children')
    .insert({ union_id: unionId, person_id: personId })
  if (error) throw error
}

export async function removeChild(unionId: string, personId: string) {
  const { error } = await supabase
    .from('union_children')
    .delete()
    .eq('union_id', unionId)
    .eq('person_id', personId)
  if (error) throw error
}

export async function deleteUnion(id: string) {
  const { error } = await supabase.from('unions').delete().eq('id', id)
  if (error) throw error
}
```

**Step 5: Commit**

```bash
git add src/lib/
git commit -m "feat: add Supabase client and typed API layer"
```

---

## Task 4: Auth Hook & TanStack Query Setup

**Files:**
- Create: `src/main.tsx` (update with providers)
- Create: `src/hooks/useAuth.ts`

**Step 1: Wrap app with QueryClientProvider**

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

const queryClient = new QueryClient()
const router = createRouter({ routeTree, context: { queryClient } })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
```

**Step 2: Create auth hook**

`src/hooks/useAuth.ts`:
```ts
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => supabase.auth.signOut()

  return { session, loading, signIn, signUp, signOut }
}
```

**Step 3: Commit**

```bash
git add src/
git commit -m "feat: add auth hook and TanStack Query provider"
```

---

## Task 5: TanStack Router Setup & Routes

**Files:**
- Create: `src/routes/__root.tsx`
- Create: `src/routes/index.tsx`
- Create: `src/routes/login.tsx`
- Create: `src/routes/_auth.tsx` (auth layout)
- Create: `src/routes/_auth.dashboard.tsx`
- Create: `src/routes/_auth.trees.$treeId.tsx`
- Create: `src/routes/_auth.trees.$treeId.settings.tsx`
- Create: `src/routes/t.$treeId.tsx`

**Step 1: Install TanStack Router Vite plugin**

```bash
npm install -D @tanstack/router-plugin
```

Update `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
})
```

**Step 2: Root route with auth context**

`src/routes/__root.tsx`:
```tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
})
```

**Step 3: Auth layout (guards protected routes)**

`src/routes/_auth.tsx`:
```tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: () => <Outlet />,
})
```

**Step 4: Landing page**

`src/routes/index.tsx`:
```tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Landing,
})

function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Family Tree</h1>
      <p className="text-gray-600">Document and share your family history.</p>
      <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Get started
      </Link>
    </div>
  )
}
```

**Step 5: Login page**

`src/routes/login.tsx`:
```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const action = mode === 'signin' ? signIn : signUp
    const { error } = await action(email, password)
    if (error) { setError(error.message); return }
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold text-center">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded">
          {mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
        <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="text-sm text-blue-600 underline">
          {mode === 'signin' ? 'No account? Sign up' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
```

**Step 6: Dashboard stub**

`src/routes/_auth.dashboard.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/dashboard')({
  component: () => <div>Dashboard (coming soon)</div>,
})
```

**Step 7: Tree editor stub**

`src/routes/_auth.trees.$treeId.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/trees/$treeId')({
  component: () => <div>Tree editor (coming soon)</div>,
})
```

**Step 8: Tree settings stub**

`src/routes/_auth.trees.$treeId.settings.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/trees/$treeId/settings')({
  component: () => <div>Tree settings (coming soon)</div>,
})
```

**Step 9: Public tree view stub**

`src/routes/t.$treeId.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/t/$treeId')({
  component: () => <div>Public tree view (coming soon)</div>,
})
```

**Step 10: Verify routing works**

```bash
npm run dev
```

Navigate to: `/`, `/login`, `/dashboard` (should redirect to `/login`)

**Step 11: Commit**

```bash
git add src/routes/ vite.config.ts
git commit -m "feat: add TanStack Router routes with auth guard"
```

---

## Task 6: Dashboard — My Trees

**Files:**
- Modify: `src/routes/_auth.dashboard.tsx`
- Create: `src/hooks/useTrees.ts`

**Step 1: Create TanStack Query hooks for trees**

`src/hooks/useTrees.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTree, deleteTree, listTrees, updateTree } from '../lib/api/trees'

export function useTrees() {
  return useQuery({
    queryKey: ['trees'],
    queryFn: listTrees,
  })
}

export function useCreateTree() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createTree(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trees'] }),
  })
}

export function useDeleteTree() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTree(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trees'] }),
  })
}

export function useUpdateTree() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateTree(id, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trees'] }),
  })
}
```

**Step 2: Build dashboard page**

`src/routes/_auth.dashboard.tsx`:
```tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCreateTree, useDeleteTree, useTrees } from '../hooks/useTrees'

export const Route = createFileRoute('/_auth/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { data: trees, isLoading } = useTrees()
  const createTree = useCreateTree()
  const deleteTree = useDeleteTree()
  const [newName, setNewName] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const tree = await createTree.mutateAsync(newName.trim())
    setNewName('')
    navigate({ to: '/trees/$treeId', params: { treeId: tree.id } })
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Family Trees</h1>
        <button onClick={signOut} className="text-sm text-gray-500 underline">
          Sign out
        </button>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New tree name"
          className="border rounded px-3 py-2 flex-1"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Create
        </button>
      </form>

      {isLoading && <p>Loading...</p>}

      <ul className="flex flex-col gap-2">
        {trees?.map(tree => (
          <li key={tree.id} className="flex items-center justify-between border rounded px-4 py-3">
            <Link to="/trees/$treeId" params={{ treeId: tree.id }}
              className="font-medium hover:underline">
              {tree.name}
            </Link>
            <button
              onClick={() => deleteTree.mutate(tree.id)}
              className="text-red-500 text-sm hover:underline">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Step 3: Verify dashboard works**

Sign up, create a tree, see it in the list, delete it.

**Step 4: Commit**

```bash
git add src/
git commit -m "feat: implement dashboard with tree list CRUD"
```

---

## Task 7: Person & Union Hooks

**Files:**
- Create: `src/hooks/usePersons.ts`
- Create: `src/hooks/useUnions.ts`

**Step 1: Person hooks**

`src/hooks/usePersons.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPerson, deletePerson, listPersons, updatePerson, uploadPhoto
} from '../lib/api/persons'
import type { Database } from '../lib/database.types'

type PersonInsert = Database['public']['Tables']['persons']['Insert']
type PersonUpdate = Database['public']['Tables']['persons']['Update']

export function usePersons(treeId: string) {
  return useQuery({
    queryKey: ['persons', treeId],
    queryFn: () => listPersons(treeId),
  })
}

export function useCreatePerson(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (person: Omit<PersonInsert, 'tree_id'>) =>
      createPerson({ ...person, tree_id: treeId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons', treeId] }),
  })
}

export function useUpdatePerson(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PersonUpdate }) =>
      updatePerson(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons', treeId] }),
  })
}

export function useDeletePerson(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons', treeId] }),
  })
}

export function useUploadPhoto(treeId: string) {
  return useMutation({
    mutationFn: ({ personId, file }: { personId: string; file: File }) =>
      uploadPhoto(treeId, personId, file),
  })
}
```

**Step 2: Union hooks**

`src/hooks/useUnions.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addChild, addMember, createUnion, deleteUnion,
  listUnions, removeChild, removeMember, updateUnionPosition
} from '../lib/api/unions'

export function useUnions(treeId: string) {
  return useQuery({
    queryKey: ['unions', treeId],
    queryFn: () => listUnions(treeId),
  })
}

export function useCreateUnion(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => createUnion(treeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useDeleteUnion(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUnion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useAddMember(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ unionId, personId }: { unionId: string; personId: string }) =>
      addMember(unionId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useRemoveMember(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ unionId, personId }: { unionId: string; personId: string }) =>
      removeMember(unionId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useAddChild(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ unionId, personId }: { unionId: string; personId: string }) =>
      addChild(unionId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useRemoveChild(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ unionId, personId }: { unionId: string; personId: string }) =>
      removeChild(unionId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useUpdateUnionPosition(treeId: string) {
  return useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number }) =>
      updateUnionPosition(id, x, y),
  })
}
```

**Step 3: Commit**

```bash
git add src/hooks/
git commit -m "feat: add TanStack Query hooks for persons and unions"
```

---

## Task 8: Custom React Flow Nodes

**Files:**
- Create: `src/components/PersonNode.tsx`
- Create: `src/components/UnionNode.tsx`

**Step 1: PersonNode**

`src/components/PersonNode.tsx`:
```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface PersonNodeData {
  firstName: string
  lastName?: string
  birthYear?: number
  photoUrl?: string
  isDeceased?: boolean
}

export function PersonNode({ data, selected }: NodeProps<{ data: PersonNodeData }>) {
  const name = [data.firstName, data.lastName].filter(Boolean).join(' ')
  return (
    <div className={`
      bg-white border-2 rounded-xl shadow-sm w-36 overflow-hidden cursor-pointer
      ${selected ? 'border-blue-500' : 'border-gray-200'}
      ${data.isDeceased ? 'opacity-75' : ''}
    `}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="w-full h-20 bg-gray-100 flex items-center justify-center overflow-hidden">
        {data.photoUrl ? (
          <img src={data.photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl text-gray-400">
            {data.firstName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="px-2 py-1 text-center">
        <p className="text-xs font-semibold truncate">{name}</p>
        {data.birthYear && (
          <p className="text-[10px] text-gray-500">{data.birthYear}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  )
}
```

**Step 2: UnionNode**

`src/components/UnionNode.tsx`:
```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'

export function UnionNode({ selected }: NodeProps) {
  return (
    <div className={`
      w-5 h-5 rounded-full border-2 bg-white
      ${selected ? 'border-blue-500' : 'border-gray-400'}
    `}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="target" position={Position.Right} className="!bg-gray-400" />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/PersonNode.tsx src/components/UnionNode.tsx
git commit -m "feat: add custom React Flow PersonNode and UnionNode"
```

---

## Task 9: Tree Canvas

**Files:**
- Create: `src/components/TreeCanvas.tsx`
- Modify: `src/routes/_auth.trees.$treeId.tsx`

**Step 1: TreeCanvas component**

`src/components/TreeCanvas.tsx`:
```tsx
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, type OnNodesChange,
  applyNodeChanges, useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PersonNode } from './PersonNode'
import { UnionNode } from './UnionNode'
import { usePersons } from '../hooks/usePersons'
import { useUnions } from '../hooks/useUnions'
import { useUpdatePerson } from '../hooks/usePersons'
import { useUpdateUnionPosition } from '../hooks/useUnions'

const nodeTypes = { person: PersonNode, union: UnionNode }

interface Props {
  treeId: string
  readOnly?: boolean
  onPersonClick?: (personId: string) => void
}

export function TreeCanvas({ treeId, readOnly = false, onPersonClick }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const { data: unions = [] } = useUnions(treeId)
  const updatePerson = useUpdatePerson(treeId)
  const updateUnionPos = useUpdateUnionPosition(treeId)

  const nodes: Node[] = useMemo(() => [
    ...persons.map(p => ({
      id: `person-${p.id}`,
      type: 'person' as const,
      position: { x: p.position_x, y: p.position_y },
      data: {
        firstName: p.first_name,
        lastName: p.last_name ?? undefined,
        birthYear: p.birth_date
          ? new Date(p.birth_date).getFullYear()
          : undefined,
        photoUrl: p.photo_url ?? undefined,
        isDeceased: !!p.death_date,
        personId: p.id,
      },
      draggable: !readOnly,
    })),
    ...unions.map(u => ({
      id: `union-${u.id}`,
      type: 'union' as const,
      position: { x: u.position_x, y: u.position_y },
      data: {},
      draggable: !readOnly,
    })),
  ], [persons, unions, readOnly])

  const edges: Edge[] = useMemo(() => {
    const result: Edge[] = []
    unions.forEach(u => {
      u.union_members?.forEach(({ person_id }) => {
        result.push({
          id: `member-${u.id}-${person_id}`,
          source: `person-${person_id}`,
          target: `union-${u.id}`,
        })
      })
      u.union_children?.forEach(({ person_id }) => {
        result.push({
          id: `child-${u.id}-${person_id}`,
          source: `union-${u.id}`,
          target: `person-${person_id}`,
        })
      })
    })
    return result
  }, [unions])

  const [localNodes, setLocalNodes] = useState(nodes)
  useEffect(() => { setLocalNodes(nodes) }, [nodes])

  const onNodesChange: OnNodesChange = useCallback(changes => {
    setLocalNodes(prev => applyNodeChanges(changes, prev))
  }, [])

  const onNodeDragStop = useCallback((_: unknown, node: Node) => {
    const { x, y } = node.position
    if (node.id.startsWith('person-')) {
      const personId = node.id.replace('person-', '')
      updatePerson.mutate({ id: personId, updates: { position_x: x, position_y: y } })
    } else {
      const unionId = node.id.replace('union-', '')
      updateUnionPos.mutate({ id: unionId, x, y })
    }
  }, [updatePerson, updateUnionPos])

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    if (node.id.startsWith('person-') && onPersonClick) {
      onPersonClick(node.id.replace('person-', ''))
    }
  }, [onPersonClick])

  return (
    <ReactFlow
      nodes={localNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={readOnly ? undefined : onNodesChange}
      onNodeDragStop={readOnly ? undefined : onNodeDragStop}
      onNodeClick={onNodeClick}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  )
}
```

**Step 2: Wire up tree editor route**

`src/routes/_auth.trees.$treeId.tsx`:
```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { TreeCanvas } from '../components/TreeCanvas'
import { PersonDetailPanel } from '../components/PersonDetailPanel'
import { AddPersonModal } from '../components/AddPersonModal'

export const Route = createFileRoute('/_auth/trees/$treeId')({
  component: TreeEditor,
})

function TreeEditor() {
  const { treeId } = Route.useParams()
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [showAddPerson, setShowAddPerson] = useState(false)

  return (
    <div className="flex h-screen flex-col">
      <nav className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <Link to="/dashboard" className="text-sm text-blue-600 underline">← Dashboard</Link>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddPerson(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">
            Add person
          </button>
          <Link to="/trees/$treeId/settings" params={{ treeId }}
            className="border px-3 py-1.5 rounded text-sm">
            Settings
          </Link>
        </div>
      </nav>
      <div className="flex-1 relative">
        <TreeCanvas
          treeId={treeId}
          onPersonClick={setSelectedPersonId}
        />
        {selectedPersonId && (
          <PersonDetailPanel
            treeId={treeId}
            personId={selectedPersonId}
            onClose={() => setSelectedPersonId(null)}
          />
        )}
      </div>
      {showAddPerson && (
        <AddPersonModal
          treeId={treeId}
          onClose={() => setShowAddPerson(false)}
        />
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/TreeCanvas.tsx src/routes/_auth.trees.\$treeId.tsx
git commit -m "feat: implement interactive tree canvas with React Flow"
```

---

## Task 10: AddPersonModal & PersonDetailPanel

**Files:**
- Create: `src/components/AddPersonModal.tsx`
- Create: `src/components/PersonDetailPanel.tsx`

**Step 1: AddPersonModal**

`src/components/AddPersonModal.tsx`:
```tsx
import { useState } from 'react'
import { useCreatePerson } from '../hooks/usePersons'
import type { Database } from '../lib/database.types'

type PersonInsert = Database['public']['Tables']['persons']['Insert']

interface Props {
  treeId: string
  onClose: () => void
}

export function AddPersonModal({ treeId, onClose }: Props) {
  const createPerson = useCreatePerson(treeId)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    birth_date: '',
    is_birth_year_only: false,
    death_date: '',
    is_death_year_only: false,
    notes: '',
  })

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Omit<PersonInsert, 'tree_id'> = {
      first_name: form.first_name,
      last_name: form.last_name || null,
      gender: form.gender || null,
      birth_date: form.birth_date || null,
      is_birth_year_only: form.is_birth_year_only,
      death_date: form.death_date || null,
      is_death_year_only: form.is_death_year_only,
      notes: form.notes || null,
    }
    await createPerson.mutateAsync(payload)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl p-6 w-96 flex flex-col gap-3">
        <h2 className="text-lg font-bold">Add person</h2>
        <input required placeholder="First name" value={form.first_name}
          onChange={e => set('first_name', e.target.value)}
          className="border rounded px-3 py-2" />
        <input placeholder="Last name" value={form.last_name}
          onChange={e => set('last_name', e.target.value)}
          className="border rounded px-3 py-2" />
        <select value={form.gender} onChange={e => set('gender', e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">Gender (optional)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <div className="flex gap-2 items-center">
          <input type="date" value={form.birth_date}
            onChange={e => set('birth_date', e.target.value)}
            className="border rounded px-3 py-2 flex-1" placeholder="Birth date" />
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={form.is_birth_year_only}
              onChange={e => set('is_birth_year_only', e.target.checked)} />
            Year only
          </label>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" value={form.death_date}
            onChange={e => set('death_date', e.target.value)}
            className="border rounded px-3 py-2 flex-1" placeholder="Death date" />
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={form.is_death_year_only}
              onChange={e => set('is_death_year_only', e.target.checked)} />
            Year only
          </label>
        </div>
        <textarea placeholder="Notes" value={form.notes}
          onChange={e => set('notes', e.target.value)}
          className="border rounded px-3 py-2 resize-none h-20" />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Add
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: PersonDetailPanel**

`src/components/PersonDetailPanel.tsx`:
```tsx
import { usePersons, useUpdatePerson, useDeletePerson, useUploadPhoto } from '../hooks/usePersons'
import { useState, useRef } from 'react'
import type { Database } from '../lib/database.types'

type Person = Database['public']['Tables']['persons']['Row']

interface Props {
  treeId: string
  personId: string
  onClose: () => void
}

function formatDate(date: string | null, yearOnly: boolean | null) {
  if (!date) return '—'
  return yearOnly ? new Date(date).getFullYear().toString() : date
}

export function PersonDetailPanel({ treeId, personId, onClose }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const updatePerson = useUpdatePerson(treeId)
  const deletePerson = useDeletePerson(treeId)
  const uploadPhoto = useUploadPhoto(treeId)
  const person = persons.find(p => p.id === personId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)

  if (!person) return null

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadPhoto.mutateAsync({ personId: person!.id, file })
    await updatePerson.mutateAsync({ id: person!.id, updates: { photo_url: url } })
  }

  async function handleDelete() {
    if (!confirm('Delete this person?')) return
    await deletePerson.mutateAsync(person!.id)
    onClose()
  }

  return (
    <aside className="absolute right-0 top-0 h-full w-80 bg-white border-l shadow-lg p-4 flex flex-col gap-3 overflow-y-auto z-10">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">
          {person.first_name} {person.last_name}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-100 cursor-pointer"
        onClick={() => fileRef.current?.click()}>
        {person.photo_url
          ? <img src={person.photo_url} alt="" className="w-full h-full object-cover" />
          : <span className="absolute inset-0 flex items-center justify-center text-3xl text-gray-400">
              {person.first_name.charAt(0)}
            </span>
        }
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={handlePhotoChange} />
      </div>

      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
        <dt className="text-gray-500">Gender</dt>
        <dd>{person.gender ?? '—'}</dd>
        <dt className="text-gray-500">Born</dt>
        <dd>{formatDate(person.birth_date, person.is_birth_year_only)}</dd>
        <dt className="text-gray-500">Died</dt>
        <dd>{formatDate(person.death_date, person.is_death_year_only)}</dd>
      </dl>

      {person.notes && (
        <p className="text-sm text-gray-600 border-t pt-2">{person.notes}</p>
      )}

      <div className="mt-auto flex gap-2">
        <button onClick={() => setEditing(true)}
          className="flex-1 border rounded py-1.5 text-sm">
          Edit
        </button>
        <button onClick={handleDelete}
          className="flex-1 border border-red-300 text-red-600 rounded py-1.5 text-sm">
          Delete
        </button>
      </div>
    </aside>
  )
}
```

Note: Full edit form is an extension of AddPersonModal — omit for now, add in a follow-up.

**Step 3: Commit**

```bash
git add src/components/
git commit -m "feat: add AddPersonModal and PersonDetailPanel"
```

---

## Task 11: Tree Settings & Public Sharing

**Files:**
- Modify: `src/routes/_auth.trees.$treeId.settings.tsx`
- Create: `src/routes/t.$treeId.tsx`

**Step 1: Tree settings page**

`src/routes/_auth.trees.$treeId.settings.tsx`:
```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTree, updateTree, togglePublic } from '../../lib/api/trees'

export const Route = createFileRoute('/_auth/trees/$treeId/settings')({
  component: TreeSettings,
})

function TreeSettings() {
  const { treeId } = Route.useParams()
  const qc = useQueryClient()
  const { data: tree } = useQuery({
    queryKey: ['tree', treeId],
    queryFn: () => getTree(treeId),
  })
  const [name, setName] = useState(tree?.name ?? '')
  useEffect(() => { if (tree) setName(tree.name) }, [tree])

  const rename = useMutation({
    mutationFn: () => updateTree(treeId, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tree', treeId] }),
  })

  const toggle = useMutation({
    mutationFn: () => togglePublic(treeId, !tree?.is_public),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tree', treeId] }),
  })

  const shareUrl = `${window.location.origin}/t/${treeId}`

  return (
    <div className="max-w-lg mx-auto p-6 flex flex-col gap-6">
      <Link to="/trees/$treeId" params={{ treeId }} className="text-sm text-blue-600 underline">
        ← Back to tree
      </Link>
      <h1 className="text-2xl font-bold">Tree settings</h1>

      <section className="flex flex-col gap-2">
        <label className="font-medium">Name</label>
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)}
            className="border rounded px-3 py-2 flex-1" />
          <button onClick={() => rename.mutate()}
            className="bg-blue-600 text-white px-4 rounded">Save</button>
        </div>
      </section>

      <section className="flex items-center justify-between border rounded p-4">
        <div>
          <p className="font-medium">Public sharing</p>
          <p className="text-sm text-gray-500">Anyone with the link can view this tree</p>
        </div>
        <button onClick={() => toggle.mutate()}
          className={`w-12 h-6 rounded-full transition-colors ${tree?.is_public ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform m-0.5
            ${tree?.is_public ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </section>

      {tree?.is_public && (
        <section className="flex flex-col gap-2">
          <label className="font-medium">Share link</label>
          <div className="flex gap-2">
            <input readOnly value={shareUrl} className="border rounded px-3 py-2 flex-1 text-sm" />
            <button onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="border rounded px-3 py-2 text-sm">
              Copy
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
```

**Step 2: Public read-only tree view**

`src/routes/t.$treeId.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getTree } from '../lib/api/trees'
import { TreeCanvas } from '../components/TreeCanvas'

export const Route = createFileRoute('/t/$treeId')({
  component: PublicTreeView,
})

function PublicTreeView() {
  const { treeId } = Route.useParams()
  const { data: tree, isLoading, error } = useQuery({
    queryKey: ['tree', treeId],
    queryFn: () => getTree(treeId),
  })

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  if (error || !tree?.is_public) return (
    <div className="flex h-screen items-center justify-center text-gray-500">
      Tree not found or not public.
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      <header className="px-4 py-2 border-b bg-white flex items-center justify-between">
        <h1 className="font-bold">{tree.name}</h1>
        <span className="text-xs text-gray-400">Read-only view</span>
      </header>
      <div className="flex-1">
        <TreeCanvas treeId={treeId} readOnly />
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/routes/
git commit -m "feat: add tree settings with public sharing and read-only public view"
```

---

## Task 12: AddUnionModal

**Files:**
- Create: `src/components/AddUnionModal.tsx`
- Modify: `src/routes/_auth.trees.$treeId.tsx` (add union button)

**Step 1: AddUnionModal**

`src/components/AddUnionModal.tsx`:
```tsx
import { useState } from 'react'
import { usePersons } from '../hooks/usePersons'
import { useCreateUnion, useAddMember } from '../hooks/useUnions'

interface Props {
  treeId: string
  onClose: () => void
}

export function AddUnionModal({ treeId, onClose }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const createUnion = useCreateUnion(treeId)
  const addMember = useAddMember(treeId)
  const [parent1, setParent1] = useState('')
  const [parent2, setParent2] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const union = await createUnion.mutateAsync()
    if (parent1) await addMember.mutateAsync({ unionId: union.id, personId: parent1 })
    if (parent2 && parent2 !== parent1) await addMember.mutateAsync({ unionId: union.id, personId: parent2 })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4">
        <h2 className="text-lg font-bold">Create family unit</h2>
        <select value={parent1} onChange={e => setParent1(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">Parent 1 (optional)</option>
          {persons.map(p => (
            <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
          ))}
        </select>
        <select value={parent2} onChange={e => setParent2(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">Parent 2 (optional)</option>
          {persons.map(p => (
            <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
          ))}
        </select>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Create
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: Add union button to tree editor toolbar**

In `src/routes/_auth.trees.$treeId.tsx`, add state and button:
```tsx
const [showAddUnion, setShowAddUnion] = useState(false)

// In toolbar, after "Add person" button:
<button onClick={() => setShowAddUnion(true)}
  className="border px-3 py-1.5 rounded text-sm">
  Add union
</button>

// After AddPersonModal:
{showAddUnion && (
  <AddUnionModal treeId={treeId} onClose={() => setShowAddUnion(false)} />
)}
```

**Step 3: Commit**

```bash
git add src/components/AddUnionModal.tsx src/routes/
git commit -m "feat: add union creation modal"
```

---

## Verification Checklist

- [ ] Auth: sign up → redirects to dashboard; sign in; sign out → redirects to landing
- [ ] Auth guard: visit `/dashboard` without session → redirect to `/login`
- [ ] Dashboard: create tree → appears in list; delete tree → removed
- [ ] Canvas: add 2 persons → appear as nodes; create union between them → connector node + edges appear
- [ ] Union children: open AddUnionModal, create union → then add a person as child (via detail panel or union context menu)
- [ ] Drag: drag person node → refresh page → same position
- [ ] Photo: click person avatar in detail panel → upload image → appears in node card
- [ ] Settings: rename tree → updated; toggle public → share link appears
- [ ] Public view: open `/t/:treeId` in incognito when public → tree visible, no edit buttons
- [ ] Private: set `is_public = false` → `/t/:treeId` in incognito → "not found or not public"
