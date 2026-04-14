import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPerson, deletePerson, listPersons, updatePerson, uploadPhoto
} from '@/lib/api/persons'
import { queryKeys } from '@/constants/queryKeys'
import type { Database } from '@/lib/database.types'

type PersonInsert = Database['public']['Tables']['persons']['Insert']
type PersonUpdate = Database['public']['Tables']['persons']['Update']
type Person = Database['public']['Tables']['persons']['Row']

export function usePersons(treeId: string) {
  return useQuery({
    queryKey: queryKeys.persons(treeId),
    queryFn: () => listPersons(treeId),
    enabled: !!treeId,
  })
}

export function useCreatePerson(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (person: Omit<PersonInsert, 'tree_id'>) =>
      createPerson({ ...person, tree_id: treeId }),
    onSuccess: (newPerson) => {
      qc.setQueryData<Person[]>(queryKeys.persons(treeId), (prev) => [...(prev ?? []), newPerson])
    },
  })
}

export function useUpdatePerson(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Omit<PersonUpdate, 'id' | 'tree_id'> }) =>
      updatePerson(id, updates),
    onSuccess: (updatedPerson) => {
      qc.setQueryData<Person[]>(queryKeys.persons(treeId), (prev) =>
        prev?.map((p) => (p.id === updatedPerson.id ? updatedPerson : p)) ?? []
      )
    },
  })
}

export function useDeletePerson(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Person[]>(queryKeys.persons(treeId), (prev) =>
        prev?.filter((p) => p.id !== id) ?? []
      )
    },
  })
}

export function useUploadPhoto(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ personId, file }: { personId: string; file: File }) =>
      uploadPhoto(treeId, personId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.persons(treeId) }),
  })
}
