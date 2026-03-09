import { supabase } from '../supabase'
import type { Database } from '../database.types'

type TreeUpdate = Database['public']['Tables']['trees']['Update']

// RLS on the trees table ensures only the authenticated user's trees are returned.
export async function listTrees() {
  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getTree(id: string) {
  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createTree(name: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('trees')
    .insert({ name, owner_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTree(id: string, updates: TreeUpdate) {
  const { data, error } = await supabase
    .from('trees')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTree(id: string) {
  const { error } = await supabase.from('trees').delete().eq('id', id)
  if (error) throw error
}

export async function togglePublic(id: string, isPublic: boolean) {
  return updateTree(id, { is_public: isPublic })
}
