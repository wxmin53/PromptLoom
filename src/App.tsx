import { useRef, useState, useEffect } from 'react'
import type { Draft } from './types'
import { useAppState } from './hooks/useAppState'
import { useModules } from './hooks/useModules'
import { autoSaveDraft, manualSaveDraft } from './hooks/useDrafts'
import {
  fetchClarificationQuestions,
  streamGeneratedPrompt,
  fetchTunedPrompt,
  fetchToolRecommendations,
} from './hooks/useClaudeAPI'
import {
  getClarificationSystemPrompt,
  getClarificationUserPrompt,
  getGenerationSystemPrompt,
  getGenerationUserPrompt,
  getTuningSystemPrompt,
  getTuningUserPrompt,
  getToolRecommendationSystemPrompt,
  getToolRecommendationUserPrompt,
} from './constants/prompts'
import { ALGORITHM_TOOLS } from './constants/tools'
import { scrollToRef } from './utils/scroll'
import Header from './components/Header'
import PathSelector from './components/PathSelector'
import InputArea from './components/InputArea'
import ToolSelector from './components/ToolSelector'
import ModuleSelector from './components/ModuleSelector'
import GenerateButton from './components/GenerateButton'
import ClarificationArea from './components/ClarificationArea'
import ResultArea from './components/ResultArea'
import DraftDrawer from './components/DraftDrawer'

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50 cursor-pointer"
      onClick={onDismiss}
    >
      {message}
    </div>
  )
}

