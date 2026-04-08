import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { TreeCanvas } from '@/components/TreeCanvas'
import { PersonDetailPanel } from '@/components/PersonDetailPanel'
import { UnionDetailPanel } from '@/components/UnionDetailPanel'
import { AddPersonModal } from '@/components/AddPersonModal'
import { AddUnionModal } from '@/components/AddUnionModal'

export const Route = createFileRoute('/_auth/trees/$treeId')({
  component: TreeEditor,
})

function TreeEditor() {
  const { treeId } = Route.useParams()
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [selectedUnionId, setSelectedUnionId] = useState<string | null>(null)
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [showAddUnion, setShowAddUnion] = useState(false)

  return (
    <div className="flex h-screen flex-col">
      <nav className="flex items-center justify-between px-4 py-2 border-b bg-white z-10">
        <Link to="/dashboard" className="text-sm text-blue-600 underline">← Dashboard</Link>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddPerson(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">
            Add person
          </button>
          <button
            onClick={() => setShowAddUnion(true)}
            className="border px-3 py-1.5 rounded text-sm">
            Add union
          </button>
          <Link to="/trees/$treeId/settings" params={{ treeId }}
            className="border px-3 py-1.5 rounded text-sm">
            Settings
          </Link>
        </div>
      </nav>
      <div className="flex-1 relative">
        <TreeCanvas
          treeId={treeId}
          onPersonClick={id => { setSelectedPersonId(id); setSelectedUnionId(null); setShowAddPerson(false) }}
          onUnionClick={id => { setSelectedUnionId(id); setSelectedPersonId(null) }}
        />
        <PersonDetailPanel
          treeId={treeId}
          personId={selectedPersonId}
          open={!!selectedPersonId}
          onClose={() => setSelectedPersonId(null)}
        />
        <UnionDetailPanel
          unionId={selectedUnionId}
          treeId={treeId}
          onClose={() => setSelectedUnionId(null)}
        />
      </div>
      <AddPersonModal
        treeId={treeId}
        open={showAddPerson}
        onClose={() => setShowAddPerson(false)}
      />
      <AddUnionModal
        treeId={treeId}
        open={showAddUnion}
        onClose={() => setShowAddUnion(false)}
      />
    </div>
  )
}
