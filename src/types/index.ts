export type GenerationType = 'template' | 'freeform'

export interface AlgorithmTool {
  id: string
  name: string
  description: string
  fullDescription: string
  category: string
  usageTemplate: string
  excludeCapabilities: string[]
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

export interface ChatFileAttachment {
  name: string
  type: 'text' | 'image'
  mimeType: string
  content: string
  size: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: ChatFileAttachment[]
  isStreaming?: boolean
  hasError?: boolean
  excelMode?: boolean
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  pendingAttachments: ChatFileAttachment[]
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
  previousResult: string

  tuningMessages: TuningMessage[]
  isTuningLoading: boolean
  tuningError: boolean
  pendingTuningResult: string

  isDrawerOpen: boolean
  inputSnapshot: InputSnapshot | null
  recommendedToolIds: string[]
  isRecommendationLoading: boolean
}
