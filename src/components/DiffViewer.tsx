import { useState } from 'react'
import { computeDiff } from '../utils/diff'

interface DiffViewerProps {
  original: string
  modified: string
  leftLabel?: string
  title?: string
  defaultOpen?: boolean
  copyContent?: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
        copied
          ? 'border-green-300 text-green-700 bg-green-50'
          : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400'
      }`}
    >
      {copied ? '已复制 ✓' : '复制上一版本'}
    </button>
  )
}

export default function DiffViewer({
  original,
  modified,
  leftLabel = '原始模板（只读）',
  title,
  defaultOpen = true,
  copyContent,
}: DiffViewerProps) {
  const [open, setOpen] = useState(defaultOpen)
  const { leftHtml, rightHtml } = computeDiff(original, modified)

  return (
    <div className="mt-4">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <span>{open ? '▼' : '▶'}</span>
            <span>{title}</span>
            <span className="text-xs text-gray-400 ml-1">[{open ? '收起' : '展开'}]</span>
          </button>
          {copyContent && <CopyButton text={copyContent} />}
        </div>
      )}
      {open && (
        <div>
          <div className="grid grid-cols-2 border border-gray-200 rounded-lg overflow-hidden text-sm">
            <div className="bg-gray-50 border-r border-gray-200 px-3 py-2 text-xs text-gray-500 font-medium">
              {leftLabel}
            </div>
            <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 font-medium">
              生成结果（差异高亮）
            </div>
            <div
              className="px-3 py-3 border-r border-gray-200 max-h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: leftHtml }}
            />
            <div
              className="px-3 py-3 max-h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: rightHtml }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            差异说明：
            <span className="bg-green-100 text-green-800 px-1 rounded mx-1">绿色=新增</span>
            <span className="bg-red-100 text-red-800 line-through px-1 rounded mx-1">红色=删除</span>
          </p>
        </div>
      )}
    </div>
  )
}
