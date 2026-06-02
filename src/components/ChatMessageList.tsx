import { useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import type { ChatMessage } from '../types'

interface ChatMessageListProps {
  messages: ChatMessage[]
}

function downloadExcel(data: Record<string, unknown>[], filename = 'data.xlsx') {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, filename)
}

function parseXlsxGenBlock(content: string): Record<string, unknown>[] | null {
  // Match complete block first, fall back to incomplete/truncated block
  const completeMatch = content.match(/```xlsx-gen\s*([\s\S]*?)\s*```/)
  const incompleteMatch = content.match(/```xlsx-gen\s*([\s\S]*)$/)
  const raw = (completeMatch?.[1] ?? incompleteMatch?.[1] ?? '').trim()
  if (!raw) return null

  const tryParse = (s: string) => {
    const parsed = JSON.parse(s)
    return Array.isArray(parsed) ? parsed as Record<string, unknown>[] : null
  }

  try {
    return tryParse(raw)
  } catch {
    // Repair truncated JSON array: remove trailing comma/partial object, close array
    const repaired = raw.replace(/,\s*\{[^}]*$/, '').replace(/,\s*$/, '') + ']'
    try { return tryParse(repaired) } catch { return null }
  }
}

function AssistantContent({ message }: { message: ChatMessage }) {
  if (message.hasError) return <span className="text-red-500">请求失败，请重试</span>

  if (message.excelMode && message.isStreaming) {
    return <span className="text-gray-400 text-xs animate-pulse">正在生成 Excel 数据…</span>
  }

  const xlsxData = !message.isStreaming ? parseXlsxGenBlock(message.content) : null
  const displayContent = message.excelMode
    ? message.content.replace(/```xlsx-gen[\s\S]*?(```|$)/g, '').trim()
    : message.content

  return (
    <>
      {displayContent && (
        <>
          <span className="whitespace-pre-wrap">{displayContent}</span>
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 align-middle animate-pulse" />
          )}
        </>
      )}
      {!displayContent && message.isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 align-middle animate-pulse" />
      )}
      {xlsxData && xlsxData.length > 0 && (
        <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-xs">
          <span className="text-green-700 font-medium">表格数据 · {xlsxData.length} 行</span>
          <button
            onClick={() => downloadExcel(xlsxData)}
            className="flex items-center gap-1 text-green-700 hover:text-green-900 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载 Excel
          </button>
        </div>
      )}
    </>
  )
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%]">
        {message.attachments?.map((att, i) => (
          <div key={i} className="flex justify-end mb-1">
            {att.type === 'image' ? (
              <img
                src={`data:${att.mimeType};base64,${att.content}`}
                alt={att.name}
                className="max-w-[200px] max-h-[200px] rounded-lg border border-blue-200 object-cover"
              />
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {att.name}
              </span>
            )}
          </div>
        ))}
        {message.content && (
          <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}
      </div>
    </div>
  )
}

function AssistantBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-800 leading-relaxed break-words shadow-sm">
        <AssistantContent message={message} />
      </div>
    </div>
  )
}

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm select-none">
        发送消息开始对话
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <UserBubble key={msg.id} message={msg} />
        ) : (
          <AssistantBubble key={msg.id} message={msg} />
        )
      )}
      <div ref={bottomRef} />
    </div>
  )
}
