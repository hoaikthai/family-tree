import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getTree } from '@/lib/api/trees'
import { TreeCanvas } from '@/components/TreeCanvas'

export const Route = createFileRoute('/t/$treeId')({
  component: PublicTreeView,
})

function PublicTreeView() {
  const { treeId } = Route.useParams()
  const { data: tree, isLoading } = useQuery({
    queryKey: ['tree', treeId],
    queryFn: () => getTree(treeId),
  })

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>
  }
  if (!tree?.is_public) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Tree not found or not public.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="px-4 py-2 border-b bg-white flex items-center justify-between">
        <h1 className="font-bold">{tree.name}</h1>
        <span className="text-xs text-gray-400 border rounded px-2 py-0.5">Read only</span>
      </header>
      <div className="flex-1">
        <TreeCanvas treeId={treeId} readOnly />
      </div>
    </div>
  )
}
