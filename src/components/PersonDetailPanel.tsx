import { useRef, useState } from 'react'
import { usePersons, useUpdatePerson, useDeletePerson, useUploadPhoto } from '@/hooks/usePersons'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatName } from '@/lib/formatName'
import { formatDate } from '@/lib/formatDate'
import { DEFAULT_PREFERENCES } from '@/lib/api/userPreferences'

interface Props {
  treeId: string
  personId: string | null
  open: boolean
  onClose: () => void
}

export function PersonDetailPanel({ treeId, personId, open, onClose }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const updatePerson = useUpdatePerson(treeId)
  const deletePerson = useDeletePerson(treeId)
  const uploadPhoto = useUploadPhoto(treeId)
  const { data: prefs } = useUserPreferences()
  const person = persons.find(p => p.id === personId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    birth_date: '',
    is_birth_year_only: false,
    death_date: '',
    is_death_year_only: false,
    notes: '',
  })
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const nameOrder = prefs?.name_order ?? DEFAULT_PREFERENCES.name_order
  const dateFormat = prefs?.date_format ?? DEFAULT_PREFERENCES.date_format

  function startEditing() {
    if (!person) return
    setEditForm({
      first_name: person.first_name,
      last_name: person.last_name ?? '',
      gender: (person.gender ?? '') as typeof editForm.gender,
      birth_date: person.birth_date ?? '',
      is_birth_year_only: person.is_birth_year_only ?? false,
      death_date: person.death_date ?? '',
      is_death_year_only: person.is_death_year_only ?? false,
      notes: person.notes ?? '',
    })
    setEditError(null)
    setEditing(true)
  }

  function setField<K extends keyof typeof editForm>(key: K, value: typeof editForm[K]) {
    setEditForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!person) return
    setEditError(null)
    try {
      await updatePerson.mutateAsync({
        id: person.id,
        updates: {
          first_name: editForm.first_name,
          last_name: editForm.last_name || null,
          gender: (editForm.gender || null) as 'male' | 'female' | 'other' | null,
          birth_date: editForm.birth_date || null,
          is_birth_year_only: editForm.is_birth_year_only,
          death_date: editForm.death_date || null,
          is_death_year_only: editForm.is_death_year_only,
          notes: editForm.notes || null,
        },
      })
      setEditing(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!person) return
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(null)
    try {
      const url = await uploadPhoto.mutateAsync({ personId: person.id, file })
      await updatePerson.mutateAsync({ id: person.id, updates: { photo_url: url } })
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload photo')
    }
  }

  async function handleDelete() {
    if (!person) return
    if (!confirm(`Delete ${formatName(person.first_name, person.last_name, nameOrder)}?`)) return
    setDeleteError(null)
    try {
      await deletePerson.mutateAsync(person.id)
      onClose()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const name = person
    ? formatName(person.first_name, person.last_name, nameOrder)
    : ''

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        {person && (
          <>
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle className="font-bold text-base truncate">{name}</SheetTitle>
            </SheetHeader>

            {editing ? (
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {editError && <p className="text-red-600 text-sm">{editError}</p>}
                <Input required placeholder="First name *" value={editForm.first_name}
                  onChange={e => setField('first_name', e.target.value)} />
                <Input placeholder="Last name" value={editForm.last_name}
                  onChange={e => setField('last_name', e.target.value)} />
                <Select
                  value={editForm.gender || undefined}
                  onValueChange={v => setField('gender', v as typeof editForm.gender)}
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
                  <Input type="date" value={editForm.birth_date}
                    onChange={e => setField('birth_date', e.target.value)}
                    className="flex-1" />
                  <Label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input type="checkbox" checked={editForm.is_birth_year_only}
                      onChange={e => setField('is_birth_year_only', e.target.checked)} />
                    Year only
                  </Label>
                </div>
                <div className="flex gap-2 items-center">
                  <Input type="date" value={editForm.death_date}
                    onChange={e => setField('death_date', e.target.value)}
                    className="flex-1" />
                  <Label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input type="checkbox" checked={editForm.is_death_year_only}
                      onChange={e => setField('is_death_year_only', e.target.checked)} />
                    Year only
                  </Label>
                </div>
                <Textarea placeholder="Notes" value={editForm.notes}
                  onChange={e => setField('notes', e.target.value)}
                  className="resize-none h-20" />
                <div className="flex gap-2 mt-auto pt-2">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={updatePerson.isPending}>
                    {updatePerson.isPending ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {/* Photo */}
                  <div
                    className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-100 cursor-pointer ring-2 ring-offset-2 ring-gray-200 hover:ring-blue-400 transition-all"
                    onClick={() => fileRef.current?.click()}
                    title="Click to change photo"
                  >
                    {person.photo_url
                      ? <img src={person.photo_url} alt={name} className="w-full h-full object-cover" />
                      : <span className="absolute inset-0 flex items-center justify-center text-3xl text-gray-400 select-none">
                          {person.first_name.charAt(0).toUpperCase()}
                        </span>
                    }
                    {uploadPhoto.isPending && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-white text-xs">Uploading…</span>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden" onChange={handlePhotoChange} />
                  </div>
                  {photoError && <p className="text-red-600 text-xs text-center">{photoError}</p>}

                  {/* Details */}
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <dt className="text-gray-500">Gender</dt>
                    <dd className="capitalize">{person.gender ?? '—'}</dd>
                    <dt className="text-gray-500">Born</dt>
                    <dd>{formatDate(person.birth_date, person.is_birth_year_only, dateFormat)}</dd>
                    <dt className="text-gray-500">Died</dt>
                    <dd>{formatDate(person.death_date, person.is_death_year_only, dateFormat)}</dd>
                  </dl>

                  {person.notes && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{person.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t p-4 flex flex-col gap-2">
                  {deleteError && <p className="text-red-600 text-xs">{deleteError}</p>}
                  <Button className="w-full" onClick={startEditing}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDelete}
                    disabled={deletePerson.isPending}
                  >
                    {deletePerson.isPending ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
