import { useState } from 'react'
import { usePersons } from '@/hooks/usePersons'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useUnions, useAddChild, useRemoveChild, useUpdateChildPosition } from '@/hooks/useUnions'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getPersonName } from '@/lib/getPersonName'
import { DEFAULT_PREFERENCES } from '@/lib/api/userPreferences'

type Props = {
  unionId: string | null
  treeId: string
  open: boolean
  onClose: () => void
}

export function UnionDetailPanel({ unionId, treeId, open, onClose }: Props) {
  const { data: unions } = useUnions(treeId)
  const { data: persons } = usePersons(treeId)
  const { data: prefs } = useUserPreferences()
  const updatePos = useUpdateChildPosition(treeId)
  const addChild = useAddChild(treeId)
  const removeChild = useRemoveChild(treeId)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)

  const nameOrder = prefs?.name_order ?? DEFAULT_PREFERENCES.name_order

  const union = unions?.find(u => u.id === unionId)
  const personMap = new Map(persons?.map(p => [p.id, p]) ?? [])

  const members = union?.union_members.map(m => personMap.get(m.person_id)).filter(Boolean) ?? []
  const children = union
    ? [...union.union_children]
        .sort((a, b) => a.position - b.position)
        .map(c => ({ ...c, person: personMap.get(c.person_id) }))
        .filter(c => c.person)
    : []

  const assignedIds = new Set([
    ...(union?.union_members.map(m => m.person_id) ?? []),
    ...(union?.union_children.map(c => c.person_id) ?? []),
  ])
  const availablePersons = persons?.filter(p => !assignedIds.has(p.id)) ?? []

  async function handleAddChild() {
    if (!union || !selectedPersonId) return
    await addChild.mutateAsync({ unionId: union.id, personId: selectedPersonId })
    setSelectedPersonId('')
  }

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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChild.mutate({ unionId: union!.id, personId: c.person_id })}
                          disabled={removeChild.isPending}
                          aria-label="Remove child"
                          className="h-7 w-7 text-gray-400 hover:text-red-500"
                        >×</Button>
                      </li>
                    ))}
                  </ul>
                )}
                {availablePersons.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    <Select value={selectedPersonId || ''} onValueChange={setSelectedPersonId}>
                      <SelectTrigger className="flex-1 h-8 text-sm">
                        <SelectValue placeholder="Add child…">
                          {selectedPersonId && getPersonName(selectedPersonId, persons!, nameOrder)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availablePersons.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {getPersonName(p.id, availablePersons, nameOrder)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleAddChild}
                      disabled={!selectedPersonId || addChild.isPending}
                      className="h-8"
                    >Add</Button>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
