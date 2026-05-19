import type { ClarificationQA, GenerationType } from '../types'

function stripToolCommands(template: string): string {
  const lines = template.split('\n')
  let i = 0
  while (i < lines.length && (lines[i].startsWith('#') || lines[i].trim() === '')) {
    i++
  }
  return lines.slice(i).join('\n').trimStart()
}

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
  const cleanTemplate = stripToolCommands(templateInput)
  return `外呼需求描述：${requirementInput}
${cleanTemplate ? `参考模板内容：${cleanTemplate}` : ''}
已选算法工具：${selectedToolNames.join('、') || '无'}
已选提示词模块：${selectedModuleNames.join('、') || '无'}`
}

export function getGenerationSystemPrompt(params: {
  excludeCapabilities: string[]
  selectedModuleContents: string
  toolBlock: string
}): string {
  const { excludeCapabilities, selectedModuleContents, toolBlock } = params
  return `你是一个提示词工程师，专门为 AI 外呼 Bot 编写高质量系统提示词。

生成要求：
1. 提示词结构清晰，依次包含：角色定位、外呼目标、核心话术策略、回复风格、边界与异常处理
2. 语言简洁专业，适合直接作为 Bot 的 system prompt 使用
3. 以下命令行已由系统自动注入到提示词顶部，生成正文时不要重复出现这些命令行，也不要再描述它们的功能：
${toolBlock || '(无)'}
   以下能力已由算法工具接管，提示词正文中不要描述这些能力：${excludeCapabilities.join('、') || '无'}
4. 以下是必须原样插入到生成提示词中的固定模块内容，每个模块用【模块：名称】标注。要求：逐字保留内容不得改写，根据模块语义插入到提示词中最合适的位置，不得遗漏任何一个模块：
${selectedModuleContents || '(无固定模块，跳过此步骤)'}
5. 直接输出提示词正文，不要有任何前言、解释、markdown 标题或代码块包裹`
}

export function getGenerationUserPrompt(params: {
  generationType: GenerationType
  requirementInput: string
  templateInput: string
  clarificationQA: ClarificationQA[]
}): string {
  const { generationType, requirementInput, templateInput, clarificationQA } = params
  const cleanTemplate = stripToolCommands(templateInput)
  const base =
    generationType === 'template'
      ? `请基于以下参考模板，结合本次外呼需求进行润色优化：\n\n【参考模板】\n${cleanTemplate}\n\n【本次外呼需求】\n${requirementInput}`
      : `请根据以下外呼需求从零生成提示词：\n\n${requirementInput}`

  const qa = clarificationQA.filter((item) => item.answer.trim())
  if (qa.length === 0) return base

  const qaText = qa.map((item) => `Q：${item.question}\nA：${item.answer}`).join('\n\n')
  return `${base}\n\n【补充信息】\n${qaText}`
}

export function getTuningSystemPrompt(): string {
  return `你是一个提示词优化助手。用户会给你一段当前的 Bot 系统提示词，以及一条修改指令。

【关于算法工具命令行】
提示词顶部可能存在若干以 # 开头的命令行（如 # 开启承接词、# @act: 日期时间解析 -> 变量名 等），这些是算法工具命令，由系统在运行时自动处理特定能力（承接词播报、时间抽取、地址补全等）。
对这些命令行的要求：
1. 必须原样保留，不得修改、删除或合并
2. 必须始终位于提示词的最顶部，任何新增内容都只能加在这些命令行的下方
3. 不要在命令行上方插入任何文字

请严格按照修改指令调整提示词正文部分，保持未涉及部分不变。
直接输出修改后的完整提示词，不要有任何解释、前言或 markdown 格式。`
}

export function getTuningUserPrompt(currentResult: string, instruction: string, historyLength: number): string {
  if (historyLength === 0) {
    return `当前提示词：\n${currentResult}\n\n修改指令：${instruction}`
  }
  return `修改指令：${instruction}`
}

export function getToolRecommendationSystemPrompt(): string {
  return `你是一个提示词工程师助手。根据用户的外呼需求，从给定的工具列表中推荐最适合的工具。
只返回工具 id 的 JSON 数组，不要有任何解释或 markdown，格式严格如下：
["id1", "id2"]`
}

export function getToolRecommendationUserPrompt(
  requirementInput: string,
  tools: { id: string; name: string; description: string }[]
): string {
  const toolList = tools.map((t) => `- ${t.id}: ${t.name}（${t.description}）`).join('\n')
  return `外呼需求：${requirementInput}\n\n可用工具列表：\n${toolList}`
}
