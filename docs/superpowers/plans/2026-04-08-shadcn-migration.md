# shadcn/ui Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all raw HTML interactive elements with shadcn/ui primitives across the entire project, adding `cursor-pointer` everywhere interactive.

**Architecture:** Install shadcn/ui (Tailwind v4 mode), generate Button/Input/Textarea/Select/Label/Dialog/Sheet components, then migrate each route/component file to use them. Modals become `Dialog`, side panels become `Sheet`. `Button` handles `cursor-pointer` automatically via its base styles.

**Tech Stack:** React 19, Tailwind v4, shadcn/ui (Radix UI primitives), TanStack Router, pnpm

---

## File Map

| File | Change |
|---|---|
| `src/index.css` | shadcn init adds CSS variable layer |
| `src/lib/utils.ts` | shadcn init creates `cn()` helper |
| `src/components/ui/` | shadcn generates: button, input, textarea, select, label, dialog, sheet |
| `src/routes/login.tsx` | `<input>` → Input, `<button>` → Button |
| `src/routes/_auth.dashboard.tsx` | `<input>` → Input, `<button>` → Button, `<Link>` as button → Button asChild |
| `src/routes/_auth.trees.$treeId.tsx` | nav `<button>`/`<Link>` → Button; modals/panels always-rendered with `open` prop |
| `src/routes/_auth.trees.$treeId.settings.tsx` | `<input>` → Input, `<button>` → Button, `<label>` → Label; toggle gets `cursor-pointer` |
| `src/components/AddPersonModal.tsx` | overlay div → Dialog; inputs/select/textarea → shadcn primitives; add `open` prop |
| `src/components/AddUnionModal.tsx` | overlay div → Dialog; selects → shadcn Select; add `open` prop |
| `src/components/PersonDetailPanel.tsx` | absolute panel → Sheet; delete button → Button destructive; add `open` prop |
| `src/components/UnionDetailPanel.tsx` | fixed panel → Sheet; ↑↓ buttons → Button ghost; add `open` prop |

---

## Task 1: Initialize shadcn/ui

**Files:**
- Modify: `src/index.css` (CSS variables added by init)
- Create: `src/lib/utils.ts`, `components.json`
- Create: `src/components/ui/button.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `label.tsx`, `dialog.tsx`, `sheet.tsx`

- [ ] **Step 1: Run shadcn init**

```bash
pnpm dlx shadcn@latest init -d
```

When prompted (if interactive):
- Style: Default
- Base color: Neutral
- CSS variables: Yes

This creates `components.json`, updates `src/index.css` with CSS variables, installs `class-variance-authority clsx tailwind-merge lucide-react`, creates `src/lib/utils.ts`.

- [ ] **Step 2: Add all needed components**

```bash
pnpm dlx shadcn@latest add button input textarea select label dialog sheet
```

This creates `src/components/ui/{button,input,textarea,select,label,dialog,sheet}.tsx` and installs the required Radix UI packages.

- [ ] **Step 3: Verify files exist**

```bash
ls src/components/ui/
```

Expected output includes: `button.tsx input.tsx textarea.tsx select.tsx label.tsx dialog.tsx sheet.tsx utils.ts` (utils may be in `src/lib/`).

Also verify `src/lib/utils.ts` exists with a `cn` export:

```bash
cat src/lib/utils.ts
```

Expected: file exports `cn` using `clsx` and `tailwind-merge`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: initialize shadcn/ui with button, input, textarea, select, label, dialog, sheet"
```

---

## Task 2: Migrate login.tsx

**Files:**
- Modify: `src/routes/login.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) throw redirect({ to: '/dashboard' })
  },
  component: LoginPage,
})

function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const action = mode === 'signin' ? signIn : signUp
    const { error } = await action(email, password)
    setIsSubmitting(false)
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
        <Input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </Button>
        <Button
          type="button"
          variant="link"
          disabled={isSubmitting}
          className="text-sm"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'No account? Sign up' : 'Have an account? Sign in'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/login`. Verify:
