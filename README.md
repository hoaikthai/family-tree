# Family Tree

A web app for building and visualizing family trees. Add people, record relationships (unions), and explore your family history through an interactive canvas.

**Live:** https://hoaikthai.github.io/family-tree

## Features

- Interactive family tree canvas powered by React Flow
- Add and manage people with details (name, birth/death dates, gender, notes)
- Record unions (marriages, partnerships) between people
- Multiple trees per account
- English and Vietnamese language support
- Authentication via Supabase

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Routing:** TanStack Router
- **Data fetching:** TanStack Query
- **Forms:** TanStack Form + Zod
- **Backend:** Supabase (auth + database)
- **Canvas:** React Flow (@xyflow/react)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **i18n:** i18next (EN, VI)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm

### Setup

```bash
pnpm install
```

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### Dev server

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

## Deployment

The app deploys automatically to GitHub Pages on push to `main` via GitHub Actions.
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as GitHub repository variables or secrets so the Pages build can inject them during `pnpm build`.
