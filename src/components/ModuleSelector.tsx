import { PROMPT_MODULES } from '../constants/modules'
import type { PromptModule } from '../types'

interface ModuleSelectorProps {
  selectedIds: string[]
  onToggle: (id: string) => void
}

export default function ModuleSelector({ selectedIds, onToggle }: ModuleSelectorProps) {
  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-3">提示词模块</div>
      <div className="flex flex-wrap gap-2">
        {PROMPT_MODULES.map((mod: PromptModule) => {
          const selected = selectedIds.includes(mod.id)
          return (
            <button
              key={mod.id}
              onClick={() => onToggle(mod.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                selected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {mod.name}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-2">💡 选中后对应固定话术将追加至提示词末尾</p>
    </div>
  )
}
