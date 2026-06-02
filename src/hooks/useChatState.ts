import { useReducer, useEffect, useRef } from 'react'
import type { ChatState, ChatMessage, ChatFileAttachment } from '../types'
import { streamChatMessage } from './useChatAPI'
import { loadChatHistory, saveChatHistory, clearChatHistory } from './useChatHistory'

function makeInitialState(): ChatState {
  return {
    messages: loadChatHistory(),
    isLoading: false,
    error: null,
    pendingAttachments: [],
  }
}

type ChatAction =
  | { type: 'ADD_USER_MESSAGE'; payload: { id: string; content: string; attachments: ChatFileAttachment[] } }
  | { type: 'START_ASSISTANT_MESSAGE'; payload: { id: string; excelMode: boolean } }
  | { type: 'APPEND_CHUNK'; payload: { id: string; text: string } }
  | { type: 'FINISH_MESSAGE'; payload: { id: string } }
  | { type: 'MESSAGE_ERROR'; payload: { id: string } }
  | { type: 'ADD_ATTACHMENT'; payload: ChatFileAttachment }
  | { type: 'REMOVE_ATTACHMENT'; payload: number }
  | { type: 'CLEAR_ATTACHMENTS' }
  | { type: 'CLEAR_ALL' }

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_USER_MESSAGE': {
      const msg: ChatMessage = {
        id: action.payload.id,
        role: 'user',
        content: action.payload.content,
        attachments: action.payload.attachments.length ? action.payload.attachments : undefined,
      }
      return { ...state, messages: [...state.messages, msg], isLoading: true, error: null, pendingAttachments: [] }
    }
    case 'START_ASSISTANT_MESSAGE': {
      const msg: ChatMessage = {
        id: action.payload.id,
        role: 'assistant',
        content: '',
        isStreaming: true,
        excelMode: action.payload.excelMode,
      }
      return { ...state, messages: [...state.messages, msg] }
    }
    case 'APPEND_CHUNK':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, content: m.content + action.payload.text } : m
        ),
      }
    case 'FINISH_MESSAGE':
      return {
        ...state,
        isLoading: false,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, isStreaming: false } : m
        ),
      }
    case 'MESSAGE_ERROR':
      return {
        ...state,
        isLoading: false,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, isStreaming: false, hasError: true } : m
        ),
      }
    case 'ADD_ATTACHMENT':
      return { ...state, pendingAttachments: [...state.pendingAttachments, action.payload] }
    case 'REMOVE_ATTACHMENT':
      return { ...state, pendingAttachments: state.pendingAttachments.filter((_, i) => i !== action.payload) }
    case 'CLEAR_ATTACHMENTS':
      return { ...state, pendingAttachments: [] }
    case 'CLEAR_ALL':
      clearChatHistory()
      return { messages: [], isLoading: false, error: null, pendingAttachments: [] }
    default:
      return state
  }
}

export function useChatState() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)
  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef(state.messages)
  useEffect(() => { messagesRef.current = state.messages }, [state.messages])

  useEffect(() => {
    if (!state.isLoading) saveChatHistory(state.messages)
  }, [state.isLoading, state.messages])

  function stopGeneration() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  async function sendMessage(text: string, excelMode = false) {
    const trimmed = text.trim()
    if (!trimmed && state.pendingAttachments.length === 0) return

    const controller = new AbortController()
    abortRef.current = controller

    const userMsgId = crypto.randomUUID()
    const assistantMsgId = crypto.randomUUID()

    dispatch({ type: 'ADD_USER_MESSAGE', payload: { id: userMsgId, content: trimmed, attachments: state.pendingAttachments } })
    dispatch({ type: 'START_ASSISTANT_MESSAGE', payload: { id: assistantMsgId, excelMode } })

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      attachments: state.pendingAttachments.length ? state.pendingAttachments : undefined,
    }
    const historyForApi: ChatMessage[] = [...state.messages, userMsg]

    try {
      await streamChatMessage({
        messages: historyForApi,
        signal: controller.signal,
        onChunk: (chunk) => dispatch({ type: 'APPEND_CHUNK', payload: { id: assistantMsgId, text: chunk } }),
        excelMode,
      })
      dispatch({ type: 'FINISH_MESSAGE', payload: { id: assistantMsgId } })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        dispatch({ type: 'FINISH_MESSAGE', payload: { id: assistantMsgId } })
      } else {
        dispatch({ type: 'MESSAGE_ERROR', payload: { id: assistantMsgId } })
      }
    } finally {
      abortRef.current = null
    }
  }

  return { state, dispatch, sendMessage, stopGeneration }
}
