import { computeDiff } from '../utils/diff'

interface DiffViewerProps {
  original: string
  modified: string
}

export default function DiffViewer({ original, modified }: DiffViewerProps) {
  const { leftHtml, rightHtml } = computeDiff(original, modified)

  return (
    <div>
      <div className="grid grid-cols-2 border border-gray-200 rounded-lg overflow-hidden text-sm">
        <div className="bg-gray-50 border-r border-gray-200 px-3 py-2 text-xs text-gray-500 font-medium">
          原始模板（只读）
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
  )
}
