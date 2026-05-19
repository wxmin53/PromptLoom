import { useState } from 'react'
import { ALGORITHM_TOOLS, TOOL_CATEGORIES } from '../constants/tools'

interface ToolDetailModalProps {
  onClose: () => void
}

export default function ToolDetailModal({ onClose }: ToolDetailModalProps) {
  const [search, setSearch] = useState('')

  const filtered = ALGORITHM_TOOLS.filter(
    (t) =>
      search === '' ||
      t.name.includes(search) ||
      t.fullDescription.includes(search) ||
      t.category.includes(search)
  )

  const groupedFiltered = TOOL_CATEGORIES.map((cat) => ({
    category: cat,
    tools: filtered.filter((t) => t.category === cat),
  })).filter((g) => g.tools.length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <span className="font-semibold text-gray-900">算法工具说明</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 pt-3 pb-2 shrink-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索工具名称、说明或分类…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-y-auto px-5 pb-4">
          {groupedFiltered.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">未找到匹配工具</p>
          ) : (
            <div className="space-y-5 pt-2">
              {groupedFiltered.map(({ category, tools }) => (
                <div key={category}>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {category}
                  </div>
                  <div className="space-y-4">
                    {tools.map((tool, i) => (
                      <div key={tool.id}>
                        {i > 0 && <div className="border-t border-gray-100 mb-4" />}
                        <div className="font-medium text-gray-900 mb-1">{tool.name}</div>
                        <p className="text-sm text-gray-600 leading-relaxed">{tool.fullDescription}</p>
                        {tool.usageTemplate && (
                          <pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-700 whitespace-pre-wrap font-mono">
                            {tool.usageTemplate}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
