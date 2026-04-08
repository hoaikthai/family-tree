# shadcn/ui Migration + cursor-pointer Fix

**Date:** 2026-04-08  
**Status:** Approved

## Goal

Replace all raw HTML form/interactive elements with shadcn/ui primitives across the entire project, and ensure all button and link-like elements have `cursor-pointer`.

## Setup

1. Run `pnpm dlx shadcn@latest init` — select Tailwind v4 / CSS variables mode.
2. Add components: `button`, `input`, `textarea`, `select`, `label`, `dialog`, `sheet`.

## Component Mapping

| Current element | shadcn replacement | Notes |
|---|---|---|
| `<button>` | `<Button>` | variant: `default`, `outline`, `destructive`, `ghost`, `link` |
| `<input>` | `<Input>` | |
| `<textarea>` | `<Textarea>` | |
| `<select>` | `<Select>` + `SelectTrigger` / `SelectContent` / `SelectItem` | |
| `<label>` | `<Label>` | |
| `AddPersonModal` overlay | `<Dialog>` + `DialogContent` / `DialogHeader` | Controlled via `open` prop |
| `AddUnionModal` overlay | `<Dialog>` + `DialogContent` / `DialogHeader` | Same pattern |
| `PersonDetailPanel` side panel | `<Sheet side="right">` | Replace `absolute right-0` positioning |
| `UnionDetailPanel` side panel | `<Sheet side="right">` | Replace `fixed inset-y-0 right-0` positioning |
| `<Link>` styled as button | `<Button asChild><Link /></Button>` | TanStack Router `Link` passed as child |

## cursor-pointer

- shadcn `Button` includes `cursor-pointer` in its base styles — no extra work needed for buttons.
- The photo `<div onClick>` in `PersonDetailPanel` already has `cursor-pointer` — keep as-is.
- Close buttons (✕) and the sign-out text button will use `<Button variant="ghost">` or `<Button variant="link">`, which carry `cursor-pointer`.

## Files Changed

- `src/routes/login.tsx`
- `src/routes/_auth.dashboard.tsx`
- `src/routes/_auth.trees.$treeId.tsx`
- `src/components/PersonDetailPanel.tsx`
- `src/components/UnionDetailPanel.tsx`
- `src/components/AddPersonModal.tsx`
- `src/components/AddUnionModal.tsx`

## Out of Scope

- `PersonNode.tsx` and `UnionNode.tsx` — no interactive elements beyond ReactFlow handles.
- `TreeCanvas.tsx` — no UI buttons.
- Toast/alert components — not currently used.
- Visual redesign — this is a component swap, not a style overhaul. Existing layout/spacing classes are preserved.
