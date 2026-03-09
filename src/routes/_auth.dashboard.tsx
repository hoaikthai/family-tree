import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCreateTree, useDeleteTree, useTrees } from '@/hooks/useTrees'

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const tree = await createTree.mutateAsync(newName.trim())
    setNewName('')
    navigate({ to: '/trees/$treeId', params: { treeId: tree.id } })
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Family Trees</h1>
        <button onClick={() => signOut()} className="text-sm text-gray-500 underline">
          Sign out
        </button>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New tree name"
          className="border rounded px-3 py-2 flex-1"
        />
        <button type="submit" disabled={createTree.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
          Create
        </button>
      </form>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      <ul className="flex flex-col gap-2">
        {trees?.map(tree => (
          <li key={tree.id} className="flex items-center justify-between border rounded px-4 py-3">
            <Link to="/trees/$treeId" params={{ treeId: tree.id }}
              className="font-medium hover:underline">
              {tree.name}
            </Link>
            <button
              onClick={() => deleteTree.mutate(tree.id)}
              disabled={deleteTree.isPending}
              className="text-red-500 text-sm hover:underline disabled:opacity-50">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
