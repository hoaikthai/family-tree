import { useState } from 'react'
import { useCreatePerson } from '@/hooks/usePersons'
import type { Database } from '@/lib/database.types'

type PersonInsert = Database['public']['Tables']['persons']['Insert']

interface Props {
  treeId: string
  onClose: () => void
}

export function AddPersonModal({ treeId, onClose }: Props) {
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl p-6 w-96 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold">Add person</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input required placeholder="First name *" value={form.first_name}
          onChange={e => set('first_name', e.target.value)}
          className="border rounded px-3 py-2" />
        <input placeholder="Last name" value={form.last_name}
          onChange={e => set('last_name', e.target.value)}
          className="border rounded px-3 py-2" />
        <select value={form.gender}
          onChange={e => set('gender', e.target.value as typeof form.gender)}
          className="border rounded px-3 py-2">
          <option value="">Gender (optional)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <div className="flex gap-2 items-center">
          <input type="date" value={form.birth_date}
            onChange={e => set('birth_date', e.target.value)}
            className="border rounded px-3 py-2 flex-1" />
          <label className="flex items-center gap-1 text-sm whitespace-nowrap">
            <input type="checkbox" checked={form.is_birth_year_only}
              onChange={e => set('is_birth_year_only', e.target.checked)} />
            Year only
          </label>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" value={form.death_date}
            onChange={e => set('death_date', e.target.value)}
            className="border rounded px-3 py-2 flex-1" />
          <label className="flex items-center gap-1 text-sm whitespace-nowrap">
            <input type="checkbox" checked={form.is_death_year_only}
              onChange={e => set('is_death_year_only', e.target.checked)} />
            Year only
          </label>
        </div>
        <textarea placeholder="Notes" value={form.notes}
          onChange={e => set('notes', e.target.value)}
          className="border rounded px-3 py-2 resize-none h-20" />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button type="submit" disabled={createPerson.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {createPerson.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
