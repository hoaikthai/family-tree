# User Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `UserSettingsSheet` (gear icon) accessible from the dashboard and tree editor that lets users save name order, date format, and language preferences to Supabase, applied across the app.

**Architecture:** A `user_preferences` table in Supabase stores one row per user. A `useUserPreferences` TanStack Query hook fetches and upserts preferences. The `UserSettingsSheet` component wraps the existing shadcn `Sheet` and is triggered locally from dashboard and tree editor headers. Two pure utility functions (`formatName`, `formatDate`) replace the current ad-hoc name/date formatting throughout the app.

**Tech Stack:** React 19, TypeScript, TanStack Query v5, TanStack Router, Supabase (postgres + RLS), shadcn Sheet, base-ui Select, lucide-react icons

> **Note:** This project has no test runner configured (no vitest/jest in devDependencies). TDD steps are omitted. Add tests when a runner is set up.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/formatName.ts` | Pure `formatName(firstName, lastName, nameOrder)` utility |
| Create | `src/lib/formatDate.ts` | Pure `formatDate(date, yearOnly, format)` utility |
| Create | `src/lib/api/userPreferences.ts` | Supabase fetch + upsert for `user_preferences` |
| Create | `src/hooks/useUserPreferences.ts` | TanStack Query hooks wrapping the API |
| Create | `src/components/UserSettingsSheet.tsx` | Sheet UI with three Select dropdowns |
| Modify | `src/lib/database.types.ts` | Add `user_preferences` table types |
| Modify | `src/components/PersonNode.tsx` | Use `formatName` with prefs |
| Modify | `src/components/PersonDetailPanel.tsx` | Use `formatName` + `formatDate` with prefs |
| Modify | `src/routes/_auth.dashboard.tsx` | Add gear button that opens `UserSettingsSheet` |
| Modify | `src/routes/_auth.trees.$treeId.tsx` | Add gear button that opens `UserSettingsSheet` |

---

### Task 1: Create user_preferences table in Supabase

**Files:** None (SQL run in Supabase dashboard)

- [ ] **Step 1: Run the migration SQL in Supabase**

Open the Supabase dashboard → SQL editor and run:

```sql
create table public.user_preferences (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  name_order  text not null default 'first-last',
  date_format text not null default 'MM/DD/YYYY',
  language    text not null default 'en',
  updated_at  timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read their own preferences"
  on public.user_preferences for select
  using (user_id = auth.uid());

create policy "Users can upsert their own preferences"
  on public.user_preferences for insert
  with check (user_id = auth.uid());

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (user_id = auth.uid());
```

- [ ] **Step 2: Verify in Table Editor**

In the Supabase Table Editor, confirm the `user_preferences` table exists with the five columns listed above and RLS is enabled.

---

### Task 2: Update database.types.ts

**Files:**
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: Add user_preferences table type**

In `src/lib/database.types.ts`, inside the `Tables` object (after the `unions` block, around line 194), add:

```typescript
      user_preferences: {
        Row: {
          user_id: string
          name_order: string
          date_format: string
          language: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name_order?: string
          date_format?: string
          language?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          name_order?: string
          date_format?: string
          language?: string
          updated_at?: string
        }
        Relationships: []
      }
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "feat: add user_preferences table types"
```

---

### Task 3: Create formatName utility

**Files:**
- Create: `src/lib/formatName.ts`

- [ ] **Step 1: Write the utility**

Create `src/lib/formatName.ts`:

```typescript
export function formatName(
  firstName: string,
  lastName: string | null | undefined,
  nameOrder: 'first-last' | 'last-first',
): string {
  const parts =
    nameOrder === 'first-last'
      ? [firstName, lastName]
      : [lastName, firstName]
  return parts.filter(Boolean).join(' ')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/formatName.ts
git commit -m "feat: add formatName utility"
```

---

### Task 4: Create formatDate utility

**Files:**
- Create: `src/lib/formatDate.ts`

- [ ] **Step 1: Write the utility**

Create `src/lib/formatDate.ts`:

```typescript
export function formatDate(
  date: string | null,
  yearOnly: boolean | null,
  format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD',
): string {
  if (!date) return '—'
  if (yearOnly) return date.slice(0, 4)
  const d = new Date(date)
  const yyyy = d.getUTCFullYear().toString().padStart(4, '0')
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const dd = d.getUTCDate().toString().padStart(2, '0')
  switch (format) {
    case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`
    case 'YYYY-MM-DD': return `${yyyy}-${mm}-${dd}`
    default:           return `${mm}/${dd}/${yyyy}`
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/formatDate.ts
git commit -m "feat: add formatDate utility"
```

---

### Task 5: Create userPreferences API layer

**Files:**
- Create: `src/lib/api/userPreferences.ts`

- [ ] **Step 1: Write the API module**

Create `src/lib/api/userPreferences.ts`:

```typescript
import { supabase } from '../supabase'

export interface UserPreferences {
  name_order: 'first-last' | 'last-first'
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  language: 'en' | 'fr' | 'vi'
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  name_order: 'first-last',
  date_format: 'MM/DD/YYYY',
  language: 'en',
}

export async function getPreferences(): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('name_order, date_format, language')
    .maybeSingle()
  if (error) throw error
  if (!data) return DEFAULT_PREFERENCES
  return {
    name_order: data.name_order as UserPreferences['name_order'],
    date_format: data.date_format as UserPreferences['date_format'],
    language: data.language as UserPreferences['language'],
  }
}

export async function upsertPreferences(prefs: UserPreferences): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    })
  if (error) throw error
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api/userPreferences.ts
git commit -m "feat: add userPreferences API layer"
```

---

### Task 6: Create useUserPreferences hook

**Files:**
- Create: `src/hooks/useUserPreferences.ts`

- [ ] **Step 1: Write the hook**

Create `src/hooks/useUserPreferences.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPreferences,
  upsertPreferences,
  type UserPreferences,
} from '@/lib/api/userPreferences'

export function useUserPreferences() {
  return useQuery({
    queryKey: ['user_preferences'],
    queryFn: getPreferences,
  })
}

export function useUpdateUserPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertPreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_preferences'] }),
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useUserPreferences.ts
git commit -m "feat: add useUserPreferences hook"
```

---

### Task 7: Create UserSettingsSheet component

**Files:**
- Create: `src/components/UserSettingsSheet.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/UserSettingsSheet.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUserPreferences, useUpdateUserPreferences } from '@/hooks/useUserPreferences'
import type { UserPreferences } from '@/lib/api/userPreferences'
import { DEFAULT_PREFERENCES } from '@/lib/api/userPreferences'

interface Props {
  open: boolean
  onClose: () => void
}

export function UserSettingsSheet({ open, onClose }: Props) {
  const { data: prefs } = useUserPreferences()
  const update = useUpdateUserPreferences()

  const [form, setForm] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (prefs) setForm(prefs)
  }, [prefs])

  function set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaveError(null)
    try {
      await update.mutateAsync(form)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="font-bold text-base">Settings</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label>Name order</Label>
            <Select
              value={form.name_order}
              onValueChange={v => set('name_order', v as UserPreferences['name_order'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first-last">First Last</SelectItem>
                <SelectItem value="last-first">Last First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Date format</Label>
            <Select
              value={form.date_format}
              onValueChange={v => set('date_format', v as UserPreferences['date_format'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Language</Label>
            <Select
              value={form.language}
              onValueChange={v => set('language', v as UserPreferences['language'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t p-4 flex flex-col gap-2">
          {saveError && <p className="text-red-600 text-xs">{saveError}</p>}
          <Button className="w-full" onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function UserSettingsButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label="Settings">
        <Settings className="size-4" />
      </Button>
      <UserSettingsSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/UserSettingsSheet.tsx
git commit -m "feat: add UserSettingsSheet component"
```

---

### Task 8: Add gear button to Dashboard

**Files:**
- Modify: `src/routes/_auth.dashboard.tsx`

- [ ] **Step 1: Import and render UserSettingsButton**

In `src/routes/_auth.dashboard.tsx`, add the import:

```typescript
import { UserSettingsButton } from '@/components/UserSettingsSheet'
```

Replace the existing header `<div>` (line 37–41):

```typescript
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Family Trees</h1>
        <div className="flex items-center gap-2">
          <UserSettingsButton />
          <Button variant="link" size="sm" className="text-gray-500" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
```

- [ ] **Step 2: Verify in dev server**

Run `pnpm dev` and open the dashboard. A gear icon button should appear next to "Sign out". Clicking it should open the settings sheet. Saving should upsert a row in `user_preferences` (check Supabase Table Editor).

- [ ] **Step 3: Commit**

```bash
git add src/routes/_auth.dashboard.tsx
git commit -m "feat: add settings button to dashboard"
```

---

### Task 9: Add gear button to Tree Editor

**Files:**
- Modify: `src/routes/_auth.trees.$treeId.tsx`

- [ ] **Step 1: Import and render UserSettingsButton**

In `src/routes/_auth.trees.$treeId.tsx`, add the import:

```typescript
import { UserSettingsButton } from '@/components/UserSettingsSheet'
```

In the `<nav>` (line 24–43), add `<UserSettingsButton />` inside the existing `<div className="flex gap-2">`:

```typescript
        <div className="flex gap-2">
          <UserSettingsButton />
          <Button onClick={() => setShowAddPerson(true)}>
            Add person
          </Button>
          <Button variant="outline" onClick={() => setShowAddUnion(true)}>
            Add union
          </Button>
          <Link
            to="/trees/$treeId/settings"
            params={{ treeId }}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Settings
          </Link>
        </div>
```

- [ ] **Step 2: Verify in dev server**

Open a tree. The gear icon should appear in the nav. Clicking it opens the settings sheet.

- [ ] **Step 3: Commit**

```bash
git add src/routes/_auth.trees.$treeId.tsx
git commit -m "feat: add settings button to tree editor"
```

---

### Task 10: Apply preferences in PersonNode

**Files:**
- Modify: `src/components/PersonNode.tsx`

- [ ] **Step 1: Update PersonNode to use formatName with preferences**

Replace the entire contents of `src/components/PersonNode.tsx`:

```typescript
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { formatName } from '@/lib/formatName'
import { DEFAULT_PREFERENCES } from '@/lib/api/userPreferences'

export interface PersonNodeData {
  firstName: string
  lastName?: string
  birthYear?: number
  photoUrl?: string
  isDeceased?: boolean
  personId: string
  [key: string]: unknown
}

export function PersonNode({ data, selected }: NodeProps) {
  const d = data as PersonNodeData
  const { data: prefs } = useUserPreferences()
  const nameOrder = prefs?.name_order ?? DEFAULT_PREFERENCES.name_order
  const name = formatName(d.firstName, d.lastName, nameOrder)

  return (
    <div className={`
      bg-white border-2 rounded-xl shadow-sm w-36 overflow-hidden cursor-pointer
      ${selected ? 'border-blue-500' : 'border-gray-200'}
      ${d.isDeceased ? 'opacity-70' : ''}
    `}>
      <Handle type="target" position={Position.Top} />
      <div className="w-full h-20 bg-gray-100 flex items-center justify-center overflow-hidden">
        {d.photoUrl ? (
          <img src={d.photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl text-gray-400 select-none">
            {d.firstName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="px-2 py-1 text-center">
        <p className="text-xs font-semibold truncate">{name}</p>
        {d.birthYear && (
          <p className="text-[10px] text-gray-500">{d.birthYear}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

- [ ] **Step 2: Verify in dev server**

Open a tree. Person nodes should display names. Set name order to "Last First" in settings — node names should update after save.

- [ ] **Step 3: Commit**

```bash
git add src/components/PersonNode.tsx
git commit -m "feat: apply name order preference to PersonNode"
```

---

### Task 11: Apply preferences in PersonDetailPanel

**Files:**
- Modify: `src/components/PersonDetailPanel.tsx`

- [ ] **Step 1: Update PersonDetailPanel to use formatName and formatDate with preferences**

Replace the entire contents of `src/components/PersonDetailPanel.tsx`:

```typescript
import { useRef, useState } from 'react'
import { usePersons, useUpdatePerson, useDeletePerson, useUploadPhoto } from '@/hooks/usePersons'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatName } from '@/lib/formatName'
import { formatDate } from '@/lib/formatDate'
import { DEFAULT_PREFERENCES } from '@/lib/api/userPreferences'

interface Props {
  treeId: string
  personId: string | null
  open: boolean
  onClose: () => void
}

export function PersonDetailPanel({ treeId, personId, open, onClose }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const updatePerson = useUpdatePerson(treeId)
  const deletePerson = useDeletePerson(treeId)
  const uploadPhoto = useUploadPhoto(treeId)
  const { data: prefs } = useUserPreferences()
  const person = persons.find(p => p.id === personId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const nameOrder = prefs?.name_order ?? DEFAULT_PREFERENCES.name_order
  const dateFormat = prefs?.date_format ?? DEFAULT_PREFERENCES.date_format

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
    if (!confirm(`Delete ${formatName(person.first_name, person.last_name, nameOrder)}?`)) return
    setDeleteError(null)
    try {
      await deletePerson.mutateAsync(person.id)
      onClose()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const name = person
    ? formatName(person.first_name, person.last_name, nameOrder)
    : ''

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
                <dd>{formatDate(person.birth_date, person.is_birth_year_only, dateFormat)}</dd>
                <dt className="text-gray-500">Died</dt>
                <dd>{formatDate(person.death_date, person.is_death_year_only, dateFormat)}</dd>
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

- [ ] **Step 2: Verify in dev server**

Click a person node to open the detail panel. Change name order and date format in settings, save, then re-open the panel — name and dates should reflect the new preferences.

- [ ] **Step 3: Commit**

```bash
git add src/components/PersonDetailPanel.tsx
git commit -m "feat: apply name order and date format preferences to PersonDetailPanel"
```
