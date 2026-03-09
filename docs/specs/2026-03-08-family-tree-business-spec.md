# Family Tree — Business Specification

**Date:** 2026-03-08
**Status:** Approved

---

## Product Overview & Vision

**Family Tree** is a multi-tenant web application that lets users document, visualize, and share their family history. Users build an interactive canvas-based graph where each person is a node and family relationships (couples + their children) are modeled as connected family units. Trees can be kept private or shared publicly via a read-only link.

**Core value proposition:** A simple, visual, no-friction way to capture a family's history across generations — accessible from any browser, shareable with relatives worldwide.

**Target users:** Individuals and families who want to document their ancestry. No genealogy expertise required.

---

## User Stories

### Authentication

- As a new user, I can sign up with email and password.
- As a returning user, I can sign in with email and password.
- As an authenticated user, I can sign out.
- As an unauthenticated user, I am redirected to `/login` when accessing protected pages.

### Trees (Dashboard)

- As a user, I can see a list of my family trees on the dashboard.
- As a user, I can create a new named family tree.
- As a user, I can rename an existing tree.
- As a user, I can delete a tree (and all its persons and unions).
- As a user, I can open a tree to view and edit it on the canvas.

### Persons (Nodes)

- As a tree owner, I can add a person with: first name, last name, gender, birth date (or year only), death date (or year only), photo, and notes.
- As a tree owner, I can edit any field of an existing person.
- As a tree owner, I can upload a profile photo for a person; it is stored in Supabase Storage.
- As a tree owner, I can delete a person (and their union memberships and children links).
- As a viewer, I can see a person's name, photo, and birth year on their canvas card.
- As a viewer, I can click a person card to open a detail panel with their full information.

### Unions (Family Units)

- As a tree owner, I can create a family unit by selecting 1 or 2 existing persons as parents.
- As a tree owner, I can add an existing person as a child of a union.
- As a tree owner, I can remove a child from a union.
- As a tree owner, I can delete a union (without deleting the persons in it).

### Canvas

- As a tree owner, I can drag person and union nodes freely on the canvas.
- As a tree owner, node positions are saved automatically after dragging.
- As a tree owner and viewer, I can zoom and pan the canvas.
- As a tree owner and viewer, I can see edges connecting union nodes to their member parents and children.

### Sharing

- As a tree owner, I can toggle my tree between private and public in tree settings.
- As a tree owner, I can copy a public share link for my tree.
- As anyone, I can open a public share link and view the tree in read-only mode without logging in.
- As a viewer on a public link, I cannot add, edit, or delete any data.

---

## Feature List & Requirements

| # | Feature | Requirement |
|---|---|---|
| F1 | Email auth | Sign up, sign in, sign out via Supabase Auth |
| F2 | Multi-tree | A user can own multiple named trees |
| F3 | Person CRUD | Add, edit, delete persons with full data fields |
| F4 | Photo upload | Profile photos stored in Supabase Storage |
| F5 | Union CRUD | Create family units with 1–2 parents + N children |
| F6 | Canvas editor | Drag-and-drop React Flow canvas for tree editing |
| F7 | Position save | Node positions persisted to DB (debounced at 500ms) |
| F8 | Person detail | Click a node to open a full-detail side panel |
| F9 | Public sharing | Toggle tree public; share read-only URL |
| F10 | Read-only view | Public viewers see canvas but have no edit controls |
| F11 | Tree settings | Rename tree, toggle public, copy share link |
| F12 | Auth guards | Protected routes redirect unauthenticated users |
| F13 | RLS security | Supabase RLS enforces data isolation per owner |

---

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | All writes require authentication. RLS enforces ownership at DB level. Public trees allow reads only. The Supabase anon key never grants write access. |
| **Performance** | Tree canvas renders up to 200 nodes without perceptible lag. Position saves debounced at 500ms to avoid excessive DB writes. |
| **Accessibility** | Interactive controls are keyboard-navigable. Node cards have alt text for photos. Color is not the sole indicator of state. |
| **Scalability** | Multi-tenant from day 1 via RLS. Storage bucket scoped per user. No hard limits on number of trees per user (soft limit TBD). |
| **Browser support** | Latest 2 versions of Chrome, Firefox, Safari. Mobile view is read-only canvas (no editing on small screens). |
| **Data integrity** | Deleting a person cascades removal from `union_members` and `union_children`. Deleting a tree cascades to all persons and unions. |

---

## Out of Scope (v1)

- Collaborative editing (multiple users editing the same tree simultaneously)
- Import from GEDCOM or other genealogy formats
- Timeline or historical views
- DNA / biological matching features
- Mobile native app
- Social features (comments, likes)
