import type { ChatMessage } from '../types'

const STORAGE_KEY = 'chat_history'
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

interface PersistedChat {
  messages: ChatMessage[]
  savedAt: number
}

export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as PersistedChat
    if (Date.now() - data.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
    // Strip streaming/error flags that shouldn't persist
    return data.messages.map((m) => ({ ...m, isStreaming: false }))
  } catch {
    return []
  }
}

export function saveChatHistory(messages: ChatMessage[]): void {
  if (messages.length === 0) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  // Strip image base64 content to avoid localStorage quota overflow
  const slim = messages.map((m) => ({
    ...m,
    attachments: m.attachments?.map((att) =>
      att.type === 'image' ? { ...att, content: '' } : att
    ),
  }))
  const data: PersistedChat = { messages: slim, savedAt: Date.now() }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage 容量不足时静默失败
  }
}

export function clearChatHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}
