import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/trees/$treeId/settings')({
  component: () => <div>Tree settings (coming soon)</div>,
})
