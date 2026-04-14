import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPreferences,
  upsertPreferences,
  type UserPreferences,
} from '@/lib/api/userPreferences'
import { queryKeys } from '@/constants/queryKeys'

export function useUserPreferences() {
  return useQuery({
    queryKey: queryKeys.userPreferences(),
    queryFn: getPreferences,
  })
}

export function useUpdateUserPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertPreferences,
    onSuccess: (_, prefs) => {
      qc.setQueryData<UserPreferences>(queryKeys.userPreferences(), prefs)
    },
  })
}
