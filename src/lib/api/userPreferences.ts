import { supabase } from '../supabase'

export interface UserPreferences {
  name_order: 'first-last' | 'last-first'
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  language: 'en' | 'fr' | 'vi'
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  name_order: 'first-last',
  date_format: 'MM/DD/YYYY',
  language: 'en',
}

export async function getPreferences(): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('name_order, date_format, language')
    .maybeSingle()
  if (error) throw error
  if (!data) return DEFAULT_PREFERENCES
  return {
    name_order: data.name_order as UserPreferences['name_order'],
    date_format: data.date_format as UserPreferences['date_format'],
    language: data.language as UserPreferences['language'],
  }
}

export async function upsertPreferences(prefs: UserPreferences): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    })
  if (error) throw error
}
