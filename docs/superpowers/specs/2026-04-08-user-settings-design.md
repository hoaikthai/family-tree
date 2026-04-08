# User Settings — Design Spec

**Date:** 2026-04-08
**Status:** Approved

---

## Overview

A user-level settings sheet where authenticated users can update their personal display preferences: name order, date format, and language. Preferences are persisted server-side in Supabase and applied throughout the app where names and dates are rendered.

---

## Data Layer

### `user_preferences` table

| column | type | default | notes |
|---|---|---|---|
| `user_id` | UUID PK | — | FK → `auth.users(id)` ON DELETE CASCADE |
| `name_order` | text | `'first-last'` | `'first-last'` or `'last-first'` |
| `date_format` | text | `'MM/DD/YYYY'` | `'MM/DD/YYYY'`, `'DD/MM/YYYY'`, or `'YYYY-MM-DD'` |
| `language` | text | `'en'` | `'en'`, `'fr'`, `'vi'` (stored, not wired to i18n yet) |
| `updated_at` | timestamptz | `now()` | — |

RLS policies:
- SELECT: `user_id = auth.uid()`
- INSERT/UPDATE: `user_id = auth.uid()`

Row is created on first save. If no row exists, the app falls back to defaults.

### `useUserPreferences` hook

Wraps TanStack Query. Mirrors existing hooks (`usePersons`, `useUnions`).

```ts
// Returns current preferences (or defaults if no row)
const { data: prefs } = useUserPreferences()

// Upserts changed fields
const { mutate: updatePreferences } = useUpdateUserPreferences()
```

Query key: `['user_preferences']`. On mutation success, invalidates the query.

---

## UI

### `UserSettingsSheet` component

- Wraps shadcn `Sheet` (same pattern as `PersonDetailPanel`, `UnionDetailPanel`)
- Sheet side: `right`
- Contains three labeled `Select` dropdowns:
  - **Name order:** First Last / Last First
  - **Date format:** MM/DD/YYYY / DD/MM/YYYY / YYYY-MM-DD
  - **Language:** English / Français / Tiếng Việt
- **Save** button: calls `updatePreferences`, closes sheet on success
- Local loading/error state shown inline (no toast needed)

### Trigger placement

A gear icon button (`⚙`) opens the sheet. Placed in two locations:

1. **Dashboard** (`_auth.dashboard.tsx`) — in the header row, between the title and "Sign out"
2. **Tree editor** (`_auth.trees.$treeId.tsx`) — in the existing header/toolbar area

Sheet open/closed state is local to the component that renders the button — no global state.

---

## Applying Preferences

### Name order

A `formatName(firstName, lastName, nameOrder)` utility returns the correctly ordered full name string. Used in:
- `PersonNode` (canvas card)
- `PersonDetailPanel` (sheet header)

### Date format

A `formatDate(dateStr, format)` utility formats ISO date strings. Used in:
- `PersonDetailPanel` (birth date, death date fields)

### Language

Stored and returned by the hook. Not wired to any i18n system yet — treated as a no-op on the frontend until i18n is introduced.

---

## Out of Scope

- i18n / translated UI strings
- Theme or appearance settings
- Notification preferences
- Account management (email/password change)
