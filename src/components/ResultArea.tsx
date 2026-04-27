import { useState, useRef, useEffect } from 'react'
import type { TuningMessage, GenerationType } from '../types'
import DiffViewer from './DiffViewer'
import TuningChat from './TuningChat'

interface ResultAreaProps {
  isLoading: boolean
  hasError: boolean
  result: string
  originalTemplate: string
  generationType: GenerationType
  tuningMessages: TuningMessage[]
  isTuningLoading: boolean
  tuningError: boolean
  onResultChange: (v: string) => void
  onRegenerate: () => void
  onSaveDraft: () => void
  onTuningSend: (instruction: string) => void
}

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse p-4">
      {[100, 85, 92, 70, 88, 75].map((w, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

export default function ResultArea({
  isLoading,
  hasError,
  result,
  originalTemplate,
  generationType,
  tuningMessages,
  isTuningLoading,
  tuningError,
  onResultChange,
  onRegenerate,
  onSaveDraft,
  onTuningSend,
}: ResultAreaProps) {
  const [diffOpen, setDiffOpen] = useState(true)
  const [savedFlash, setSavedFlash] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSave() {
    onSaveDraft()
    setSavedFlash(true)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSavedFlash(false), 2000)
  }

  useEffect(() => () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }, [])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">生成结果</span>
        {!isLoading && !hasError && (
          <div className="flex gap-2">
            <button
              onClick={onRegenerate}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              重新生成
            </button>
            <button
              onClick={handleSave}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                savedFlash
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {savedFlash ? '已保存 ✓' : '保存草稿'}
            </button>
          </div>
        )}
      </div>

      {isLoading && <Skeleton />}

      {hasError && !isLoading && (
        <div className="text-center py-8">
          <p className="text-sm text-red-500 mb-3">提示词生成失败，请重试</p>
          <button
            onClick={onRegenerate}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重新生成
          </button>
        </div>
      )}

      {!isLoading && !hasError && (
        <>
          <textarea
            value={result}
            onChange={(e) => onResultChange(e.target.value)}
            disabled={isTuningLoading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            style={{ minHeight: 500 }}
          />

          {generationType === 'template' && originalTemplate && (
            <div className="mt-4">
              <button
                onClick={() => setDiffOpen((v) => !v)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-2"
              >
                <span>{diffOpen ? '▼' : '▶'}</span>
                <span>与原始模板对比</span>
                <span className="text-xs text-gray-400 ml-1">[{diffOpen ? '收起' : '展开'}]</span>
              </button>
              {diffOpen && <DiffViewer original={originalTemplate} modified={result} />}
            </div>
          )}

          <TuningChat
            messages={tuningMessages}
            isLoading={isTuningLoading}
            hasError={tuningError}
            onSend={onTuningSend}
          />
        </>
      )}
    </div>
  )
}
