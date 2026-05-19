import { useState, useRef, useEffect } from 'react'
import type { TuningMessage } from '../types'

interface TuningChatProps {
  messages: TuningMessage[]
  isLoading: boolean
  hasError: boolean
  pendingTuningResult: string
  onSend: (instruction: string) => void
  onConfirm: () => void
}

function AssistantBubble({
  content,
  showConfirm,
  onConfirm,
}: {
  content: string
  showConfirm: boolean
  onConfirm: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="w-full bg-gray-100 text-gray-800 rounded-lg text-sm">
      <div className="px-3 pt-2 pb-1">
        <p className="text-xs text-gray-500 mb-1.5">AI 已完成修改，预览如下：</p>
        <textarea
          readOnly
          value={content}
          className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
          style={{ height: expanded ? Math.min(content.split('\n').length * 22 + 24, 600) : 120 }}
        />
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-blue-500 hover:text-blue-700 mt-1"
        >
          {expanded ? '收起 ▲' : '展开查看完整内容 ▼'}
        </button>
      </div>
      {showConfirm && (
        <div className="px-3 pb-2">
          <button
            onClick={onConfirm}
            className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
          >
            确认应用到生成结果
          </button>
        </div>
      )}
    </div>
  )
}

export default function TuningChat({
  messages,
  isLoading,
  hasError,
  pendingTuningResult,
  onSend,
  onConfirm,
}: TuningChatProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [input])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, pendingTuningResult])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasPending = !!pendingTuningResult
  const showBubbles = messages.length > 0 || isLoading

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="text-sm font-medium text-gray-700 mb-3">对话微调</div>

      {showBubbles && (
        <div className="space-y-2 mb-3">
          {messages.map((msg, i) => {
            const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1
            return (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' ? (
                  <AssistantBubble
                    content={msg.content}
                    showConfirm={isLastAssistant && hasPending}
                    onConfirm={onConfirm}
                  />
                ) : (
                  <div className="max-w-[85%] px-3 py-2 rounded-lg text-sm bg-blue-600 text-white whitespace-pre-wrap">
                    {msg.content}
                  </div>
                )}
              </div>
            )
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-sm flex items-center gap-1.5">
                <span className="inline-flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                AI 正在生成修改方案…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {hasError && (
        <p className="text-xs text-red-500 mb-2">微调失败，请重试</p>
      )}

      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你想要的修改，例如：把开场白改得更亲切（Shift+Enter 换行）"
          disabled={isLoading}
          rows={1}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 resize-none overflow-hidden"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          发送
        </button>
      </div>
    </div>
  )
}
