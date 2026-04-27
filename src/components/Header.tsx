interface HeaderProps {
  onOpenDrawer: () => void
}

export default function Header({ onOpenDrawer }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-[960px] mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-semibold text-gray-900 text-base">外呼提示词生成工具</span>
        <button
          onClick={onOpenDrawer}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          历史草稿
        </button>
      </div>
    </header>
  )
}
