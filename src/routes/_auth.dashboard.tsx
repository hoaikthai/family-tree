import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCreateTree, useDeleteTree, useTrees } from '@/hooks/useTrees'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { UserSettingsButton } from '@/components/UserSettingsSheet'

export const Route = createFileRoute('/_auth/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { data: trees, isLoading } = useTrees()
  const createTree = useCreateTree()
  const deleteTree = useDeleteTree()
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreateError(null)
    try {
      const tree = await createTree.mutateAsync(newName.trim())
      setNewName('')
      navigate({ to: '/trees/$treeId', params: { treeId: tree.id } })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create tree')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Family Trees</h1>
        <div className="flex items-center gap-2">
          <UserSettingsButton />
          <Button variant="link" size="sm" className="text-gray-500" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      {createError && <p className="text-red-600 text-sm mb-2">{createError}</p>}
      {deleteTree.isError && (
        <p className="text-red-600 text-sm mb-2">Failed to delete tree. Please try again.</p>
      )}

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New tree name"
          className="flex-1"
        />
        <Button type="submit" disabled={createTree.isPending}>
          {createTree.isPending ? 'Creating…' : 'Create'}
        </Button>
      </form>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      <ul className="flex flex-col gap-2">
        {trees?.map(tree => (
          <li key={tree.id} className="flex items-center justify-between border rounded px-4 py-3">
            <Link
              to="/trees/$treeId"
              params={{ treeId: tree.id }}
              className={cn(buttonVariants({ variant: 'link' }), 'font-medium p-0 h-auto')}
            >
              {tree.name}
            </Link>
            <Button
              variant="link"
              size="sm"
              className="text-red-500"
              onClick={() => deleteTree.mutate(tree.id)}
              disabled={deleteTree.isPending}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
