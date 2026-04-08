export function formatDate(
  date: string | null,
  yearOnly: boolean | null,
  format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD',
): string {
  if (!date) return '—'
  if (yearOnly) return date.slice(0, 4)
  const d = new Date(date)
  const yyyy = d.getUTCFullYear().toString().padStart(4, '0')
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const dd = d.getUTCDate().toString().padStart(2, '0')
  switch (format) {
    case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`
    case 'YYYY-MM-DD': return `${yyyy}-${mm}-${dd}`
    default:           return `${mm}/${dd}/${yyyy}`
  }
}
