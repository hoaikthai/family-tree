import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { formatName } from '@/lib/formatName'
import { DEFAULT_PREFERENCES } from '@/lib/api/userPreferences'

export interface PersonNodeData {
  firstName: string
  lastName?: string
  birthYear?: number
  photoUrl?: string
  isDeceased?: boolean
  personId: string
  [key: string]: unknown
}

export function PersonNode({ data, selected }: NodeProps) {
  const d = data as PersonNodeData
  const { data: prefs } = useUserPreferences()
  const nameOrder = prefs?.name_order ?? DEFAULT_PREFERENCES.name_order
  const name = formatName(d.firstName, d.lastName, nameOrder)

  return (
    <div className={`
      bg-white border-2 rounded-xl shadow-sm w-36 overflow-hidden cursor-pointer
      ${selected ? 'border-blue-500' : 'border-gray-200'}
      ${d.isDeceased ? 'opacity-70' : ''}
    `}>
      <Handle type="target" position={Position.Top} />
      <div className="w-full h-20 bg-gray-100 flex items-center justify-center overflow-hidden">
        {d.photoUrl ? (
          <img src={d.photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl text-gray-400 select-none">
            {d.firstName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="px-2 py-1 text-center">
        <p className="text-xs font-semibold truncate">{name}</p>
        {d.birthYear && (
          <p className="text-[10px] text-gray-500">{d.birthYear}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
