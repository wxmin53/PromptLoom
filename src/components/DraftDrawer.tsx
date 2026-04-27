import { useState } from 'react'
import type { Draft } from '../types'
import { getSessionDrafts, getSavedDrafts, deleteSavedDraft } from '../hooks/useDrafts'
import { formatDraftDate, formatDraftPreview } from '../utils/draft'

interface DraftDrawerProps {
  onClose: () => void
  onRestore: (draft: Draft) => void
}

type Tab = 'session' | 'saved'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`text-xs transition-colors ${
        copied ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {copied ? '已复制 ✓' : '复制'}
    </button>
  )
}

export default function DraftDrawer({ onClose, onRestore }: DraftDrawerProps) {
  const [tab, setTab] = useState<Tab>('session')
  const [savedDrafts, setSavedDrafts] = useState<Draft[]>(() => getSavedDrafts())
  const sessionDrafts = getSessionDrafts()

  function handleDelete(id: string) {
    deleteSavedDraft(id)
    setSavedDrafts(getSavedDrafts())
  }

  const drafts = tab === 'session' ? sessionDrafts : savedDrafts

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[400px] h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">历史草稿</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {(['session', 'saved'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'session' ? '本次会话' : '已保存'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {drafts.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-12">暂无草稿</div>
          ) : (
            drafts.map((draft) => (
              <div key={draft.id} className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{formatDraftDate(draft.createdAt)}</span>
                  <span className="text-xs text-gray-500">
                    {draft.generationType === 'template' ? '模板生成' : '无模板生成'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{formatDraftPreview(draft)}</p>
                <div className="flex justify-end gap-3">
                  <CopyButton text={draft.result} />
                  {tab === 'saved' && (
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      删除
                    </button>
                  )}
                  <button
                    onClick={() => onRestore(draft)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    恢复
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
