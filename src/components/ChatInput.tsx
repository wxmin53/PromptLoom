import { useRef, useState, type KeyboardEvent } from 'react'
import * as XLSX from 'xlsx'
import type { ChatFileAttachment } from '../types'

const MAX_FILE_BYTES = 4 * 1024 * 1024

const ACCEPTED_TEXT_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json']
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const ACCEPTED_EXCEL_EXTS = ['.xlsx', '.xls']

const ACCEPT_ATTR = [
  ...ACCEPTED_TEXT_TYPES,
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_EXCEL_EXTS,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
].join(',')

interface ChatInputProps {
  attachments: ChatFileAttachment[]
  isLoading: boolean
  onSend: (text: string, excelMode: boolean) => void
  onStop: () => void
  onAddAttachment: (file: ChatFileAttachment) => void
  onRemoveAttachment: (index: number) => void
}

export default function ChatInput({
  attachments,
  isLoading,
  onSend,
  onStop,
  onAddAttachment,
  onRemoveAttachment,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const [excelMode, setExcelMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState('')

  function handleSend() {
    if (isLoading) return
    if (!text.trim() && attachments.length === 0) return
    onSend(text, excelMode)
    setText('')
    setExcelMode(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    setFileError('')

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`${file.name} 超过 4MB 限制`)
        continue
      }

      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type)
      const isExcel =
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel'

      const reader = new FileReader()

      if (isImage) {
        reader.onload = () => {
          const dataUrl = reader.result as string
          const base64 = dataUrl.split(',')[1] ?? dataUrl
          onAddAttachment({ name: file.name, type: 'image', mimeType: file.type, content: base64, size: file.size })
        }
        reader.readAsDataURL(file)
      } else if (isExcel) {
        reader.onload = () => {
          try {
            const wb = XLSX.read(reader.result as ArrayBuffer, { type: 'array' })
            const parts: string[] = wb.SheetNames.map((name) => {
              const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name])
              return wb.SheetNames.length > 1 ? `=== Sheet: ${name} ===\n${csv}` : csv
            })
            onAddAttachment({ name: file.name, type: 'text', mimeType: 'text/csv', content: parts.join('\n\n'), size: file.size })
          } catch {
            setFileError(`${file.name} 解析失败，请确认文件完整`)
          }
        }
        reader.readAsArrayBuffer(file)
      } else {
        reader.onload = () => {
          onAddAttachment({ name: file.name, type: 'text', mimeType: file.type || 'text/plain', content: reader.result as string, size: file.size })
        }
        reader.readAsText(file)
      }
    }
  }

  const canSend = !isLoading && (text.trim().length > 0 || attachments.length > 0)

  return (
    <div className="border-t border-gray-200 bg-white px-4 pt-3 pb-4">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1 text-xs text-gray-700">
              {att.type === 'image' ? (
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span className="max-w-[120px] truncate">{att.name}</span>
              <button onClick={() => onRemoveAttachment(i)} className="ml-0.5 text-gray-400 hover:text-gray-600 leading-none" aria-label="移除附件">×</button>
            </div>
          ))}
        </div>
      )}

      {fileError && <p className="text-xs text-red-500 mb-2">{fileError}</p>}

      <div className="flex items-end gap-2">
        {/* File upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="上传文件"
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="上传文件"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Excel mode toggle */}
        <button
          onClick={() => setExcelMode((v) => !v)}
          title={excelMode ? '已开启 Excel 输出模式，点击关闭' : '开启 Excel 输出模式'}
          className={`flex-shrink-0 h-8 px-2.5 flex items-center gap-1 rounded-lg text-xs font-medium transition-colors ${
            excelMode
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          aria-pressed={excelMode}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={excelMode ? '描述你需要的表格内容，将强制输出 Excel 文件…' : '输入消息，Enter 发送，Shift+Enter 换行'}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed max-h-40 overflow-y-auto"
          style={{ minHeight: '38px' }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${Math.min(el.scrollHeight, 160)}px`
          }}
        />

        {/* Stop / Send button */}
        {isLoading ? (
          <button
            onClick={onStop}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            aria-label="停止"
            title="停止生成"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="发送"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" hidden multiple accept={ACCEPT_ATTR} onChange={handleFileChange} />
    </div>
  )
}
