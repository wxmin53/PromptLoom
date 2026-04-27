import type { GenerationType } from '../types'

interface PathSelectorProps {
  value: GenerationType
  onChange: (v: GenerationType) => void
}

const options: { value: GenerationType; label: string; desc: string }[] = [
  { value: 'template', label: '模板生成', desc: '基于历史模板润色优化' },
  { value: 'freeform', label: '无模板生成', desc: '从零描述，AI 生成完整提示词' },
]

export default function PathSelector({ value, onChange }: PathSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.desc}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              selected
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
