import type { ChatState, ChatFileAttachment } from '../types'
import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'

interface ChatPageProps {
  state: ChatState
  onSend: (text: string, excelMode: boolean) => void
  onStop: () => void
  onAddAttachment: (att: ChatFileAttachment) => void
  onRemoveAttachment: (index: number) => void
}

export default function ChatPage({ state, onSend, onStop, onAddAttachment, onRemoveAttachment }: ChatPageProps) {
  return (
    <div className="w-full max-w-[860px] mx-auto px-4 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      <ChatMessageList messages={state.messages} />
      <ChatInput
        attachments={state.pendingAttachments}
        isLoading={state.isLoading}
        onSend={onSend}
        onStop={onStop}
        onAddAttachment={onAddAttachment}
        onRemoveAttachment={onRemoveAttachment}
      />
    </div>
  )
}
