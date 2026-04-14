import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUpdateTree } from '@/hooks/useTrees'
import { getTree, togglePublic } from '@/lib/api/trees'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/constants/queryKeys'
import type { Database } from '@/lib/database.types'

type Tree = Database['public']['Tables']['trees']['Row']

export const Route = createFileRoute('/_auth/trees/$treeId/settings')({
  component: TreeSettings,
})

function TreeSettings() {
  const { treeId } = Route.useParams()
  const qc = useQueryClient()
  const { data: tree } = useQuery({
    queryKey: queryKeys.tree(treeId),
    queryFn: () => getTree(treeId),
  })
  const updateTree = useUpdateTree()
  const [name, setName] = useState('')
  const [togglePending, setTogglePending] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (tree) setName(tree.name)
  }, [tree])

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name === tree?.name) return
    setRenameError(null)
    try {
      await updateTree.mutateAsync({ id: treeId, name: name.trim() })
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Failed to rename tree')
    }
  }

  async function handleToggle() {
    if (!tree) return
    setToggleError(null)
    setTogglePending(true)
    try {
      const updatedTree = await togglePublic(treeId, !tree.is_public)
      qc.setQueryData<Tree>(queryKeys.tree(treeId), updatedTree)
      qc.setQueryData<Tree[]>(queryKeys.trees(), (prev) =>
        prev?.map((t) => (t.id === treeId ? updatedTree : t)) ?? []
      )
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setTogglePending(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(`${window.location.origin}/t/${treeId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto p-6 flex flex-col gap-6">
      <Link
        to="/trees/$treeId"
        params={{ treeId }}
        className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'self-start p-0')}
      >
        ← Back to tree
      </Link>
      <h1 className="text-2xl font-bold">Tree settings</h1>

      {/* Rename */}
      <section className="flex flex-col gap-2">
        <Label htmlFor="tree-name" className="font-medium">Name</Label>
        <form onSubmit={handleRename} className="flex gap-2">
          <Input id="tree-name" value={name} onChange={e => setName(e.target.value)} className="flex-1" />
          <Button type="submit" disabled={updateTree.isPending}>Save</Button>
        </form>
        {renameError && <p className="text-red-600 text-sm">{renameError}</p>}
      </section>

      {/* Public toggle */}
      <section className="flex flex-col gap-2 border rounded p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Public sharing</p>
            <p className="text-sm text-gray-500">Anyone with the link can view this tree</p>
          </div>
          <button
            onClick={handleToggle}
            disabled={togglePending}
            aria-label={tree?.is_public ? 'Make private' : 'Make public'}
            className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${tree?.is_public ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tree?.is_public ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
        {toggleError && <p className="text-red-600 text-sm">{toggleError}</p>}
      </section>

      {/* Share link */}
      {tree?.is_public && (
        <section className="flex flex-col gap-2">
          <Label className="font-medium">Share link</Label>
          <div className="flex gap-2">
            <Input readOnly value={`${window.location.origin}/t/${treeId}`} className="flex-1 text-sm bg-gray-50" />
            <Button variant="outline" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
