export function formatName(
  firstName: string,
  lastName: string | null | undefined,
  nameOrder: 'first-last' | 'last-first',
): string {
  const parts =
    nameOrder === 'first-last'
      ? [firstName, lastName]
      : [lastName, firstName]
  return parts.filter(Boolean).join(' ')
}
