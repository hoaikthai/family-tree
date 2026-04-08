import { useState } from 'react'
import { usePersons } from '@/hooks/usePersons'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useCreateUnion, useAddMember, useDeleteUnion } from '@/hooks/useUnions'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { getPersonName } from '@/lib/getPersonName'
import { DEFAULT_PREFERENCES } from '@/lib/api/userPreferences'

interface Props {
  treeId: string
  open: boolean
  onClose: () => void
}

export function AddUnionModal({ treeId, open, onClose }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const { data: prefs } = useUserPreferences()
  const createUnion = useCreateUnion(treeId)
  const addMember = useAddMember(treeId)
  const deleteUnion = useDeleteUnion(treeId)
  const [parent1, setParent1] = useState('')
  const [parent2, setParent2] = useState('')
  const [error, setError] = useState<string | null>(null)

  const nameOrder = prefs?.name_order ?? DEFAULT_PREFERENCES.name_order

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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-80">
        <DialogHeader>
          <DialogTitle>Create family unit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Select value={parent1 || undefined} onValueChange={(v) => setParent1(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Parent 1 (optional)">
                {parent1 && getPersonName(parent1, persons, nameOrder)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {persons.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {getPersonName(p.id, persons, nameOrder)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={parent2 || undefined} onValueChange={(v) => setParent2(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Parent 2 (optional)">
                {parent2 && getPersonName(parent2, persons, nameOrder)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {persons.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {getPersonName(p.id, persons, nameOrder)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
