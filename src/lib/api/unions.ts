import { supabase } from '../supabase'

export async function listUnions(treeId: string) {
  const { data, error } = await supabase
    .from('unions')
    .select(`
      *,
      union_members(person_id),
      union_children(person_id)
    `)
    .eq('tree_id', treeId)
  if (error) throw error
  return data
}

export async function createUnion(treeId: string) {
  const { data, error } = await supabase
    .from('unions')
    .insert({ tree_id: treeId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateUnionPosition(id: string, x: number, y: number) {
  const { error } = await supabase
    .from('unions')
    .update({ position_x: x, position_y: y })
    .eq('id', id)
  if (error) throw error
}

export async function addMember(unionId: string, personId: string) {
  const { error } = await supabase
    .from('union_members')
    .insert({ union_id: unionId, person_id: personId })
  if (error) throw error
}

export async function removeMember(unionId: string, personId: string) {
  const { error } = await supabase
    .from('union_members')
    .delete()
    .eq('union_id', unionId)
    .eq('person_id', personId)
  if (error) throw error
}

export async function addChild(unionId: string, personId: string) {
  const { error } = await supabase
    .from('union_children')
    .insert({ union_id: unionId, person_id: personId })
  if (error) throw error
}

export async function removeChild(unionId: string, personId: string) {
  const { error } = await supabase
    .from('union_children')
    .delete()
    .eq('union_id', unionId)
    .eq('person_id', personId)
  if (error) throw error
}

export async function deleteUnion(id: string) {
  const { error } = await supabase.from('unions').delete().eq('id', id)
  if (error) throw error
}
