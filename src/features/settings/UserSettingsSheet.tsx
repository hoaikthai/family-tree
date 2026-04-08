import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { i18n, SUPPORTED_LANGUAGES } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useUserPreferences, useUpdateUserPreferences } from '@/hooks/useUserPreferences'
import type { UserPreferences } from '@/lib/api/userPreferences'

const settingsSchema = z.object({
  name_order: z.enum(['first-last', 'last-first']),
  date_format: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  language: z.enum(['en', 'vi']),
})

type SettingsValues = z.infer<typeof settingsSchema>

type Props = {
  open: boolean
  onClose: () => void
}

function SettingsForm({ prefs, onClose }: { prefs: UserPreferences; onClose: () => void }) {
  const { t } = useTranslation()
  const update = useUpdateUserPreferences()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name_order: prefs.name_order,
      date_format: prefs.date_format,
      language: prefs.language,
    } as SettingsValues,
    validators: { onChange: settingsSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        await update.mutateAsync(value)
        await i18n.changeLanguage(value.language)
        onClose()
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to save')
      }
    },
  })

  const nameOrderLabels: Record<string, string> = {
    'first-last': t('userSettingsSheet.nameOrder.firstLast'),
    'last-first': t('userSettingsSheet.nameOrder.lastFirst'),
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
      className="flex flex-col flex-1 min-h-0"
    >
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label>{t('userSettingsSheet.nameOrder')}</Label>
          <form.Field name="name_order">
            {(field) => (
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as SettingsValues['name_order'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{nameOrderLabels[field.state.value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first-last">{t('userSettingsSheet.nameOrder.firstLast')}</SelectItem>
                  <SelectItem value="last-first">{t('userSettingsSheet.nameOrder.lastFirst')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </form.Field>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('userSettingsSheet.dateFormat')}</Label>
          <form.Field name="date_format">
            {(field) => (
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as SettingsValues['date_format'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{field.state.value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            )}
          </form.Field>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('userSettingsSheet.language')}</Label>
          <form.Field name="language">
            {(field) => (
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as SettingsValues['language'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>
                      {t(`userSettingsSheet.language.${lang}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </form.Field>
        </div>
      </div>

      <div className="border-t p-4 flex flex-col gap-2">
        {submitError && <p className="text-red-600 text-xs">{submitError}</p>}
        <Button type="submit" className="w-full" disabled={update.isPending}>
          {update.isPending ? t('userSettingsSheet.button.saving') : t('userSettingsSheet.button.save')}
        </Button>
      </div>
    </form>
  )
}

export function UserSettingsSheet({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { data: prefs } = useUserPreferences()

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="font-bold text-base">{t('userSettingsSheet.title')}</SheetTitle>
        </SheetHeader>
        {prefs && <SettingsForm prefs={prefs} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

export function UserSettingsButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label="Settings">
        <Settings className="size-4" />
      </Button>
      <UserSettingsSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
