import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTree, deleteTree, listTrees, updateTree } from '@/lib/api/trees'

export function useTrees() {
  return useQuery({
    queryKey: ['trees'],
    queryFn: listTrees,
  })
}

export function useCreateTree() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createTree(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trees'] }),
  })
}

export function useDeleteTree() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTree(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trees'] }),
  })
}

export function useUpdateTree() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateTree(id, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trees'] }),
  })
}
