import { useReducer } from 'react'
import type { AppState, GenerationType, TuningMessage, ClarificationQA, InputSnapshot } from '../types'

const initialState: AppState = {
  generationType: 'template',
  requirementInput: '',
  templateInput: '',
  originalTemplate: '',

  selectedToolIds: [],
  selectedModuleIds: [],

  showClarification: false,
  isClarificationLoading: false,
  clarificationError: false,
  clarificationQuestions: [],
  clarificationAnswers: [],

  showResult: false,
  isResultLoading: false,
  resultError: false,
  result: '',
  previousResult: '',

  tuningMessages: [],
  isTuningLoading: false,
  tuningError: false,
  pendingTuningResult: '',

  isDrawerOpen: false,
  inputSnapshot: null,
  recommendedToolIds: [],
  isRecommendationLoading: false,
}

type Action =
  | { type: 'SET_GENERATION_TYPE'; payload: GenerationType }
  | { type: 'SET_REQUIREMENT_INPUT'; payload: string }
  | { type: 'SET_TEMPLATE_INPUT'; payload: string }
  | { type: 'TOGGLE_TOOL'; payload: string }
  | { type: 'TOGGLE_MODULE'; payload: string }
  | { type: 'START_CLARIFICATION' }
  | { type: 'CLARIFICATION_SUCCESS'; payload: string[] }
  | { type: 'CLARIFICATION_ERROR' }
  | { type: 'SET_CLARIFICATION_ANSWER'; payload: { index: number; answer: string } }
  | { type: 'START_GENERATION' }
  | { type: 'GENERATION_SUCCESS'; payload: string }
  | { type: 'GENERATION_ERROR' }
  | { type: 'SET_RESULT'; payload: string }
  | { type: 'START_TUNING' }
  | { type: 'APPEND_TUNING_CHUNK'; payload: string }
  | { type: 'TUNING_SUCCESS'; payload: { userMsg: string; aiResult: string } }
  | { type: 'TUNING_CONFIRM' }
  | { type: 'TUNING_ERROR' }
  | { type: 'CLEAR_TUNING_ERROR' }
  | { type: 'SET_DRAWER_OPEN'; payload: boolean }
  | { type: 'RESTORE_DRAFT'; payload: Partial<AppState> }
  | { type: 'SAVE_INPUT_SNAPSHOT' }
  | { type: 'RESET_CLARIFICATION_FOR_REGENERATE' }
  | { type: 'START_TOOL_RECOMMENDATION' }
  | { type: 'SET_RECOMMENDED_TOOL_IDS'; payload: string[] }
  | { type: 'RECOMMENDATION_ERROR' }
  | { type: 'APPEND_RESULT_CHUNK'; payload: string }
  | { type: 'RESET' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_GENERATION_TYPE':
      return { ...state, generationType: action.payload }
    case 'SET_REQUIREMENT_INPUT':
      return { ...state, requirementInput: action.payload }
    case 'SET_TEMPLATE_INPUT':
      return { ...state, templateInput: action.payload }
    case 'TOGGLE_TOOL':
      return {
        ...state,
        selectedToolIds: state.selectedToolIds.includes(action.payload)
          ? state.selectedToolIds.filter((id) => id !== action.payload)
          : [...state.selectedToolIds, action.payload],
      }
    case 'TOGGLE_MODULE':
      return {
        ...state,
        selectedModuleIds: state.selectedModuleIds.includes(action.payload)
          ? state.selectedModuleIds.filter((id) => id !== action.payload)
          : [...state.selectedModuleIds, action.payload],
      }
    case 'START_CLARIFICATION':
      return {
        ...state,
        showClarification: true,
        isClarificationLoading: true,
        clarificationError: false,
        clarificationQuestions: [],
        clarificationAnswers: [],
      }
    case 'CLARIFICATION_SUCCESS':
      return {
        ...state,
        isClarificationLoading: false,
        clarificationQuestions: action.payload,
        clarificationAnswers: action.payload.map(() => ''),
      }
    case 'CLARIFICATION_ERROR':
      return { ...state, isClarificationLoading: false, clarificationError: true }
    case 'SET_CLARIFICATION_ANSWER': {
      const answers = [...state.clarificationAnswers]
      answers[action.payload.index] = action.payload.answer
      return { ...state, clarificationAnswers: answers }
    }
    case 'START_GENERATION':
      return {
        ...state,
        result: '',
        previousResult: state.result,
        showResult: true,
        isResultLoading: true,
        resultError: false,
        tuningMessages: [],
        tuningError: false,
      }
    case 'GENERATION_SUCCESS':
      return {
        ...state,
        isResultLoading: false,
        result: action.payload || state.result,
        originalTemplate: state.templateInput,
      }
    case 'GENERATION_ERROR':
      return { ...state, isResultLoading: false, resultError: true }
    case 'SET_RESULT':
      return { ...state, result: action.payload }
    case 'START_TUNING':
      return { ...state, previousResult: state.result, isTuningLoading: true, tuningError: false, pendingTuningResult: '' }
    case 'APPEND_TUNING_CHUNK':
      return { ...state, pendingTuningResult: state.pendingTuningResult + action.payload }
    case 'TUNING_SUCCESS': {
      const userMsg: TuningMessage = { role: 'user', content: action.payload.userMsg }
      const aiMsg: TuningMessage = { role: 'assistant', content: action.payload.aiResult }
      return {
        ...state,
        isTuningLoading: false,
        pendingTuningResult: action.payload.aiResult,
        tuningMessages: [...state.tuningMessages, userMsg, aiMsg],
      }
    }
    case 'TUNING_CONFIRM':
      return { ...state, result: state.pendingTuningResult, pendingTuningResult: '' }
    case 'TUNING_ERROR':
      return { ...state, isTuningLoading: false, tuningError: true }
    case 'CLEAR_TUNING_ERROR':
      return { ...state, tuningError: false }
    case 'SET_DRAWER_OPEN':
      return { ...state, isDrawerOpen: action.payload }
    case 'RESTORE_DRAFT':
      return { ...state, ...action.payload, isDrawerOpen: false }
    case 'SAVE_INPUT_SNAPSHOT': {
      const snapshot: InputSnapshot = {
        requirementInput: state.requirementInput,
        templateInput: state.templateInput,
        selectedToolIds: [...state.selectedToolIds],
        selectedModuleIds: [...state.selectedModuleIds],
      }
      return { ...state, inputSnapshot: snapshot }
    }
    case 'RESET_CLARIFICATION_FOR_REGENERATE':
      return {
        ...state,
        clarificationQuestions: [],
        clarificationAnswers: [],
        clarificationError: false,
      }
    case 'START_TOOL_RECOMMENDATION':
      return { ...state, isRecommendationLoading: true, recommendedToolIds: [] }
    case 'SET_RECOMMENDED_TOOL_IDS':
      return { ...state, isRecommendationLoading: false, recommendedToolIds: action.payload }
    case 'RECOMMENDATION_ERROR':
      return { ...state, isRecommendationLoading: false }
    case 'APPEND_RESULT_CHUNK':
      return { ...state, result: state.result + action.payload }
    case 'RESET':
      return { ...initialState, generationType: state.generationType }
    default:
      return state
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, initialState)

  function inputsChangedSinceLastGeneration(): boolean {
    const snap = state.inputSnapshot
    if (!snap) return true
    return (
      snap.requirementInput !== state.requirementInput ||
      snap.templateInput !== state.templateInput ||
      JSON.stringify(snap.selectedToolIds) !== JSON.stringify(state.selectedToolIds) ||
      JSON.stringify(snap.selectedModuleIds) !== JSON.stringify(state.selectedModuleIds)
    )
  }

  function getClarificationQA(): ClarificationQA[] {
    return state.clarificationQuestions.map((q, i) => ({
      question: q,
      answer: state.clarificationAnswers[i] ?? '',
    }))
  }

  return { state, dispatch, inputsChangedSinceLastGeneration, getClarificationQA }
}
