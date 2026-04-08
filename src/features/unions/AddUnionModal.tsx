import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
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

const unionSchema = z.object({
  parent1: z.string(),
  parent2: z.string(),
})

type UnionFormValues = z.infer<typeof unionSchema>

type Props = {
  treeId: string
  open: boolean
  onClose: () => void
}

export function AddUnionModal({ treeId, open, onClose }: Props) {
  const { t } = useTranslation()
  const { data: persons = [] } = usePersons(treeId)
  const { data: prefs } = useUserPreferences()
  const createUnion = useCreateUnion(treeId)
  const addMember = useAddMember(treeId)
  const deleteUnion = useDeleteUnion(treeId)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const nameOrder = prefs?.name_order ?? DEFAULT_PREFERENCES.name_order

  const form = useForm({
    defaultValues: { parent1: '', parent2: '' } as UnionFormValues,
    validators: { onChange: unionSchema },
    onSubmit: async ({ value }) => {
      if (value.parent1 && value.parent2 && value.parent1 === value.parent2) {
        setSubmitError(t('addUnionModal.error.sameParent'))
        return
      }
      setSubmitError(null)
      try {
        const union = await createUnion.mutateAsync()
        try {
          if (value.parent1) {
            await addMember.mutateAsync({ unionId: union.id, personId: value.parent1 })
          }
          if (value.parent2 && value.parent2 !== value.parent1) {
            await addMember.mutateAsync({ unionId: union.id, personId: value.parent2 })
          }
        } catch (err) {
          try { await deleteUnion.mutateAsync(union.id) } catch { /* best-effort */ }
          throw err
        }
        onClose()
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to create union')
      }
    },
  })

  const isPending = createUnion.isPending || addMember.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-80">
        <DialogHeader>
          <DialogTitle>{t('addUnionModal.title')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="flex flex-col gap-4"
        >
          {submitError && <p className="text-red-600 text-sm">{submitError}</p>}

          <form.Field name="parent1">
            {(field) => (
              <Select
                value={field.state.value || undefined}
                onValueChange={(v) => field.handleChange(v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('addUnionModal.parent1')}>
                    {field.state.value && getPersonName(field.state.value, persons, nameOrder)}
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
            )}
          </form.Field>

          <form.Field name="parent2">
            {(field) => (
              <Select
                value={field.state.value || undefined}
                onValueChange={(v) => field.handleChange(v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('addUnionModal.parent2')}>
                    {field.state.value && getPersonName(field.state.value, persons, nameOrder)}
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
            )}
          </form.Field>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t('addUnionModal.button.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('addUnionModal.button.creating') : t('addUnionModal.button.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
