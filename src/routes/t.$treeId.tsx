import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/t/$treeId')({
  component: () => <div>Public tree view (coming soon)</div>,
})
