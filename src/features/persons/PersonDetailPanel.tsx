import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePersons, useUpdatePerson, useDeletePerson, useUploadPhoto } from '@/hooks/usePersons'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatName } from '@/lib/formatName'
import { formatDate } from '@/lib/formatDate'
import { DEFAULT_PREFERENCES } from '@/lib/api/userPreferences'
import { PersonForm } from './PersonForm'
import type { PersonFormValues } from './personSchema'

type Props = {
  treeId: string
  personId: string | null
  open: boolean
  onClose: () => void
}

export function PersonDetailPanel({ treeId, personId, open, onClose }: Props) {
  const { t } = useTranslation()
  const { data: persons = [] } = usePersons(treeId)
  const updatePerson = useUpdatePerson(treeId)
  const deletePerson = useDeletePerson(treeId)
  const uploadPhoto = useUploadPhoto(treeId)
  const { data: prefs } = useUserPreferences()
  const person = persons.find(p => p.id === personId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const nameOrder = prefs?.name_order ?? DEFAULT_PREFERENCES.name_order
  const dateFormat = prefs?.date_format ?? DEFAULT_PREFERENCES.date_format

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

  const name = person ? formatName(person.first_name, person.last_name, nameOrder) : ''

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        {person && (
          <>
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle className="font-bold text-base truncate">{name}</SheetTitle>
            </SheetHeader>

            {editing ? (
              <PersonForm
                defaultValues={{
                  first_name: person.first_name,
                  last_name: person.last_name ?? '',
                  gender: (person.gender ?? undefined) as PersonFormValues['gender'],
                  birth_date: person.birth_date ?? '',
                  is_birth_year_only: person.is_birth_year_only ?? false,
                  death_date: person.death_date ?? '',
                  is_death_year_only: person.is_death_year_only ?? false,
                  notes: person.notes ?? '',
                }}
                onSubmit={async (values) => {
                  await updatePerson.mutateAsync({
                    id: person.id,
                    updates: {
                      first_name: values.first_name,
                      last_name: values.last_name || null,
                      gender: (values.gender ?? null) as 'male' | 'female' | 'other' | null,
                      birth_date: values.birth_date || null,
                      is_birth_year_only: values.is_birth_year_only,
                      death_date: values.death_date || null,
                      is_death_year_only: values.is_death_year_only,
                      notes: values.notes || null,
                    },
                  })
                  setEditing(false)
                }}
                isPending={updatePerson.isPending}
                onCancel={() => setEditing(false)}
                submitLabel={t('personDetailPanel.button.save')}
                pendingLabel={t('personDetailPanel.button.saving')}
                cancelLabel={t('personDetailPanel.button.cancel')}
                className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
              />
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
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
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                  {photoError && <p className="text-red-600 text-xs text-center">{photoError}</p>}

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <dt className="text-gray-500">{t('personForm.gender')}</dt>
                    <dd className="capitalize">{person.gender ?? '—'}</dd>
                    <dt className="text-gray-500">{t('personForm.born')}</dt>
                    <dd>{formatDate(person.birth_date, person.is_birth_year_only, dateFormat)}</dd>
                    <dt className="text-gray-500">{t('personForm.died')}</dt>
                    <dd>{formatDate(person.death_date, person.is_death_year_only, dateFormat)}</dd>
                  </dl>

                  {person.notes && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 mb-1">{t('personForm.notes')}</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{person.notes}</p>
                    </div>
                  )}
                </div>

                <div className="border-t p-4 flex flex-col gap-2">
                  {deleteError && <p className="text-red-600 text-xs">{deleteError}</p>}
                  <Button className="w-full" onClick={() => setEditing(true)}>
                    {t('personDetailPanel.button.edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDelete}
                    disabled={deletePerson.isPending}
                  >
                    {deletePerson.isPending
                      ? t('personDetailPanel.button.deleting')
                      : t('personDetailPanel.button.delete')}
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
