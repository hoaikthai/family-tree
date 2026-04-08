import { useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    setError(null)
    const payload: Omit<PersonInsert, 'tree_id'> = {
      first_name: form.first_name,
      last_name: form.last_name ?? null,
      gender: (form.gender ?? null) as PersonInsert['gender'],
      birth_date: form.birth_date || null,
      is_birth_year_only: form.is_birth_year_only,
      death_date: form.death_date || null,
      is_death_year_only: form.is_death_year_only,
      notes: form.notes ?? null,
    }
    try {
      await createPerson.mutateAsync(payload)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add person')
    }
  }

  const genderLabels: Record<string, string> = {
    male: t('personForm.gender.male'),
    female: t('personForm.gender.female'),
    other: t('personForm.gender.other'),
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-96 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addPersonModal.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Input required placeholder={t('addPersonModal.firstName')} value={form.first_name}
            onChange={e => set('first_name', e.target.value)} />
          <Input placeholder={t('addPersonModal.lastName')} value={form.last_name}
            onChange={e => set('last_name', e.target.value)} />
          <Select
            value={form.gender ?? undefined}
            onValueChange={(v) => set('gender', v as typeof form.gender)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('personForm.gender')}>
                {form.gender && genderLabels[form.gender]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t('personForm.gender.male')}</SelectItem>
              <SelectItem value="female">{t('personForm.gender.female')}</SelectItem>
              <SelectItem value="other">{t('personForm.gender.other')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 items-center">
            <Input type="date" value={form.birth_date}
              onChange={e => set('birth_date', e.target.value)}
              className="flex-1" />
            <Label className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input type="checkbox" checked={form.is_birth_year_only}
                onChange={e => set('is_birth_year_only', e.target.checked)} />
              {t('addPersonModal.birthDateOnly')}
            </Label>
          </div>
          <div className="flex gap-2 items-center">
            <Input type="date" value={form.death_date}
              onChange={e => set('death_date', e.target.value)}
              className="flex-1" />
            <Label className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input type="checkbox" checked={form.is_death_year_only}
                onChange={e => set('is_death_year_only', e.target.checked)} />
              {t('personForm.deathDateOnly')}
            </Label>
          </div>
          <Textarea placeholder={t('personForm.notes')} value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className="resize-none h-20" />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('addPersonModal.button.cancel')}
            </Button>
            <Button type="submit" disabled={createPerson.isPending}>
              {createPerson.isPending ? t('addPersonModal.button.creating') : t('addPersonModal.button.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
