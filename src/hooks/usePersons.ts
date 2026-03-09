import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPerson, deletePerson, listPersons, updatePerson, uploadPhoto
} from '@/lib/api/persons'
import type { Database } from '@/lib/database.types'

type PersonInsert = Database['public']['Tables']['persons']['Insert']
type PersonUpdate = Database['public']['Tables']['persons']['Update']

export function usePersons(treeId: string) {
  return useQuery({
    queryKey: ['persons', treeId],
    queryFn: () => listPersons(treeId),
    enabled: !!treeId,
  })
}

export function useCreatePerson(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (person: Omit<PersonInsert, 'tree_id'>) =>
      createPerson({ ...person, tree_id: treeId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons', treeId] }),
  })
}

export function useUpdatePerson(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Omit<PersonUpdate, 'id' | 'tree_id'> }) =>
      updatePerson(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons', treeId] }),
  })
}

export function useDeletePerson(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons', treeId] }),
  })
}

export function useUploadPhoto(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ personId, file }: { personId: string; file: File }) =>
      uploadPhoto(treeId, personId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons', treeId] }),
  })
}
