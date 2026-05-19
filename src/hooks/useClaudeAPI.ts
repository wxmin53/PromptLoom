import type { TuningMessage } from '../types'

const API_URL = '/api/messages'
const MODEL = 'claude-sonnet-4-6'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeRequest {
  model: string
  max_tokens: number
  system?: string
  messages: Message[]
}

async function callClaude(request: ClaudeRequest): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (res.status === 401) throw new Error('API_KEY_INVALID')
    if (res.status === 504 || res.status === 524) throw new Error('API_TIMEOUT')
    throw new Error((err as { error?: { message?: string } }).error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> }
  return data.content[0]?.text ?? ''
}

export async function fetchClarificationQuestions(params: {
  system: string
  userMessage: string
}): Promise<string[]> {
  const text = await callClaude({
    model: MODEL,
    max_tokens: 512,
    system: params.system,
    messages: [{ role: 'user', content: params.userMessage }],
  })

  // normalize: strip markdown fences, replace smart quotes and fullwidth comma
  const normalized = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\uff0c/g, ',')
    .trim()

  // try standard JSON first
  const objMatch = normalized.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]) as { questions: string[] }
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed.questions
      }
    } catch { /* fall through to heuristic */ }
  }

  // fallback: extract lines that look like questions
  const qlines = normalized.split('\n').map((l) => l.trim()).filter(Boolean)
  const questions = qlines
    .map((l) => l.replace(/^\d+[.\u3001\u3002)\uff09]\s*/, '').replace(/^[-*\u2022]\s*/, '').trim())
    .filter((l) => l.length > 4 && l.length < 200)
  if (questions.length > 0) return questions.slice(0, 3)

  throw new Error('No questions found in response')
}

export async function fetchGeneratedPrompt(params: {
  system: string
  userMessage: string
}): Promise<string> {
  return callClaude({
    model: MODEL,
    max_tokens: 1500,
    system: params.system,
    messages: [{ role: 'user', content: params.userMessage }],
  })
}

export async function streamGeneratedPrompt(params: {
  system: string
  userMessage: string
  onChunk: (text: string) => void
}): Promise<void> {
  const res = await fetch('/api/messages/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16384,
      system: params.system,
      messages: [{ role: 'user', content: params.userMessage }],
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
          // Anthropic 格式
          params.onChunk(parsed.delta.text ?? '')
        } else if (parsed.choices?.[0]?.delta?.content) {
          // OpenAI 兼容格式（Qwen 等）
          params.onChunk(parsed.choices[0].delta.content)
        }
      } catch { /* ignore non-JSON lines */ }
    }
  }
}

export async function fetchTunedPrompt(params: {
  system: string
  userMessage: string
  history: TuningMessage[]
  onChunk: (text: string) => void
}): Promise<void> {
  // 只保留最近 6 条历史（3轮），避免历史 token 过多压缩输出空间
  const recentHistory = params.history.slice(-6)
  const res = await fetch('/api/messages/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16384,
      system: params.system,
      messages: [
        ...recentHistory,
        { role: 'user', content: params.userMessage },
      ],
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

export async function fetchToolRecommendations(params: {
  system: string
  userMessage: string
}): Promise<string[]> {
  const text = await callClaude({
    model: MODEL,
    max_tokens: 256,
    system: params.system,
    messages: [{ role: 'user', content: params.userMessage }],
  })

  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .replace(/[""'']/g, '"')
    .trim()
  const match = stripped.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const parsed = JSON.parse(match[0]) as unknown[]
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return []
  }
}
