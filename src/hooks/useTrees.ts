import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTree, deleteTree, listTrees, updateTree } from '@/lib/api/trees'
import { queryKeys } from '@/constants/queryKeys'
import type { Database } from '@/lib/database.types'

type Tree = Database['public']['Tables']['trees']['Row']

export function useTrees() {
  return useQuery({
    queryKey: queryKeys.trees(),
    queryFn: listTrees,
  })
}

export function useCreateTree() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createTree(name),
    onSuccess: (newTree) => {
      qc.setQueryData<Tree[]>(queryKeys.trees(), (prev) => [newTree, ...(prev ?? [])])
    },
  })
}

export function useDeleteTree() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTree(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Tree[]>(queryKeys.trees(), (prev) => prev?.filter((t) => t.id !== id) ?? [])
    },
  })
}

export function useUpdateTree() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateTree(id, { name }),
    onSuccess: (updatedTree) => {
      qc.setQueryData<Tree[]>(queryKeys.trees(), (prev) =>
        prev?.map((t) => (t.id === updatedTree.id ? updatedTree : t)) ?? []
      )
      qc.setQueryData<Tree>(queryKeys.tree(updatedTree.id), updatedTree)
    },
  })
}
