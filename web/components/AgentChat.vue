<script setup lang="ts">
interface Props {
  agentId: string
  threadId: string
  userId: string
  model?: string
}

const props = defineProps<Props>()

const { messages, input, setMessages, addUserMessage } = useAgentChat()
const { runAgent } = useAgentRun({
  agentId: props.agentId,
  threadId: props.threadId,
  userId: props.userId
})

const isGenerating = ref(false)
const messagesEndRef = ref<HTMLElement | null>(null)

const { chats: historyChats, loadMore, hasMore, isLoading: isLoadingHistory } = useThreadHistory(
  props.threadId,
  props.userId
)

const historyMessages = computed(() =>
  historyChats.value.flatMap((chat) =>
    chat.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
      content: typeof msg.content === 'string' ? msg.content : (msg.content as any)?.text || ''
    }))
  )
)

const allMessages = computed(() => [...historyMessages.value, ...messages.value])

const scrollToBottom = () => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

watch(() => isLoadingHistory.value, (loading) => {
  if (!loading) {
    scrollToBottom()
  }
})

onMounted(() => {
  if (props.threadId && props.userId) {
    loadMore()
  }
  scrollToBottom()
})

const handleSSEEvent = (event: any) => {
  switch (event.type) {
    case 'TEXT_MESSAGE_START':
      break

    case 'TEXT_MESSAGE_CONTENT':
      setMessages((prev: any[]) => {
        const lastMsg = prev[prev.length - 1]
        if (lastMsg?.role === 'assistant' && lastMsg.id.startsWith('temp_')) {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: (lastMsg.content as string) + event.data.content }
          ]
        } else {
          return [
            ...prev,
            { id: 'temp_' + Date.now(), role: 'assistant' as const, content: event.data.content }
          ]
        }
      })
      break

    case 'TEXT_MESSAGE_END':
      setMessages((prev: any[]) => {
        const lastMsg = prev[prev.length - 1]
        if (lastMsg?.role === 'assistant' && lastMsg.id.startsWith('temp_')) {
          return [...prev.slice(0, -1), { ...lastMsg, id: crypto.randomUUID() }]
        }
        return prev
      })
      break

    case 'RUN_STARTED':
      isGenerating.value = true
      break

    case 'RUN_FINISHED':
      isGenerating.value = false
      break

    case 'RUN_ERROR':
      isGenerating.value = false
      console.error('Error:', event.data.error)
      break

    default:
      break
  }
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  if (target.scrollTop === 0 && hasMore.value && !isLoadingHistory.value) {
    loadMore()
  }
}

const handleSubmit = async () => {
  if (!input.value.trim() || isGenerating.value) return

  const userInput = input.value.trim()
  const userMsgId = crypto.randomUUID()
  addUserMessage(userInput)

  await runAgent({
    messages: [
      ...allMessages.value.map((m) => ({ id: m.id, role: m.role, content: m.content })),
      { id: userMsgId, role: 'user' as const, content: userInput }
    ],
    tools: [],
    context: [],
    forwardedProps: { agentId: props.agentId, userId: props.userId, model: props.model }
  })
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!e.shiftKey && (e.target as HTMLElement).tagName !== 'TEXTAREA') return
  if (!e.shiftKey && e.key === 'Enter') {
    e.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-muted text-default">
    <div class="flex-1 overflow-auto p-6" @scroll="handleScroll">
      <div v-if="isLoadingHistory" class="text-center py-4 text-muted">
        加载更多...
      </div>

      <div v-if="allMessages.length === 0" class="text-center text-muted mt-24">
        开始对话吧！
      </div>

      <div
        v-for="(msg, index) in allMessages"
        :key="msg.id || index"
        class="mb-4 flex"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div class="flex items-start gap-2 max-w-2xl">
          <div
            v-if="msg.role !== 'user'"
            class="w-9 h-9 rounded-full bg-primary text-inverted flex items-center justify-center text-sm flex-shrink-0"
          >
            AI
          </div>
          <div
            class="px-4 py-3 shadow-sm whitespace-pre-wrap break-words"
            :class="msg.role === 'user'
              ? 'bg-primary text-inverted rounded-2xl rounded-tr-sm'
              : 'bg-default text-default border border-default rounded-2xl rounded-tl-sm'"
          >
            {{ String(msg.content) }}
          </div>
          <div
            v-if="msg.role === 'user'"
            class="w-9 h-9 rounded-full bg-inverted text-inverted flex items-center justify-center text-sm flex-shrink-0"
          >
            我
          </div>
        </div>
      </div>

      <div v-if="isGenerating" class="mb-4 flex justify-start">
        <div class="flex items-start gap-2 max-w-2xl">
          <div class="w-9 h-9 rounded-full bg-primary text-inverted flex items-center justify-center text-sm flex-shrink-0">
            AI
          </div>
          <div class="px-4 py-3 bg-default border border-default rounded-2xl rounded-tl-sm shadow-sm">
            <span class="text-muted">正在思考...</span>
          </div>
        </div>
      </div>

      <div ref="messagesEndRef" />
    </div>

    <div class="p-4 bg-default border-t border-default">
      <UTextarea
        v-model="input"
        placeholder="输入消息..."
        :disabled="isGenerating"
        :rows="1"
        class="w-full"
        @keydown="handleKeydown"
      />
    </div>
  </div>
</template>
