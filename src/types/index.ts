export type GenerationType = 'template' | 'freeform'

export interface AlgorithmTool {
  id: string
  name: string
  description: string
  fullDescription: string
  excludeKeywords: string[]
}

export interface PromptModule {
  id: string
  name: string
  content: string
}

export interface ClarificationQA {
  question: string
  answer: string
}

export interface Draft {
  id: string
  createdAt: number
  generationType: GenerationType
  requirementInput: string
  templateInput: string
  selectedToolIds: string[]
  selectedModuleIds: string[]
  clarificationQA: ClarificationQA[]
  result: string
}

export interface TuningMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface InputSnapshot {
  requirementInput: string
  templateInput: string
  selectedToolIds: string[]
  selectedModuleIds: string[]
}

export interface AppState {
  generationType: GenerationType
  requirementInput: string
  templateInput: string
  originalTemplate: string

  selectedToolIds: string[]
  selectedModuleIds: string[]

  showClarification: boolean
  isClarificationLoading: boolean
  clarificationError: boolean
  clarificationQuestions: string[]
  clarificationAnswers: string[]

  showResult: boolean
  isResultLoading: boolean
  resultError: boolean
  result: string

  tuningMessages: TuningMessage[]
  isTuningLoading: boolean
  tuningError: boolean

  isDrawerOpen: boolean
  inputSnapshot: InputSnapshot | null
}
