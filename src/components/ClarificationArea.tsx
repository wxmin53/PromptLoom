interface ClarificationAreaProps {
  isLoading: boolean
  hasError: boolean
  questions: string[]
  answers: string[]
  isGenerating: boolean
  onAnswerChange: (index: number, value: string) => void
  onSkip: () => void
  onConfirm: () => void
  onRetry: () => void
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${70 + i * 8}%` }} />
      ))}
    </div>
  )
}

export default function ClarificationArea({
  isLoading,
  hasError,
  questions,
  answers,
  isGenerating,
  onAnswerChange,
  onSkip,
  onConfirm,
  onRetry,
}: ClarificationAreaProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      {isLoading && (
        <div>
          <p className="text-sm text-gray-500 mb-4">AI 正在生成追问…</p>
          <Skeleton />
        </div>
      )}

      {hasError && !isLoading && (
        <div>
          <p className="text-sm text-red-500 mb-4">追问生成失败，不影响提示词生成</p>
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              重新生成追问
            </button>
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              跳过，直接生成
            </button>
          </div>
        </div>
      )}

      {!isLoading && !hasError && questions.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            AI 想进一步了解以下信息，有助于生成更精准的提示词（可只填部分，也可直接跳过）
          </p>
          <div className="space-y-4 mb-5">
            {questions.map((q, i) => (
              <div key={i}>
                <p className="text-sm text-gray-800 mb-1.5">
                  {i + 1}. {q}
                </p>
                <textarea
                  value={answers[i] ?? ''}
                  onChange={(e) => onAnswerChange(i, e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onSkip}
              disabled={isGenerating}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '生成中…' : '跳过，直接生成'}
            </button>
            <button
              onClick={onConfirm}
              disabled={isGenerating}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '生成中…' : '确认并生成'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
