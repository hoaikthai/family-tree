import { useTranslation } from 'react-i18next'
import { useCreatePerson } from '@/hooks/usePersons'
import type { Database } from '@/lib/database.types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PersonForm } from './PersonForm'
import type { PersonFormValues } from './personSchema'

type PersonInsert = Database['public']['Tables']['persons']['Insert']

type Props = {
  treeId: string
  open: boolean
  onClose: () => void
}

export function AddPersonModal({ treeId, open, onClose }: Props) {
  const { t } = useTranslation()
  const createPerson = useCreatePerson(treeId)

  async function handleSubmit(values: PersonFormValues) {
    const payload: Omit<PersonInsert, 'tree_id'> = {
      first_name: values.first_name,
      last_name: values.last_name || null,
      gender: (values.gender ?? null) as PersonInsert['gender'],
      birth_date: values.birth_date || null,
      is_birth_year_only: values.is_birth_year_only,
      death_date: values.death_date || null,
      is_death_year_only: values.is_death_year_only,
      notes: values.notes || null,
    }
    await createPerson.mutateAsync(payload)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-96 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addPersonModal.title')}</DialogTitle>
        </DialogHeader>
        <PersonForm
          onSubmit={handleSubmit}
          isPending={createPerson.isPending}
          onCancel={onClose}
          submitLabel={t('addPersonModal.button.create')}
          pendingLabel={t('addPersonModal.button.creating')}
          cancelLabel={t('addPersonModal.button.cancel')}
        />
      </DialogContent>
    </Dialog>
  )
}
