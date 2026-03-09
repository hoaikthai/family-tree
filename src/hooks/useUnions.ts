import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addChild, addMember, createUnion, deleteUnion,
  listUnions, removeChild, removeMember, updateUnionPosition
} from '@/lib/api/unions'

export function useUnions(treeId: string) {
  return useQuery({
    queryKey: ['unions', treeId],
    queryFn: () => listUnions(treeId),
    enabled: !!treeId,
  })
}

export function useCreateUnion(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => createUnion(treeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useDeleteUnion(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUnion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useAddMember(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ unionId, personId }: { unionId: string; personId: string }) =>
      addMember(unionId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useRemoveMember(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ unionId, personId }: { unionId: string; personId: string }) =>
      removeMember(unionId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useAddChild(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ unionId, personId }: { unionId: string; personId: string }) =>
      addChild(unionId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useRemoveChild(treeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ unionId, personId }: { unionId: string; personId: string }) =>
      removeChild(unionId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unions', treeId] }),
  })
}

export function useUpdateUnionPosition(_treeId: string) {
  // Fire-and-forget: position updates are debounced by the canvas; no query invalidation needed.
  // _treeId is accepted for API consistency but not used.
  return useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number }) =>
      updateUnionPosition(id, x, y),
  })
}
