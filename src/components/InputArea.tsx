import type { GenerationType } from '../types'

interface InputAreaProps {
  generationType: GenerationType
  requirementInput: string
  templateInput: string
  onRequirementChange: (v: string) => void
  onTemplateChange: (v: string) => void
}

export default function InputArea({
  generationType,
  requirementInput,
  templateInput,
  onRequirementChange,
  onTemplateChange,
}: InputAreaProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          本次外呼需求 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={requirementInput}
          onChange={(e) => onRequirementChange(e.target.value)}
          placeholder={
            generationType === 'template'
              ? '描述本次外呼的目标、产品/服务、目标客群、特殊要求等…'
              : '描述本次外呼的目标、产品/服务、目标客群、话术风格、特殊要求等，描述越详细，生成效果越好…'
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ minHeight: generationType === 'template' ? 120 : 200 }}
        />
        <div className="text-right text-xs text-gray-400 mt-1">{requirementInput.length} 字</div>
      </div>

      {generationType === 'template' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            参考模板 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={templateInput}
            onChange={(e) => onTemplateChange(e.target.value)}
            placeholder="粘贴历史提示词模板，AI 将基于此模板结合外呼需求润色优化…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ minHeight: 160 }}
          />
          <div className="text-right text-xs text-gray-400 mt-1">{templateInput.length} 字</div>
        </div>
      )}
    </div>
  )
}
