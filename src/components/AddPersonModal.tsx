import { useState } from 'react'
import { useCreatePerson } from '@/hooks/usePersons'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

type PersonInsert = Database['public']['Tables']['persons']['Insert']

interface Props {
  treeId: string
  open: boolean
  onClose: () => void
}

export function AddPersonModal({ treeId, open, onClose }: Props) {
  const createPerson = useCreatePerson(treeId)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    birth_date: '',
    is_birth_year_only: false,
    death_date: '',
    is_death_year_only: false,
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload: Omit<PersonInsert, 'tree_id'> = {
      first_name: form.first_name,
      last_name: form.last_name || null,
      gender: (form.gender || null) as PersonInsert['gender'],
      birth_date: form.birth_date || null,
      is_birth_year_only: form.is_birth_year_only,
      death_date: form.death_date || null,
      is_death_year_only: form.is_death_year_only,
      notes: form.notes || null,
    }
    try {
      await createPerson.mutateAsync(payload)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add person')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-96 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Input required placeholder="First name *" value={form.first_name}
            onChange={e => set('first_name', e.target.value)} />
          <Input placeholder="Last name" value={form.last_name}
            onChange={e => set('last_name', e.target.value)} />
          <Select
            value={form.gender || undefined}
            onValueChange={(v) => set('gender', v as typeof form.gender)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Gender (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 items-center">
            <Input type="date" value={form.birth_date}
              onChange={e => set('birth_date', e.target.value)}
              className="flex-1" />
            <Label className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input type="checkbox" checked={form.is_birth_year_only}
                onChange={e => set('is_birth_year_only', e.target.checked)} />
              Year only
            </Label>
          </div>
          <div className="flex gap-2 items-center">
            <Input type="date" value={form.death_date}
              onChange={e => set('death_date', e.target.value)}
              className="flex-1" />
            <Label className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input type="checkbox" checked={form.is_death_year_only}
                onChange={e => set('is_death_year_only', e.target.checked)} />
              Year only
            </Label>
          </div>
          <Textarea placeholder="Notes" value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className="resize-none h-20" />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPerson.isPending}>
              {createPerson.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
