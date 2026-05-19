import { useState } from 'react'
import type { PromptModule } from '../types'

interface ModuleSelectorProps {
  modules: PromptModule[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onAdd: (name: string, content: string) => void
  onUpdate: (id: string, name: string, content: string) => void
  onDelete: (id: string) => void
}

interface EditModalProps {
  initial?: PromptModule
  onSave: (name: string, content: string) => void
  onClose: () => void
}

function EditModal({ initial, onSave, onClose }: EditModalProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [error, setError] = useState('')

  function handleSave() {
    if (!name.trim()) { setError('请填写模块名称'); return }
    if (!content.trim()) { setError('请填写模块内容'); return }
    onSave(name.trim(), content.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">
            {initial ? '编辑提示词模块' : '新建提示词模块'}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">模块名称</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="如：引导加微·主动"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">模块内容</label>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setError('') }}
              placeholder="输入固定话术内容，生成时将原样插入提示词相应位置"
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ModuleSelector({
  modules,
  selectedIds,
  onToggle,
  onAdd,
  onUpdate,
  onDelete,
}: ModuleSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingModule, setEditingModule] = useState<PromptModule | null | 'new'>(null)

  function handleSave(name: string, content: string) {
    if (editingModule === 'new') {
      onAdd(name, content)
    } else if (editingModule) {
      onUpdate(editingModule.id, name, content)
    }
    setEditingModule(null)
  }

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700 shrink-0">提示词模块</span>

        {selectedIds.length === 0 ? (
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '点击收起' : modules.length === 0 ? '点击展开添加模块' : '点击展开选择模块'}
          </button>
        ) : (
          selectedIds.map((id) => {
            const mod = modules.find((m) => m.id === id)
            if (!mod) return null
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                {mod.name}
                <button
                  onClick={() => onToggle(id)}
                  className="hover:text-blue-900 leading-none"
                  aria-label={`取消选择 ${mod.name}`}
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
            onClick={() => setEditingModule('new')}
            className="text-xs px-2.5 py-1 rounded-md border border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
          >
            + 新建模块
          </button>
        </div>
      </div>

      {/* 展开区 */}
      {isExpanded && (
        <div className="mt-3">
          {modules.length === 0 ? (
            <p className="text-sm text-gray-400">暂无模块，点击「+ 新建模块」添加</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {modules.map((mod) => {
                const selected = selectedIds.includes(mod.id)
                return (
                  <div
                    key={mod.id}
                    className={`flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-sm border transition-all ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => onToggle(mod.id)}
                      className="flex items-center gap-1"
                    >
                      {selected && <span className="text-xs">✓</span>}
                      {mod.name}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingModule(mod) }}
                      className={`ml-1 px-1 rounded text-xs transition-colors ${
                        selected
                          ? 'text-blue-200 hover:text-white hover:bg-blue-500'
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="编辑"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(mod.id) }}
                      className={`px-1 rounded text-xs transition-colors ${
                        selected
                          ? 'text-blue-200 hover:text-white hover:bg-blue-500'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {editingModule !== null && (
        <EditModal
          initial={editingModule === 'new' ? undefined : editingModule}
          onSave={handleSave}
          onClose={() => setEditingModule(null)}
        />
      )}
    </div>
  )
}
