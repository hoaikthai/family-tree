import { usePersons } from '@/hooks/usePersons'
import { useUnions, useUpdateChildPosition } from '@/hooks/useUnions'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type Props = {
  unionId: string | null
  treeId: string
  open: boolean
  onClose: () => void
}

export function UnionDetailPanel({ unionId, treeId, open, onClose }: Props) {
  const { data: unions } = useUnions(treeId)
  const { data: persons } = usePersons(treeId)
  const updatePos = useUpdateChildPosition(treeId)

  const union = unions?.find(u => u.id === unionId)
  const personMap = new Map(persons?.map(p => [p.id, p]) ?? [])

  const members = union?.union_members.map(m => personMap.get(m.person_id)).filter(Boolean) ?? []
  const children = union
    ? [...union.union_children]
        .sort((a, b) => a.position - b.position)
        .map(c => ({ ...c, person: personMap.get(c.person_id) }))
        .filter(c => c.person)
    : []

  async function move(personId: string, fromPos: number, toPos: number) {
    const swap = union!.union_children.find(c => c.position === toPos)
    if (!swap) return
    await updatePos.mutateAsync({ unionId: union!.id, personId, position: toPos })
    await updatePos.mutateAsync({ unionId: union!.id, personId: swap.person_id, position: fromPos })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        {union && (
          <>
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Family Unit</SheetTitle>
            </SheetHeader>

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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(c.person_id, c.position, children[i - 1].position)}
                          disabled={i === 0 || updatePos.isPending}
                          aria-label="Move up"
                          className="h-7 w-7"
                        >↑</Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(c.person_id, c.position, children[i + 1].position)}
                          disabled={i === children.length - 1 || updatePos.isPending}
                          aria-label="Move down"
                          className="h-7 w-7"
                        >↓</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