- Inputs look consistent with shadcn styling
- Buttons show pointer cursor on hover
- Sign in / sign up flow still works

- [ ] **Step 3: Commit**

```bash
git add src/routes/login.tsx
git commit -m "feat: migrate login page to shadcn Button and Input"
```

---

## Task 3: Migrate dashboard.tsx

**Files:**
- Modify: `src/routes/_auth.dashboard.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCreateTree, useDeleteTree, useTrees } from '@/hooks/useTrees'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreateError(null)
    try {
      const tree = await createTree.mutateAsync(newName.trim())
      setNewName('')
      navigate({ to: '/trees/$treeId', params: { treeId: tree.id } })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create tree')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Family Trees</h1>
        <Button variant="link" size="sm" className="text-gray-500" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>

      {createError && <p className="text-red-600 text-sm mb-2">{createError}</p>}
      {deleteTree.isError && (
        <p className="text-red-600 text-sm mb-2">Failed to delete tree. Please try again.</p>
      )}

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New tree name"
          className="flex-1"
        />
        <Button type="submit" disabled={createTree.isPending}>
          {createTree.isPending ? 'Creating…' : 'Create'}
        </Button>
      </form>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      <ul className="flex flex-col gap-2">
        {trees?.map(tree => (
          <li key={tree.id} className="flex items-center justify-between border rounded px-4 py-3">
            <Button asChild variant="link" className="font-medium p-0 h-auto">
              <Link to="/trees/$treeId" params={{ treeId: tree.id }}>
                {tree.name}
              </Link>
            </Button>
            <Button
              variant="link"
              size="sm"
              className="text-red-500"
              onClick={() => deleteTree.mutate(tree.id)}
              disabled={deleteTree.isPending}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/dashboard`. Verify:
- Sign out, Create, Delete buttons have pointer cursor
- Tree name links navigate correctly
- Create tree flow works

- [ ] **Step 3: Commit**

```bash
git add src/routes/_auth.dashboard.tsx
git commit -m "feat: migrate dashboard to shadcn Button and Input"
```

---

## Task 4: Migrate settings page

