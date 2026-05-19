import { useState, useEffect } from 'react'
import type { AlgorithmTool } from '../types'
import { ALGORITHM_TOOLS, TOOL_CATEGORIES } from '../constants/tools'
import ToolDetailModal from './ToolDetailModal'

interface ToolSelectorProps {
  selectedIds: string[]
  recommendedIds: string[]
  isRecommendationLoading: boolean
  onToggle: (id: string) => void
  onRecommend: () => void
}

export default function ToolSelector({
  selectedIds,
  recommendedIds,
  isRecommendationLoading,
  onToggle,
  onRecommend,
}: ToolSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    if (recommendedIds.length > 0) setIsExpanded(true)
  }, [recommendedIds])

  const toolsByCategory = TOOL_CATEGORIES.map((cat) => ({
    category: cat,
    tools: ALGORITHM_TOOLS.filter((t) => t.category === cat).sort((a, b) => {
      const aRec = recommendedIds.includes(a.id)
      const bRec = recommendedIds.includes(b.id)
      if (aRec && !bRec) return -1
      if (!aRec && bRec) return 1
      return 0
    }),
  }))

  const displayedCategories = activeCategory
    ? toolsByCategory.filter((g) => g.category === activeCategory)
    : toolsByCategory

  return (
    <div>
      {/* 头部：标签 + 已选 tags + 操作按钮 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700 shrink-0">算法工具</span>

        {selectedIds.length === 0 ? (
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '点击收起选择工具' : '点击展开选择工具'}
          </button>
        ) : (
          selectedIds.map((id) => {
            const tool = ALGORITHM_TOOLS.find((t) => t.id === id)
            if (!tool) return null
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                {tool.name}
                <button
                  onClick={() => onToggle(id)}
                  className="hover:text-blue-900 leading-none"
                  aria-label={`取消选择 ${tool.name}`}
                >
                  ×
                </button>
              </span>
            )
          })
        )}

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? '收起 ▲' : '展开 ▼'}
          </button>
          <button
            onClick={onRecommend}
            disabled={isRecommendationLoading}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRecommendationLoading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                推荐中…
              </>
            ) : (
              <>✦ 智能推荐</>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            查看说明 →
          </button>
        </div>
      </div>

      {/* 展开区：分类过滤 tab + 工具列表 */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* 分类过滤 tab 条 */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                activeCategory === null
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              全部
            </button>
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 工具标签区 */}
          {displayedCategories.map(({ category, tools }) => (
            <div key={category}>
              <div className="text-xs text-gray-400 mb-1.5">{category}</div>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool: AlgorithmTool) => {
                  const selected = selectedIds.includes(tool.id)
                  const recommended = recommendedIds.includes(tool.id)
                  return (
                    <div key={tool.id} className="relative">
                      <button
                        onClick={() => onToggle(tool.id)}
                        onMouseEnter={() => setHoveredId(tool.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : recommended
                            ? 'bg-blue-50 text-blue-700 border-blue-400 hover:bg-blue-100'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {selected && <span className="text-xs">✓</span>}
                        {recommended && !selected && <span className="text-xs text-blue-500">✦</span>}
                        {tool.name}
                      </button>

                      {hoveredId === tool.id && (
                        <div className="absolute left-0 top-full mt-1 z-50 bg-gray-800 text-white text-xs rounded px-2.5 py-1.5 max-w-[240px] whitespace-normal pointer-events-none shadow-lg">
                          {tool.description}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ToolDetailModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
