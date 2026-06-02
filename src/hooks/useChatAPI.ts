import type { ChatMessage, ChatFileAttachment } from '../types'

type ApiContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

function buildMessageContent(
  text: string,
  attachments: ChatFileAttachment[] = []
): string | ApiContentBlock[] {
  if (attachments.length === 0) return text

  const blocks: ApiContentBlock[] = []
  for (const att of attachments) {
    if (att.type === 'image') {
      blocks.push({ type: 'image', source: { type: 'base64', media_type: att.mimeType, data: att.content } })
    } else {
      blocks.push({ type: 'text', text: `[文件：${att.name}]\n${att.content}` })
    }
  }
  if (text.trim()) blocks.push({ type: 'text', text })
  return blocks
}

function toApiMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    content: buildMessageContent(m.content, m.attachments),
  }))
}

const SYSTEM_CHAT = '你是一个助手，请直接回答用户的问题。'

const SYSTEM_EXCEL =
  '你是一个数据助手。用户会要求你生成表格数据。\n' +
  '你的回复必须只包含一个 xlsx-gen 代码块，格式如下：\n' +
  '```xlsx-gen\n' +
  '[{"列名1": 值1, "列名2": 值2}, ...]\n' +
  '```\n' +
  '除此之外不要输出任何文字、解释或 markdown。键名使用双引号，字符串值使用双引号，数值不加引号。'

export async function streamChatMessage(params: {
  messages: ChatMessage[]
  signal?: AbortSignal
  onChunk: (text: string) => void
  excelMode?: boolean
}): Promise<void> {
  const res = await fetch('/api/messages/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: params.signal,
    body: JSON.stringify({
      feature: 'chat',
      max_tokens: 16384,
      system: params.excelMode ? SYSTEM_EXCEL : SYSTEM_CHAT,
      messages: toApiMessages(params.messages),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (res.status === 401) throw new Error('API_KEY_INVALID')
    throw new Error((err as { error?: { message?: string } }).error?.message || `HTTP ${res.status}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    if (params.signal?.aborted) { await reader.cancel(); return }
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data) as {
          type?: string
          delta?: { type: string; text?: string }
          choices?: Array<{ delta?: { content?: string } }>
        }
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          params.onChunk(parsed.delta.text ?? '')
        } else if (parsed.choices?.[0]?.delta?.content) {
          params.onChunk(parsed.choices[0].delta.content)
        }
      } catch { /* ignore non-JSON lines */ }
    }
  }
}
