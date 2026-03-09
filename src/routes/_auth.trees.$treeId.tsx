import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/trees/$treeId')({
  component: () => <div>Tree editor (coming soon)</div>,
})
