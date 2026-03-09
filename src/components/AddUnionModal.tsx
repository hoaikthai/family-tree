import { useState } from 'react'
import { usePersons } from '@/hooks/usePersons'
import { useCreateUnion, useAddMember, useDeleteUnion } from '@/hooks/useUnions'

interface Props {
  treeId: string
  onClose: () => void
}

export function AddUnionModal({ treeId, onClose }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const createUnion = useCreateUnion(treeId)
  const addMember = useAddMember(treeId)
  const deleteUnion = useDeleteUnion(treeId)
  const [parent1, setParent1] = useState('')
  const [parent2, setParent2] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (parent1 && parent2 && parent1 === parent2) {
      setError('Both parents cannot be the same person')
      return
    }
    setError(null)
    try {
      const union = await createUnion.mutateAsync()
      try {
        if (parent1) await addMember.mutateAsync({ unionId: union.id, personId: parent1 })
        if (parent2 && parent2 !== parent1) {
          await addMember.mutateAsync({ unionId: union.id, personId: parent2 })
        }
      } catch (err) {
        try { await deleteUnion.mutateAsync(union.id) } catch { /* best-effort */ }
        throw err
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create union')
    }
  }

  const isPending = createUnion.isPending || addMember.isPending

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4">
        <h2 className="text-lg font-bold">Create family unit</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <select value={parent1} onChange={e => setParent1(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">Parent 1 (optional)</option>
          {persons.map(p => (
            <option key={p.id} value={p.id}>
              {p.first_name}{p.last_name ? ' ' + p.last_name : ''}
            </option>
          ))}
        </select>
        <select value={parent2} onChange={e => setParent2(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">Parent 2 (optional)</option>
          {persons.map(p => (
            <option key={p.id} value={p.id}>
              {p.first_name}{p.last_name ? ' ' + p.last_name : ''}
            </option>
          ))}
        </select>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} disabled={isPending}
            className="px-4 py-2 border rounded disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
