import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { TreeCanvas } from '@/components/TreeCanvas'
import { PersonDetailPanel } from '@/features/persons/PersonDetailPanel'
import { UnionDetailPanel } from '@/features/unions/UnionDetailPanel'
import { AddPersonModal } from '@/features/persons/AddPersonModal'
import { AddUnionModal } from '@/features/unions/AddUnionModal'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UserSettingsButton } from '@/features/settings/UserSettingsSheet'

export const Route = createLazyFileRoute('/_auth/trees/$treeId')({
  component: TreeEditor,
})

function TreeEditor() {
  const { t } = useTranslation()
  const { treeId } = Route.useParams()
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [selectedUnionId, setSelectedUnionId] = useState<string | null>(null)
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [showAddUnion, setShowAddUnion] = useState(false)

  return (
    <div className="flex h-screen flex-col">
      <nav className="flex items-center justify-between px-4 py-2 border-b bg-white z-10">
        <Link to="/dashboard" className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'p-0')}>
          ← {t('common.dashboard')}
        </Link>
        <div className="flex gap-2">
          <UserSettingsButton />
          <Button onClick={() => setShowAddPerson(true)}>
            {t('treeEditor.addPerson')}
          </Button>
          <Button variant="outline" onClick={() => setShowAddUnion(true)}>
            {t('treeEditor.addUnion')}
          </Button>
          <Link
            to="/trees/$treeId/settings"
            params={{ treeId }}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {t('common.settings')}
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
          open={!!selectedUnionId}
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
