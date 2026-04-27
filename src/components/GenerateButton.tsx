interface GenerateButtonProps {
  onClick: () => void
  disabled?: boolean
}

export default function GenerateButton({ onClick, disabled }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-base"
    >
      生成提示词
    </button>
  )
}
