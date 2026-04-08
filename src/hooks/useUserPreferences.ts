import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPreferences,
  upsertPreferences,
} from '@/lib/api/userPreferences'

export function useUserPreferences() {
  return useQuery({
    queryKey: ['user_preferences'],
    queryFn: getPreferences,
  })
}

export function useUpdateUserPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertPreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_preferences'] }),
  })
}
