import type { Draft } from '../types'

export function formatDraftPreview(draft: Draft): string {
  return draft.result.slice(0, 80).replace(/\n/g, ' ')
}

export function formatDraftDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
