import {
  ReactFlow, Background, Controls, MiniMap,
  applyNodeChanges,
} from '@xyflow/react'
import type { Node, Edge, OnNodesChange, NodeMouseHandler } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PersonNode } from './PersonNode'
import type { PersonNodeData } from './PersonNode'
import { UnionNode } from './UnionNode'
import { usePersons, useUpdatePerson } from '@/hooks/usePersons'
import { useUnions, useUpdateUnionPosition } from '@/hooks/useUnions'

const nodeTypes = {
  person: PersonNode,
  union: UnionNode,
}

interface Props {
  treeId: string
  readOnly?: boolean
  onPersonClick?: (personId: string) => void
}

export function TreeCanvas({ treeId, readOnly = false, onPersonClick }: Props) {
  const { data: persons = [] } = usePersons(treeId)
  const { data: unions = [] } = useUnions(treeId)
  const updatePerson = useUpdatePerson(treeId)
  const updateUnionPos = useUpdateUnionPosition(treeId)

  const serverNodes: Node[] = useMemo(() => [
    ...persons.map(p => ({
      id: `person-${p.id}`,
      type: 'person' as const,
      position: { x: p.position_x, y: p.position_y },
      data: {
        firstName: p.first_name,
        lastName: p.last_name ?? undefined,
        birthYear: p.birth_date ? new Date(p.birth_date).getFullYear() : undefined,
        photoUrl: p.photo_url ?? undefined,
        isDeceased: !!p.death_date,
        personId: p.id,
      } satisfies PersonNodeData,
      draggable: !readOnly,
    })),
    ...unions.map(u => ({
      id: `union-${u.id}`,
      type: 'union' as const,
      position: { x: u.position_x, y: u.position_y },
      data: {},
      draggable: !readOnly,
    })),
  ], [persons, unions, readOnly])

  const edges: Edge[] = useMemo(() => {
    const result: Edge[] = []
    for (const u of unions) {
      for (const { person_id } of (u.union_members ?? [])) {
        result.push({
          id: `member-${u.id}-${person_id}`,
          source: `person-${person_id}`,
          target: `union-${u.id}`,
        })
      }
      for (const { person_id } of (u.union_children ?? [])) {
        result.push({
          id: `child-${u.id}-${person_id}`,
          source: `union-${u.id}`,
          target: `person-${person_id}`,
        })
      }
    }
    return result
  }, [unions])

  const [localNodes, setLocalNodes] = useState<Node[]>(serverNodes)
  useEffect(() => { setLocalNodes(serverNodes) }, [serverNodes])

  const onNodesChange: OnNodesChange = useCallback(changes => {
    setLocalNodes(prev => applyNodeChanges(changes, prev))
  }, [])

  const onNodeDragStop: NodeMouseHandler = useCallback((_event, node) => {
    const { x, y } = node.position
    if (node.id.startsWith('person-')) {
      const personId = node.id.slice('person-'.length)
      updatePerson.mutate({ id: personId, updates: { position_x: x, position_y: y } })
    } else {
      const unionId = node.id.slice('union-'.length)
      updateUnionPos.mutate({ id: unionId, x, y })
    }
  }, [updatePerson, updateUnionPos])

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.id.startsWith('person-') && onPersonClick) {
      onPersonClick(node.id.slice('person-'.length))
    }
  }, [onPersonClick])

  return (
    <ReactFlow
      nodes={localNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={readOnly ? undefined : onNodesChange}
      onNodeDragStop={readOnly ? undefined : onNodeDragStop}
      onNodeClick={onNodeClick}
      fitView
      proOptions={{ hideAttribution: false }}
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  )
}
