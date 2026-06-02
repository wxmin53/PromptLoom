type TabId = 'prompt' | 'chat'

interface HeaderProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onOpenDrawer: () => void
  onReset: () => void
  onClearChat: () => void
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'prompt', label: '提示词生成' },
  { id: 'chat', label: 'AI 对话' },
]

export default function Header({ activeTab, onTabChange, onOpenDrawer, onReset, onClearChat }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {activeTab === 'prompt' ? (
            <>
              <button onClick={onReset} className="text-sm text-gray-500 hover:text-gray-700">
                清空重置
              </button>
              <button onClick={onOpenDrawer} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                历史草稿
              </button>
            </>
          ) : (
            <button onClick={onClearChat} className="text-sm text-gray-500 hover:text-gray-700">
              清空对话
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
