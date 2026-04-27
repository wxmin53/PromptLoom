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

  // 剥 markdown 代码块，规范化智能引号，再提取 {...} 对象
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .replace(/[“”‘’]/g, '"') // 中文弯引号 → 直引号
    .trim()
  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  const parsed = JSON.parse(match[0]) as { questions: string[] }
  return parsed.questions ?? []
}

export async function fetchGeneratedPrompt(params: {
  system: string
  userMessage: string
}): Promise<string> {
  return callClaude({
    model: MODEL,
    max_tokens: 2048,
    system: params.system,
    messages: [{ role: 'user', content: params.userMessage }],
  })
}

export async function fetchTunedPrompt(params: {
  system: string
  userMessage: string
}): Promise<string> {
  return callClaude({
    model: MODEL,
    max_tokens: 2048,
    system: params.system,
    messages: [{ role: 'user', content: params.userMessage }],
  })
}
