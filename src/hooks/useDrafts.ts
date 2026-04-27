import type { Draft } from '../types'

const SESSION_KEY = 'prompt_tool_session_drafts'
const LOCAL_KEY = 'prompt_tool_saved_drafts'
const SESSION_MAX = 10
const LOCAL_MAX = 50

function readJSON<T>(storage: Storage, key: string): T[] {
  try {
    return JSON.parse(storage.getItem(key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function writeJSON<T>(storage: Storage, key: string, data: T[]): void {
  storage.setItem(key, JSON.stringify(data))
}

export function autoSaveDraft(draft: Omit<Draft, 'id' | 'createdAt'>): void {
  const drafts = readJSON<Draft>(sessionStorage, SESSION_KEY)
  const newDraft: Draft = { ...draft, id: crypto.randomUUID(), createdAt: Date.now() }
  const updated = [newDraft, ...drafts].slice(0, SESSION_MAX)
  writeJSON(sessionStorage, SESSION_KEY, updated)
}

export function manualSaveDraft(draft: Omit<Draft, 'id' | 'createdAt'>): void {
  const drafts = readJSON<Draft>(localStorage, LOCAL_KEY)
  const newDraft: Draft = { ...draft, id: crypto.randomUUID(), createdAt: Date.now() }
  const updated = [newDraft, ...drafts].slice(0, LOCAL_MAX)
  writeJSON(localStorage, LOCAL_KEY, updated)
}

export function getSessionDrafts(): Draft[] {
  return readJSON<Draft>(sessionStorage, SESSION_KEY)
}

export function getSavedDrafts(): Draft[] {
  return readJSON<Draft>(localStorage, LOCAL_KEY)
}

export function deleteSavedDraft(id: string): void {
  const drafts = readJSON<Draft>(localStorage, LOCAL_KEY).filter((d) => d.id !== id)
  writeJSON(localStorage, LOCAL_KEY, drafts)
}
