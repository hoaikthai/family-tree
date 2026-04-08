import { useRef, useState } from 'react'
import { usePersons, useUpdatePerson, useDeletePerson, useUploadPhoto } from '@/hooks/usePersons'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface Props {
  treeId: string
  personId: string | null
  open: boolean
  onClose: () => void
}

function formatDate(date: string | null, yearOnly: boolean | null) {
  if (!date) return '—'
  if (yearOnly) return date.slice(0, 4)
  return new Date(date).toLocaleDateString()
}

export function PersonDetailPanel({ treeId, personId, open, onClose }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const updatePerson = useUpdatePerson(treeId)
  const deletePerson = useDeletePerson(treeId)
  const uploadPhoto = useUploadPhoto(treeId)
  const person = persons.find(p => p.id === personId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

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
    if (!confirm(`Delete ${person.first_name}${person.last_name ? ' ' + person.last_name : ''}?`)) return
    setDeleteError(null)
    try {
      await deletePerson.mutateAsync(person.id)
      onClose()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const name = person ? [person.first_name, person.last_name].filter(Boolean).join(' ') : ''

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        {person && (
          <>
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle className="font-bold text-base truncate">{name}</SheetTitle>
            </SheetHeader>

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
            </div>

            {/* Actions */}
            <div className="border-t p-4 flex flex-col gap-2">
              {deleteError && <p className="text-red-600 text-xs">{deleteError}</p>}
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
      </SheetContent>
    </Sheet>
  )
}
