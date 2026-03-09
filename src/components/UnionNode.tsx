import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

export function UnionNode({ selected }: NodeProps) {
  return (
    <div className={`
      w-5 h-5 rounded-full border-2 bg-white
      ${selected ? 'border-blue-500' : 'border-gray-400'}
    `}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Right} id="right" />
    </div>
  )
}
