import { supabase } from '../supabase'
import type { Database } from '../database.types'

type PersonInsert = Database['public']['Tables']['persons']['Insert']
type PersonUpdate = Database['public']['Tables']['persons']['Update']

export async function listPersons(treeId: string) {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('tree_id', treeId)
  if (error) throw error
  return data
}

export async function createPerson(person: PersonInsert) {
  const { data, error } = await supabase
    .from('persons')
    .insert(person)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePerson(id: string, updates: PersonUpdate) {
  const { data, error } = await supabase
    .from('persons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePerson(id: string) {
  const { error } = await supabase.from('persons').delete().eq('id', id)
  if (error) throw error
}

export async function uploadPhoto(treeId: string, personId: string, file: File) {
  const ext = file.name.split('.').pop()
  const path = `${treeId}/${personId}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
