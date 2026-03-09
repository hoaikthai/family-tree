import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUpdateTree } from '@/hooks/useTrees'
import { getTree, togglePublic } from '@/lib/api/trees'
import { useQueryClient } from '@tanstack/react-query'

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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (tree) setName(tree.name)
  }, [tree])

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name === tree?.name) return
    await updateTree.mutateAsync({ id: treeId, name: name.trim() })
    qc.invalidateQueries({ queryKey: ['tree', treeId] })
  }

  async function handleToggle() {
    if (!tree) return
    setTogglePending(true)
    await togglePublic(treeId, !tree.is_public)
    qc.invalidateQueries({ queryKey: ['tree', treeId] })
    setTogglePending(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(`${window.location.origin}/t/${treeId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto p-6 flex flex-col gap-6">
      <Link to="/trees/$treeId" params={{ treeId }} className="text-sm text-blue-600 underline">
        ← Back to tree
      </Link>
      <h1 className="text-2xl font-bold">Tree settings</h1>

      {/* Rename */}
      <section className="flex flex-col gap-2">
        <label className="font-medium">Name</label>
        <form onSubmit={handleRename} className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)}
            className="border rounded px-3 py-2 flex-1" />
          <button type="submit" disabled={updateTree.isPending}
            className="bg-blue-600 text-white px-4 rounded disabled:opacity-50">
            Save
          </button>
        </form>
      </section>

      {/* Public toggle */}
      <section className="flex items-center justify-between border rounded p-4">
        <div>
          <p className="font-medium">Public sharing</p>
          <p className="text-sm text-gray-500">Anyone with the link can view this tree</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={togglePending}
          aria-label={tree?.is_public ? 'Make private' : 'Make public'}
          className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${tree?.is_public ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tree?.is_public ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </section>

      {/* Share link */}
      {tree?.is_public && (
        <section className="flex flex-col gap-2">
          <label className="font-medium">Share link</label>
          <div className="flex gap-2">
            <input readOnly value={`${window.location.origin}/t/${treeId}`}
              className="border rounded px-3 py-2 flex-1 text-sm bg-gray-50" />
            <button onClick={handleCopy}
              className="border rounded px-3 py-2 text-sm whitespace-nowrap">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
