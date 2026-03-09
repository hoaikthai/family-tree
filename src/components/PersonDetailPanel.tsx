import { useRef, useState } from 'react'
import { usePersons, useUpdatePerson, useDeletePerson, useUploadPhoto } from '@/hooks/usePersons'

interface Props {
  treeId: string
  personId: string
  onClose: () => void
}

function formatDate(date: string | null, yearOnly: boolean | null) {
  if (!date) return '—'
  if (yearOnly) return new Date(date).getFullYear().toString()
  return new Date(date).toLocaleDateString()
}

export function PersonDetailPanel({ treeId, personId, onClose }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const updatePerson = useUpdatePerson(treeId)
  const deletePerson = useDeletePerson(treeId)
  const uploadPhoto = useUploadPhoto(treeId)
  const person = persons.find(p => p.id === personId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (!person) return null

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadPhoto.mutateAsync({ personId: person!.id, file })
    await updatePerson.mutateAsync({ id: person!.id, updates: { photo_url: url } })
  }

  async function handleDelete() {
    if (!confirm(`Delete ${person!.first_name}${person!.last_name ? ' ' + person!.last_name : ''}?`)) return
    setDeleteError(null)
    try {
      await deletePerson.mutateAsync(person!.id)
      onClose()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const name = [person.first_name, person.last_name].filter(Boolean).join(' ')

  return (
    <aside className="absolute right-0 top-0 h-full w-80 bg-white border-l shadow-lg flex flex-col z-10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-bold text-base truncate">{name}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2" aria-label="Close">✕</button>
      </div>

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

        {/* Details */}
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <dt className="text-gray-500">Gender</dt>
          <dd className="capitalize">{person.gender ?? '—'}</dd>
          <dt className="text-gray-500">Born</dt>
          <dd>{formatDate(person.birth_date, person.is_birth_year_only)}</dd>
          <dt className="text-gray-500">Died</dt>
          <dd>{formatDate(person.death_date, person.is_death_year_only)}</dd>
        </dl>

        {person.notes && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{person.notes}</p>
          </div>
        )}

        {deleteError && <p className="text-red-600 text-xs">{deleteError}</p>}
      </div>

      {/* Actions */}
      <div className="border-t p-4 flex gap-2">
        <button
          onClick={handleDelete}
          disabled={deletePerson.isPending}
          className="flex-1 border border-red-300 text-red-600 rounded py-1.5 text-sm disabled:opacity-50">
          {deletePerson.isPending ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </aside>
  )
}
