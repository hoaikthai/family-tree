import { z } from 'zod'

export const personSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birth_date: z.string(),
  is_birth_year_only: z.boolean(),
  death_date: z.string(),
  is_death_year_only: z.boolean(),
  notes: z.string(),
})

export type PersonFormValues = z.infer<typeof personSchema>
