import type { ClarificationQA, GenerationType } from '../types'

export function getClarificationSystemPrompt(): string {
  return `你是一个提示词工程师助手。用户正在为 AI 外呼 Bot 生成系统提示词。
请根据用户提供的外呼需求信息，生成 2-3 个追问问题，帮助补充关键场景细节，使最终提示词更精准。
追问应聚焦于：目标客户特征、话术风格偏好、异常情况处理方式等维度。

【重要】你的回复必须且只能是一个合法的 JSON 对象，格式严格如下，不得包含任何其他文字、解释或 markdown：
{"questions": ["问题1", "问题2", "问题3"]}`
}

export function getClarificationUserPrompt(params: {
  requirementInput: string
  templateInput: string
  selectedToolNames: string[]
  selectedModuleNames: string[]
}): string {
  const { requirementInput, templateInput, selectedToolNames, selectedModuleNames } = params
  return `外呼需求描述：${requirementInput}
${templateInput ? `参考模板内容：${templateInput}` : ''}
已选算法工具：${selectedToolNames.join('、') || '无'}
已选提示词模块：${selectedModuleNames.join('、') || '无'}`
}

export function getGenerationSystemPrompt(params: {
  excludedKeywords: string[]
  selectedModuleContents: string
}): string {
  const { excludedKeywords, selectedModuleContents } = params
  return `你是一个提示词工程师，专门为 AI 外呼 Bot 编写高质量系统提示词。

生成要求：
1. 提示词结构清晰，依次包含：角色定位、外呼目标、核心话术策略、回复风格、边界与异常处理
2. 语言简洁专业，适合直接作为 Bot 的 system prompt 使用
3. 以下功能已由算法工具接管，不要在提示词中出现或描述这些功能：${excludedKeywords.join('、') || '无'}
4. 在提示词正文末尾，原样追加以下模块内容（保留模块标题，不做改写）：
${selectedModuleContents || '（无需追加）'}
5. 直接输出提示词正文，不要有任何前言、解释、markdown 标题或代码块包裹`
}

export function getGenerationUserPrompt(params: {
  generationType: GenerationType
  requirementInput: string
  templateInput: string
  clarificationQA: ClarificationQA[]
}): string {
  const { generationType, requirementInput, templateInput, clarificationQA } = params
  const base =
    generationType === 'template'
      ? `请基于以下参考模板，结合本次外呼需求进行润色优化：\n\n【参考模板】\n${templateInput}\n\n【本次外呼需求】\n${requirementInput}`
      : `请根据以下外呼需求从零生成提示词：\n\n${requirementInput}`

  const qa = clarificationQA.filter((item) => item.answer.trim())
  if (qa.length === 0) return base

  const qaText = qa.map((item) => `Q：${item.question}\nA：${item.answer}`).join('\n\n')
  return `${base}\n\n【补充信息】\n${qaText}`
}

export function getTuningSystemPrompt(): string {
  return `你是一个提示词优化助手。用户会给你一段当前的 Bot 系统提示词，以及一条修改指令。
请严格按照修改指令调整提示词，保持未涉及部分不变。
直接输出修改后的完整提示词正文，不要有任何解释、前言或 markdown 格式。`
}

export function getTuningUserPrompt(currentResult: string, instruction: string): string {
  return `当前提示词：\n${currentResult}\n\n修改指令：${instruction}`
}