export default function App() {
  const { state, dispatch, inputsChangedSinceLastGeneration, getClarificationQA } = useAppState()
  const { modules, addModule, updateModule, deleteModule } = useModules()

  const clarificationRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const clarificationScrolled = useRef(false)
  const resultScrolled = useRef(false)
  const prevIsResultLoading = useRef(false)

  const [toastMessage, setToastMessage] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const apiKeyMissing = false // API Key 由代理服务器管理，前端无需检查

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  useEffect(() => {
    if (prevIsResultLoading.current && !state.isResultLoading && state.result && !state.resultError) {
      autoSaveDraft({
        generationType: state.generationType,
        requirementInput: state.requirementInput,
        templateInput: state.templateInput,
        selectedToolIds: state.selectedToolIds,
        selectedModuleIds: state.selectedModuleIds,
        clarificationQA: getClarificationQA(),
        result: state.result,
      })
    }
    prevIsResultLoading.current = state.isResultLoading
  }, [state.isResultLoading])

  function showToast(msg: string) {
    setToastMessage(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMessage(''), 3000)
  }

  function validate(): boolean {
    if (!state.requirementInput.trim()) {
      showToast('请填写本次外呼需求')
      return false
    }
    if (state.generationType === 'template' && !state.templateInput.trim()) {
      showToast('请粘贴参考模板')
      return false
    }
    return true
  }

  function handleApiError(err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'API_KEY_INVALID') {
        showToast('API Key 无效，请检查配置')
      } else if (err.message === 'API_TIMEOUT') {
        showToast('请求超时，请稍后重试')
      }
    }
  }

  async function startClarification() {
    if (!validate()) return
    dispatch({ type: 'SAVE_INPUT_SNAPSHOT' })
    dispatch({ type: 'START_CLARIFICATION' })
    clarificationScrolled.current = false
    scrollToRef(clarificationRef, clarificationScrolled)

    const selectedToolNames = ALGORITHM_TOOLS.filter((t) =>
      state.selectedToolIds.includes(t.id)
    ).map((t) => t.name)
    const selectedModuleNames = modules.filter((m) =>
      state.selectedModuleIds.includes(m.id)
    ).map((m) => m.name)

    try {
      const questions = await fetchClarificationQuestions({
        system: getClarificationSystemPrompt(),
        userMessage: getClarificationUserPrompt({
          requirementInput: state.requirementInput,
          templateInput: state.templateInput,
          selectedToolNames,
          selectedModuleNames,
        }),
      })
      dispatch({ type: 'CLARIFICATION_SUCCESS', payload: questions })
    } catch (err) {
      console.error('[clarification error]', err)
      handleApiError(err)
      dispatch({ type: 'CLARIFICATION_ERROR' })
    }
  }

  async function generatePrompt(skipClarification = false) {
    const clarificationQA = skipClarification ? [] : getClarificationQA()
    dispatch({ type: 'START_GENERATION' })
    resultScrolled.current = false
    scrollToRef(resultRef, resultScrolled)

    const selectedTools = ALGORITHM_TOOLS.filter((t) =>
      state.selectedToolIds.includes(t.id)
    )
    const excludeCapabilities = selectedTools.flatMap((t) => t.excludeCapabilities)
    const toolBlock = selectedTools
      .map((t) => t.usageTemplate)
      .filter(Boolean)
      .join('\n')

    const selectedModuleContents = modules.filter((m) =>
      state.selectedModuleIds.includes(m.id)
    )
      .map((m) => `【模块：${m.name}】\n${m.content}`)
      .join('\n\n')

    if (toolBlock) {
      dispatch({ type: 'APPEND_RESULT_CHUNK', payload: toolBlock + '\n\n' })
    }

    try {
      await streamGeneratedPrompt({
        system: getGenerationSystemPrompt({ excludeCapabilities, selectedModuleContents, toolBlock }),
        userMessage: getGenerationUserPrompt({
          generationType: state.generationType,
          requirementInput: state.requirementInput,
          templateInput: state.templateInput,
          clarificationQA,
        }),
        onChunk: (text) => dispatch({ type: 'APPEND_RESULT_CHUNK', payload: text }),
      })
      dispatch({ type: 'GENERATION_SUCCESS', payload: '' })
    } catch (err) {
      console.error('[generation error]', err)
      handleApiError(err)
      dispatch({ type: 'GENERATION_ERROR' })
    }
  }

  async function handleRegenerate() {
    if (inputsChangedSinceLastGeneration()) {
      dispatch({ type: 'RESET_CLARIFICATION_FOR_REGENERATE' })
      await startClarification()
    } else {
      await generatePrompt(false)
    }
  }

  async function handleRecommendTools() {
    if (!state.requirementInput.trim()) {
      showToast('请先填写本次外呼需求')
      return
    }
    dispatch({ type: 'START_TOOL_RECOMMENDATION' })
    try {
      const ids = await fetchToolRecommendations({
        system: getToolRecommendationSystemPrompt(),
        userMessage: getToolRecommendationUserPrompt(
          state.requirementInput,
          ALGORITHM_TOOLS.map((t) => ({ id: t.id, name: t.name, description: t.description }))
        ),
      })
      dispatch({ type: 'SET_RECOMMENDED_TOOL_IDS', payload: ids })
    } catch {
      dispatch({ type: 'RECOMMENDATION_ERROR' })
      showToast('推荐失败，请重试')
    }
  }

  function handleDeleteModule(id: string) {
    if (state.selectedModuleIds.includes(id)) {
      dispatch({ type: 'TOGGLE_MODULE', payload: id })
    }
    deleteModule(id)
  }

  async function handleTuningSend(instruction: string) {
    dispatch({ type: 'START_TUNING' })
    try {
      let fullResult = ''
      await fetchTunedPrompt({
        system: getTuningSystemPrompt(),
        userMessage: getTuningUserPrompt(state.result, instruction, state.tuningMessages.length),
        history: state.tuningMessages,
        onChunk: (text) => {
          fullResult += text
          dispatch({ type: 'APPEND_TUNING_CHUNK', payload: text })
        },
      })
      dispatch({ type: 'TUNING_SUCCESS', payload: { userMsg: instruction, aiResult: fullResult } })
    } catch (err) {
      handleApiError(err)
      dispatch({ type: 'TUNING_ERROR' })
    }
  }

  function handleSaveDraft() {
    manualSaveDraft({
      generationType: state.generationType,
      requirementInput: state.requirementInput,
      templateInput: state.templateInput,
      selectedToolIds: state.selectedToolIds,
      selectedModuleIds: state.selectedModuleIds,
      clarificationQA: getClarificationQA(),
      result: state.result,
    })
  }

  function handleRestoreDraft(draft: Draft) {
    dispatch({
      type: 'RESTORE_DRAFT',
      payload: {
        generationType: draft.generationType,
        requirementInput: draft.requirementInput,
        templateInput: draft.templateInput,
        originalTemplate: draft.templateInput,
        selectedToolIds: draft.selectedToolIds,
        selectedModuleIds: draft.selectedModuleIds,
        clarificationQuestions: draft.clarificationQA.map((qa) => qa.question),
        clarificationAnswers: draft.clarificationQA.map((qa) => qa.answer),
        showClarification: draft.clarificationQA.length > 0,
        showResult: true,
        result: draft.result,
        tuningMessages: [],
      },
    })
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const isBusy = state.isResultLoading || state.isClarificationLoading || state.isTuningLoading

  return (
    <div className="min-h-screen bg-gray-50">
      {apiKeyMissing && (
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-3 text-sm text-orange-700 text-center">
          请在 .env 文件中配置 VITE_ANTHROPIC_API_KEY
        </div>
      )}

      <Header
        onOpenDrawer={() => dispatch({ type: 'SET_DRAWER_OPEN', payload: true })}
        onReset={() => dispatch({ type: 'RESET' })}
      />

      <main className="w-full max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        <PathSelector
          value={state.generationType}
          onChange={(v) => dispatch({ type: 'SET_GENERATION_TYPE', payload: v })}
        />

        <InputArea
          generationType={state.generationType}
          requirementInput={state.requirementInput}
          templateInput={state.templateInput}
          onRequirementChange={(v) => dispatch({ type: 'SET_REQUIREMENT_INPUT', payload: v })}
          onTemplateChange={(v) => dispatch({ type: 'SET_TEMPLATE_INPUT', payload: v })}
        />

        <ToolSelector
          selectedIds={state.selectedToolIds}
          recommendedIds={state.recommendedToolIds}
          isRecommendationLoading={state.isRecommendationLoading}
          onToggle={(id) => dispatch({ type: 'TOGGLE_TOOL', payload: id })}
          onRecommend={handleRecommendTools}
        />

        <ModuleSelector
          modules={modules}
          selectedIds={state.selectedModuleIds}
          onToggle={(id) => dispatch({ type: 'TOGGLE_MODULE', payload: id })}
          onAdd={addModule}
          onUpdate={updateModule}
          onDelete={handleDeleteModule}
        />

        <GenerateButton onClick={startClarification} disabled={isBusy} />

        {state.showClarification && (
          <div ref={clarificationRef}>
            <ClarificationArea
              isLoading={state.isClarificationLoading}
              hasError={state.clarificationError}
              questions={state.clarificationQuestions}
              answers={state.clarificationAnswers}
              isGenerating={state.isResultLoading}
              onAnswerChange={(i, v) =>
                dispatch({ type: 'SET_CLARIFICATION_ANSWER', payload: { index: i, answer: v } })
              }
              onSkip={() => generatePrompt(true)}
              onConfirm={() => generatePrompt(false)}
              onRetry={startClarification}
            />
          </div>
        )}

        {state.showResult && (
          <div ref={resultRef}>
            <ResultArea
              isLoading={state.isResultLoading}
              hasError={state.resultError}
              result={state.result}
              previousResult={state.previousResult}
              originalTemplate={state.originalTemplate}
              generationType={state.generationType}
              tuningMessages={state.tuningMessages}
              isTuningLoading={state.isTuningLoading}
              tuningError={state.tuningError}
              pendingTuningResult={state.pendingTuningResult}
              onResultChange={(v) => dispatch({ type: 'SET_RESULT', payload: v })}
              onRegenerate={handleRegenerate}
              onSaveDraft={handleSaveDraft}
              onTuningSend={handleTuningSend}
              onTuningConfirm={() => dispatch({ type: 'TUNING_CONFIRM' })}
            />
          </div>
        )}
      </main>

      {state.isDrawerOpen && (
        <DraftDrawer
          onClose={() => dispatch({ type: 'SET_DRAWER_OPEN', payload: false })}
          onRestore={handleRestoreDraft}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage('')} />
      )}
    </div>
  )
}