**Files:**
- Modify: `src/routes/_auth.trees.$treeId.settings.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUpdateTree } from '@/hooks/useTrees'
import { getTree, togglePublic } from '@/lib/api/trees'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  const updateTree = useUpdateTree()
  const [name, setName] = useState('')
  const [togglePending, setTogglePending] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (tree) setName(tree.name)
  }, [tree])

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name === tree?.name) return
    setRenameError(null)
    try {
      await updateTree.mutateAsync({ id: treeId, name: name.trim() })
      qc.invalidateQueries({ queryKey: ['tree', treeId] })
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Failed to rename tree')
    }
  }

  async function handleToggle() {
    if (!tree) return
    setToggleError(null)
    setTogglePending(true)
    try {
      await togglePublic(treeId, !tree.is_public)
      qc.invalidateQueries({ queryKey: ['tree', treeId] })
      qc.invalidateQueries({ queryKey: ['trees'] })
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setTogglePending(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(`${window.location.origin}/t/${treeId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto p-6 flex flex-col gap-6">
      <Button asChild variant="link" size="sm" className="self-start p-0">
        <Link to="/trees/$treeId" params={{ treeId }}>← Back to tree</Link>
      </Button>
      <h1 className="text-2xl font-bold">Tree settings</h1>

      {/* Rename */}
      <section className="flex flex-col gap-2">
        <Label htmlFor="tree-name" className="font-medium">Name</Label>
        <form onSubmit={handleRename} className="flex gap-2">
          <Input id="tree-name" value={name} onChange={e => setName(e.target.value)} className="flex-1" />
          <Button type="submit" disabled={updateTree.isPending}>Save</Button>
        </form>
        {renameError && <p className="text-red-600 text-sm">{renameError}</p>}
      </section>

      {/* Public toggle */}
      <section className="flex flex-col gap-2 border rounded p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Public sharing</p>
            <p className="text-sm text-gray-500">Anyone with the link can view this tree</p>
          </div>
          <button
            onClick={handleToggle}
            disabled={togglePending}
            aria-label={tree?.is_public ? 'Make private' : 'Make public'}
            className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${tree?.is_public ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tree?.is_public ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
        {toggleError && <p className="text-red-600 text-sm">{toggleError}</p>}
      </section>

      {/* Share link */}
      {tree?.is_public && (
        <section className="flex flex-col gap-2">
          <Label className="font-medium">Share link</Label>
          <div className="flex gap-2">
            <Input readOnly value={`${window.location.origin}/t/${treeId}`} className="flex-1 text-sm bg-gray-50" />
            <Button variant="outline" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/trees/<id>/settings`. Verify:
- Back link, Save, Copy buttons have pointer cursor
- Toggle switch still has pointer cursor
- Rename and toggle functionality work

- [ ] **Step 3: Commit**

```bash
git add src/routes/_auth.trees.$treeId.settings.tsx
git commit -m "feat: migrate settings page to shadcn Button, Input, Label"
```

---

## Task 5: Migrate AddPersonModal to Dialog

**Files:**
- Modify: `src/components/AddPersonModal.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { useState } from 'react'
import { useCreatePerson } from '@/hooks/usePersons'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

type PersonInsert = Database['public']['Tables']['persons']['Insert']

interface Props {
  treeId: string
  open: boolean
  onClose: () => void
}

export function AddPersonModal({ treeId, open, onClose }: Props) {
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
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload: Omit<PersonInsert, 'tree_id'> = {
      first_name: form.first_name,
      last_name: form.last_name || null,
      gender: (form.gender || null) as PersonInsert['gender'],
      birth_date: form.birth_date || null,
      is_birth_year_only: form.is_birth_year_only,
      death_date: form.death_date || null,
      is_death_year_only: form.is_death_year_only,
      notes: form.notes || null,
    }
    try {
      await createPerson.mutateAsync(payload)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add person')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-96 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Input required placeholder="First name *" value={form.first_name}
            onChange={e => set('first_name', e.target.value)} />
          <Input placeholder="Last name" value={form.last_name}
            onChange={e => set('last_name', e.target.value)} />
          <Select
            value={form.gender || undefined}
            onValueChange={(v) => set('gender', v as typeof form.gender)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Gender (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 items-center">
            <Input type="date" value={form.birth_date}
              onChange={e => set('birth_date', e.target.value)}
              className="flex-1" />
            <Label className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input type="checkbox" checked={form.is_birth_year_only}
                onChange={e => set('is_birth_year_only', e.target.checked)} />
              Year only
            </Label>
          </div>
          <div className="flex gap-2 items-center">
            <Input type="date" value={form.death_date}
              onChange={e => set('death_date', e.target.value)}
              className="flex-1" />
            <Label className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input type="checkbox" checked={form.is_death_year_only}
                onChange={e => set('is_death_year_only', e.target.checked)} />
              Year only
            </Label>
          </div>
          <Textarea placeholder="Notes" value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className="resize-none h-20" />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPerson.isPending}>
              {createPerson.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Update parent to pass `open` prop**

In `src/routes/_auth.trees.$treeId.tsx`, change:

```tsx
// BEFORE (conditional render)
{showAddPerson && (
  <AddPersonModal treeId={treeId} onClose={() => setShowAddPerson(false)} />
)}

// AFTER (always rendered, controlled by open)
<AddPersonModal
  treeId={treeId}
  open={showAddPerson}
  onClose={() => setShowAddPerson(false)}
/>
```

- [ ] **Step 3: Verify in browser**

Click "Add person". Verify:
- Dialog opens with backdrop
- All inputs, select, textarea render with shadcn styling
- Buttons have pointer cursor
- Cancel and backdrop click both close the dialog
- Adding a person still works

- [ ] **Step 4: Commit**

```bash
git add src/components/AddPersonModal.tsx src/routes/_auth.trees.\$treeId.tsx
git commit -m "feat: migrate AddPersonModal to shadcn Dialog"
```

---

## Task 6: Migrate AddUnionModal to Dialog

**Files:**
- Modify: `src/components/AddUnionModal.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { useState } from 'react'
import { usePersons } from '@/hooks/usePersons'
import { useCreateUnion, useAddMember, useDeleteUnion } from '@/hooks/useUnions'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  treeId: string
  open: boolean
  onClose: () => void
}

export function AddUnionModal({ treeId, open, onClose }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const createUnion = useCreateUnion(treeId)
  const addMember = useAddMember(treeId)
  const deleteUnion = useDeleteUnion(treeId)
  const [parent1, setParent1] = useState('')
  const [parent2, setParent2] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (parent1 && parent2 && parent1 === parent2) {
      setError('Both parents cannot be the same person')
      return
    }
    setError(null)
    try {
      const union = await createUnion.mutateAsync()
      try {
        if (parent1) await addMember.mutateAsync({ unionId: union.id, personId: parent1 })
        if (parent2 && parent2 !== parent1) {
          await addMember.mutateAsync({ unionId: union.id, personId: parent2 })
        }
      } catch (err) {
        try { await deleteUnion.mutateAsync(union.id) } catch { /* best-effort */ }
        throw err
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create union')
    }
  }

  const isPending = createUnion.isPending || addMember.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-80">
        <DialogHeader>
          <DialogTitle>Create family unit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Select value={parent1 || undefined} onValueChange={setParent1}>
            <SelectTrigger>
              <SelectValue placeholder="Parent 1 (optional)" />
            </SelectTrigger>
            <SelectContent>
              {persons.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.first_name}{p.last_name ? ' ' + p.last_name : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={parent2 || undefined} onValueChange={setParent2}>
            <SelectTrigger>
              <SelectValue placeholder="Parent 2 (optional)" />
            </SelectTrigger>
            <SelectContent>
              {persons.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.first_name}{p.last_name ? ' ' + p.last_name : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Update parent to pass `open` prop**

In `src/routes/_auth.trees.$treeId.tsx`, change:

```tsx
// BEFORE (conditional render)
{showAddUnion && (
  <AddUnionModal treeId={treeId} onClose={() => setShowAddUnion(false)} />
)}

// AFTER (always rendered, controlled by open)
<AddUnionModal
  treeId={treeId}
  open={showAddUnion}
  onClose={() => setShowAddUnion(false)}
/>
```

- [ ] **Step 3: Verify in browser**

Click "Add union". Verify:
- Dialog opens with backdrop
- Parent selects show persons from the tree
- Cancel and backdrop click close the dialog
- Creating a union still works

- [ ] **Step 4: Commit**

```bash
git add src/components/AddUnionModal.tsx src/routes/_auth.trees.\$treeId.tsx
git commit -m "feat: migrate AddUnionModal to shadcn Dialog"
```

---

## Task 7: Migrate PersonDetailPanel to Sheet

**Files:**
- Modify: `src/components/PersonDetailPanel.tsx`
- Modify: `src/routes/_auth.trees.$treeId.tsx`

- [ ] **Step 1: Replace PersonDetailPanel.tsx**

```tsx
import { useRef, useState } from 'react'
import { usePersons, useUpdatePerson, useDeletePerson, useUploadPhoto } from '@/hooks/usePersons'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface Props {
  treeId: string
  personId: string | null
  open: boolean
  onClose: () => void
}

function formatDate(date: string | null, yearOnly: boolean | null) {
  if (!date) return '—'
  if (yearOnly) return date.slice(0, 4)
  return new Date(date).toLocaleDateString()
}

export function PersonDetailPanel({ treeId, personId, open, onClose }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const updatePerson = useUpdatePerson(treeId)
  const deletePerson = useDeletePerson(treeId)
  const uploadPhoto = useUploadPhoto(treeId)
  const person = persons.find(p => p.id === personId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!person) return
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(null)
    try {
      const url = await uploadPhoto.mutateAsync({ personId: person.id, file })
      await updatePerson.mutateAsync({ id: person.id, updates: { photo_url: url } })
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload photo')
    }
  }

  async function handleDelete() {
    if (!person) return
    if (!confirm(`Delete ${person.first_name}${person.last_name ? ' ' + person.last_name : ''}?`)) return
    setDeleteError(null)
    try {
      await deletePerson.mutateAsync(person.id)
      onClose()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const name = person ? [person.first_name, person.last_name].filter(Boolean).join(' ') : ''

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        {person && (
          <>
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle className="font-bold text-base truncate">{name}</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Photo */}
              <div
                className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-100 cursor-pointer ring-2 ring-offset-2 ring-gray-200 hover:ring-blue-400 transition-all"
                onClick={() => fileRef.current?.click()}
                title="Click to change photo"
              >
                {person.photo_url
                  ? <img src={person.photo_url} alt={name} className="w-full h-full object-cover" />
                  : <span className="absolute inset-0 flex items-center justify-center text-3xl text-gray-400 select-none">
                      {person.first_name.charAt(0).toUpperCase()}
                    </span>
                }
                {uploadPhoto.isPending && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-xs">Uploading…</span>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden" onChange={handlePhotoChange} />
              </div>
              {photoError && <p className="text-red-600 text-xs text-center">{photoError}</p>}

              {/* Details */}
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-gray-500">Gender</dt>
                <dd className="capitalize">{person.gender ?? '—'}</dd>
                <dt className="text-gray-500">Born</dt>
                <dd>{formatDate(person.birth_date, person.is_birth_year_only)}</dd>
                <dt className="text-gray-500">Died</dt>
                <dd>{formatDate(person.death_date, person.is_death_year_only)}</dd>
              </dl>

              {person.notes && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{person.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t p-4 flex flex-col gap-2">
              {deleteError && <p className="text-red-600 text-xs">{deleteError}</p>}
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
                disabled={deletePerson.isPending}
              >
                {deletePerson.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Update parent to always render with open prop**

In `src/routes/_auth.trees.$treeId.tsx`, change the PersonDetailPanel usage:

```tsx
// BEFORE
{selectedPersonId && (
  <PersonDetailPanel
    treeId={treeId}
    personId={selectedPersonId}
    onClose={() => setSelectedPersonId(null)}
  />
)}

// AFTER
<PersonDetailPanel
  treeId={treeId}
  personId={selectedPersonId}
  open={!!selectedPersonId}
  onClose={() => setSelectedPersonId(null)}
/>
```

- [ ] **Step 3: Verify in browser**

Click a person node on the canvas. Verify:
- Sheet slides in from the right
- Person info displays correctly
- Photo click-to-upload still works
- Delete button is red/destructive, has pointer cursor
- Clicking outside the sheet or the X button closes it

- [ ] **Step 4: Commit**

```bash
git add src/components/PersonDetailPanel.tsx src/routes/_auth.trees.\$treeId.tsx
git commit -m "feat: migrate PersonDetailPanel to shadcn Sheet"
```

---

## Task 8: Migrate UnionDetailPanel to Sheet

**Files:**
- Modify: `src/components/UnionDetailPanel.tsx`
- Modify: `src/routes/_auth.trees.$treeId.tsx`

- [ ] **Step 1: Replace UnionDetailPanel.tsx**

```tsx
import { usePersons } from '@/hooks/usePersons'
import { useUnions, useUpdateChildPosition } from '@/hooks/useUnions'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type Props = {
  unionId: string | null
  treeId: string
  open: boolean
  onClose: () => void
}

export function UnionDetailPanel({ unionId, treeId, open, onClose }: Props) {
  const { data: unions } = useUnions(treeId)
  const { data: persons } = usePersons(treeId)
  const updatePos = useUpdateChildPosition(treeId)

  const union = unions?.find(u => u.id === unionId)
  const personMap = new Map(persons?.map(p => [p.id, p]) ?? [])

  const members = union?.union_members.map(m => personMap.get(m.person_id)).filter(Boolean) ?? []
  const children = union
    ? [...union.union_children]
        .sort((a, b) => a.position - b.position)
        .map(c => ({ ...c, person: personMap.get(c.person_id) }))
        .filter(c => c.person)
    : []

  async function move(personId: string, fromPos: number, toPos: number) {
    const swap = union!.union_children.find(c => c.position === toPos)
    if (!swap) return
    await updatePos.mutateAsync({ unionId: union!.id, personId, position: toPos })
    await updatePos.mutateAsync({ unionId: union!.id, personId: swap.person_id, position: fromPos })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        {union && (
          <>
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Family Unit</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <section>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Parents</h3>
                {members.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No parents</p>
                ) : (
                  <ul className="space-y-1">
                    {members.map(p => (
                      <li key={p!.id} className="text-sm">{p!.first_name} {p!.last_name ?? ''}</li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Children</h3>
                {children.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No children</p>
                ) : (
                  <ul className="space-y-2">
                    {children.map((c, i) => (
                      <li key={c.person_id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm">
                          {c.person!.first_name} {c.person!.last_name ?? ''}
                          {c.person!.birth_date && (
                            <span className="text-gray-400 ml-1">
                              b. {c.person!.is_birth_year_only
                                ? c.person!.birth_date.slice(0, 4)
                                : c.person!.birth_date}
                            </span>
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(c.person_id, c.position, children[i - 1].position)}
                          disabled={i === 0 || updatePos.isPending}
                          aria-label="Move up"
                          className="h-7 w-7"
                        >↑</Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(c.person_id, c.position, children[i + 1].position)}
                          disabled={i === children.length - 1 || updatePos.isPending}
                          aria-label="Move down"
                          className="h-7 w-7"
                        >↓</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Update parent to pass `open` prop**

In `src/routes/_auth.trees.$treeId.tsx`, change the UnionDetailPanel usage:

```tsx
// BEFORE
<UnionDetailPanel
  unionId={selectedUnionId}
  treeId={treeId}
  onClose={() => setSelectedUnionId(null)}
/>

// AFTER
<UnionDetailPanel
  unionId={selectedUnionId}
  treeId={treeId}
  open={!!selectedUnionId}
  onClose={() => setSelectedUnionId(null)}
/>
```

- [ ] **Step 3: Verify in browser**

Click a union node. Verify:
- Sheet slides in from the right
- Parents and children list correctly
- ↑/↓ buttons have pointer cursor and work for reordering
- Clicking outside or the X button closes the sheet

- [ ] **Step 4: Migrate nav in _auth.trees.$treeId.tsx**

At this point `_auth.trees.$treeId.tsx` still has raw `<button>` elements in the nav bar. Replace the nav:

```tsx
// Add to imports
import { Button } from '@/components/ui/button'

// Replace nav contents:
<nav className="flex items-center justify-between px-4 py-2 border-b bg-white z-10">
  <Button asChild variant="link" size="sm" className="p-0">
    <Link to="/dashboard">← Dashboard</Link>
  </Button>
  <div className="flex gap-2">
    <Button onClick={() => setShowAddPerson(true)}>
      Add person
    </Button>
    <Button variant="outline" onClick={() => setShowAddUnion(true)}>
      Add union
    </Button>
    <Button asChild variant="outline" size="sm">
      <Link to="/trees/$treeId/settings" params={{ treeId }}>
        Settings
      </Link>
    </Button>
  </div>
</nav>
```

- [ ] **Step 5: Verify the full tree editor**

Navigate to `/trees/<id>`. Verify:
- Nav buttons have pointer cursor
- All four interactive pieces work: add person, add union, person panel, union panel
- No TypeScript errors: `pnpm build`

```bash
pnpm build
```

Expected: build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/UnionDetailPanel.tsx src/routes/_auth.trees.\$treeId.tsx
git commit -m "feat: migrate UnionDetailPanel to shadcn Sheet and finalize tree editor nav"
```
