import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

export interface PersonNodeData {
  firstName: string
  lastName?: string
  birthYear?: number
  photoUrl?: string
  isDeceased?: boolean
  personId: string
  [key: string]: unknown
}

export function PersonNode({ data, selected }: NodeProps<PersonNodeData>) {
  const name = [data.firstName, data.lastName].filter(Boolean).join(' ')
  return (
    <div className={`
      bg-white border-2 rounded-xl shadow-sm w-36 overflow-hidden cursor-pointer
      ${selected ? 'border-blue-500' : 'border-gray-200'}
      ${data.isDeceased ? 'opacity-70' : ''}
    `}>
      <Handle type="target" position={Position.Top} />
      <div className="w-full h-20 bg-gray-100 flex items-center justify-center overflow-hidden">
        {data.photoUrl ? (
          <img src={data.photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl text-gray-400 select-none">
            {data.firstName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="px-2 py-1 text-center">
        <p className="text-xs font-semibold truncate">{name}</p>
        {data.birthYear && (
          <p className="text-[10px] text-gray-500">{data.birthYear}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
