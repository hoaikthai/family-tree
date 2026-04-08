import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { i18n, SUPPORTED_LANGUAGES } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUserPreferences, useUpdateUserPreferences } from '@/hooks/useUserPreferences'
import type { UserPreferences } from '@/lib/api/userPreferences'
import { DEFAULT_PREFERENCES } from '@/lib/api/userPreferences'

interface Props {
  open: boolean
  onClose: () => void
}

export function UserSettingsSheet({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { data: prefs } = useUserPreferences()
  const update = useUpdateUserPreferences()

  const [form, setForm] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (prefs) setForm(prefs)
  }, [prefs])

  function set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const nameOrderLabels: Record<string, string> = {
    'first-last': t('userSettingsSheet.nameOrder.firstLast'),
    'last-first': t('userSettingsSheet.nameOrder.lastFirst'),
  }

  async function handleSave() {
    setSaveError(null)
    try {
      await update.mutateAsync(form)
      // Change i18n language to match saved preference
      await i18n.changeLanguage(form.language)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="font-bold text-base">{t('userSettingsSheet.title')}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label>{t('userSettingsSheet.nameOrder')}</Label>
            <Select
              value={form.name_order}
              onValueChange={v => set('name_order', v as UserPreferences['name_order'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {nameOrderLabels[form.name_order]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first-last">{t('userSettingsSheet.nameOrder.firstLast')}</SelectItem>
                <SelectItem value="last-first">{t('userSettingsSheet.nameOrder.lastFirst')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('userSettingsSheet.dateFormat')}</Label>
            <Select
              value={form.date_format}
              onValueChange={v => set('date_format', v as UserPreferences['date_format'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {form.date_format}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('userSettingsSheet.language')}</Label>
            <Select
              value={form.language}
              onValueChange={v => set('language', v as UserPreferences['language'])}
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
          </div>
        </div>

        <div className="border-t p-4 flex flex-col gap-2">
          {saveError && <p className="text-red-600 text-xs">{saveError}</p>}
          <Button className="w-full" onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? t('userSettingsSheet.button.saving') : t('userSettingsSheet.button.save')}
          </Button>
        </div>
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
