import { useState } from 'react'
import type { PromptModule } from '../types'

const STORAGE_KEY = 'prompt_tool_modules'

export function useModules() {
  const [modules, setModules] = useState<PromptModule[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as PromptModule[]) : []
    } catch {
      return []
    }
  })

  function save(list: PromptModule[]) {
    setModules(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  function addModule(name: string, content: string) {
    save([...modules, { id: crypto.randomUUID(), name, content }])
  }

  function updateModule(id: string, name: string, content: string) {
    save(modules.map((m) => (m.id === id ? { ...m, name, content } : m)))
  }

  function deleteModule(id: string) {
    save(modules.filter((m) => m.id !== id))
  }

  return { modules, addModule, updateModule, deleteModule }
}
