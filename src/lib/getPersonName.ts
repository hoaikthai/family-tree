import { formatName } from './formatName'
import type { Database } from './database.types'

type Person = Database['public']['Tables']['persons']['Row']

export function getPersonName(
  personId: string,
  persons: Person[],
  nameOrder: 'first-last' | 'last-first' = 'first-last',
): string {
  const person = persons.find(p => p.id === personId)
  return person ? formatName(person.first_name, person.last_name, nameOrder) : ''
}
