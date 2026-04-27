import { useState } from 'react'
import type { AlgorithmTool } from '../types'
import { ALGORITHM_TOOLS } from '../constants/tools'
import ToolDetailModal from './ToolDetailModal'

interface ToolSelectorProps {
  selectedIds: string[]
  onToggle: (id: string) => void
}

export default function ToolSelector({ selectedIds, onToggle }: ToolSelectorProps) {
  const [showModal, setShowModal] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">算法工具</span>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          查看全部工具说明 →
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALGORITHM_TOOLS.map((tool: AlgorithmTool) => {
          const selected = selectedIds.includes(tool.id)
          return (
            <div key={tool.id} className="relative">
              <button
                onClick={() => onToggle(tool.id)}
                onMouseEnter={() => setHoveredId(tool.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {selected && <span className="text-xs">✓</span>}
                {tool.name}
              </button>

              {hoveredId === tool.id && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-gray-800 text-white text-xs rounded px-2.5 py-1.5 max-w-[220px] whitespace-normal pointer-events-none shadow-lg">
                  {tool.description}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        💡 选中工具后，提示词中对应的功能描述将自动剔除
      </p>

      {showModal && <ToolDetailModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
