import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { PersonFormValues } from './personSchema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type PersonFormProps = {
  defaultValues?: Partial<PersonFormValues>
  onSubmit: (values: PersonFormValues) => Promise<void>
  isPending: boolean
  onCancel: () => void
  submitLabel: string
  pendingLabel: string
  cancelLabel: string
  className?: string
}

export function PersonForm({
  defaultValues,
  onSubmit,
  isPending,
  onCancel,
  submitLabel,
  pendingLabel,
  cancelLabel,
  className,
}: PersonFormProps) {
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      first_name: defaultValues?.first_name ?? '',
      last_name: defaultValues?.last_name ?? '',
      gender: defaultValues?.gender,
      birth_date: defaultValues?.birth_date ?? '',
      is_birth_year_only: defaultValues?.is_birth_year_only ?? false,
      death_date: defaultValues?.death_date ?? '',
      is_death_year_only: defaultValues?.is_death_year_only ?? false,
      notes: defaultValues?.notes ?? '',
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        await onSubmit(value as PersonFormValues)
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to submit')
      }
    },
  })

  const genderLabels: Record<string, string> = {
    male: t('personForm.gender.male'),
    female: t('personForm.gender.female'),
    other: t('personForm.gender.other'),
  }

  function fieldError(errors: unknown[]): string | null {
    if (!errors.length) return null
    const e = errors[0]
    return typeof e === 'string' ? e : (e as { message: string }).message
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
      className={cn('flex flex-col gap-3', className)}
    >
      {submitError && <p className="text-red-600 text-sm">{submitError}</p>}

      <form.Field
        name="first_name"
        validators={{ onChange: ({ value }) => value.length === 0 ? 'Required' : undefined }}
      >
        {(field) => (
          <div>
            <Input
              placeholder={t('addPersonModal.firstName')}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && fieldError(field.state.meta.errors) && (
              <p className="text-red-600 text-xs mt-1">{fieldError(field.state.meta.errors)}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="last_name">
        {(field) => (
          <Input
            placeholder={t('addPersonModal.lastName')}
            value={field.state.value ?? ''}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <form.Field name="gender">
        {(field) => (
          <Select
            value={field.state.value ?? ''}
            onValueChange={(v) =>
              field.handleChange(v === '' ? undefined : (v as PersonFormValues['gender']))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('personForm.gender')}>
                {field.state.value && genderLabels[field.state.value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('personForm.gender.unset')}</SelectItem>
              <SelectItem value="male">{t('personForm.gender.male')}</SelectItem>
              <SelectItem value="female">{t('personForm.gender.female')}</SelectItem>
              <SelectItem value="other">{t('personForm.gender.other')}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </form.Field>

      <div className="flex gap-2 items-center">
        <form.Field name="birth_date">
          {(field) => (
            <Input
              type="date"
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className="flex-1"
            />
          )}
        </form.Field>
        <form.Field name="is_birth_year_only">
          {(field) => (
            <Label className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              {t('addPersonModal.birthDateOnly')}
            </Label>
          )}
        </form.Field>
      </div>

      <div className="flex gap-2 items-center">
        <form.Field name="death_date">
          {(field) => (
            <Input
              type="date"
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className="flex-1"
            />
          )}
        </form.Field>
        <form.Field name="is_death_year_only">
          {(field) => (
            <Label className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              {t('personForm.deathDateOnly')}
            </Label>
          )}
        </form.Field>
      </div>

      <form.Field name="notes">
        {(field) => (
          <Textarea
            placeholder={t('personForm.notes')}
            value={field.state.value ?? ''}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            className="resize-none h-20"
          />
        )}
      </form.Field>

      <div className="flex gap-2 mt-auto pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}
