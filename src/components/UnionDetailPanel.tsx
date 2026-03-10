import { usePersons } from '@/hooks/usePersons'
import { useUnions, useUpdateChildPosition } from '@/hooks/useUnions'

type Props = {
  unionId: string | null
  treeId: string
  onClose: () => void
}

export function UnionDetailPanel({ unionId, treeId, onClose }: Props) {
  const { data: unions } = useUnions(treeId)
  const { data: persons } = usePersons(treeId)
  const updatePos = useUpdateChildPosition(treeId)

  if (!unionId) return null
  const union = unions?.find(u => u.id === unionId)
  if (!union) return null

  const personMap = new Map(persons?.map(p => [p.id, p]) ?? [])

  const members = union.union_members.map(m => personMap.get(m.person_id)).filter(Boolean)
  const children = [...union.union_children]
    .sort((a, b) => a.position - b.position)
    .map(c => ({ ...c, person: personMap.get(c.person_id) }))
    .filter(c => c.person)

  async function move(personId: string, fromPos: number, toPos: number) {
    // find the child currently at toPos
    const swap = union!.union_children.find(c => c.position === toPos)
    if (!swap) return
    await updatePos.mutateAsync({ unionId: union!.id, personId, position: toPos })
    await updatePos.mutateAsync({ unionId: union!.id, personId: swap.person_id, position: fromPos })
  }

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l shadow-lg flex flex-col z-10">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-semibold text-lg">Family Unit</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Parents</h3>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No parents</p>
          ) : (
            <ul className="space-y-1">
              {members.map(p => (
                <li key={p!.id} className="text-sm">{p!.first_name} {p!.last_name ?? ''}</li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Children</h3>
          {children.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No children</p>
          ) : (
            <ul className="space-y-2">
              {children.map((c, i) => (
                <li key={c.person_id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">
                    {c.person!.first_name} {c.person!.last_name ?? ''}
                    {c.person!.birth_date && (
                      <span className="text-gray-400 ml-1">
                        b. {c.person!.is_birth_year_only
                          ? c.person!.birth_date.slice(0, 4)
                          : c.person!.birth_date}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => move(c.person_id, c.position, children[i - 1].position)}
                    disabled={i === 0 || updatePos.isPending}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    aria-label="Move up"
                  >↑</button>
                  <button
                    onClick={() => move(c.person_id, c.position, children[i + 1].position)}
                    disabled={i === children.length - 1 || updatePos.isPending}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    aria-label="Move down"
                  >↓</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
