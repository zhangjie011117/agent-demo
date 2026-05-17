<script setup lang="ts">
interface Props {
  agentId: string
  threadId: string
  userId: string
}

const props = defineProps<Props>()

const { messages, input, setMessages, addUserMessage } = useAgentChat()

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
            { ...lastMsg, content: (lastMsg.content as string) + event.delta }
          ]
        } else {
          return [
            ...prev,
            { id: 'temp_' + Date.now(), role: 'assistant' as const, content: event.delta }
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
      break

    default:
      break
  }
}

const { runAgent } = useAgentRun({
  agentId: props.agentId,
  threadId: props.threadId,
  userId: props.userId,
  onMessage: handleSSEEvent
})

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
  addUserMessage(userInput, userMsgId)

  await runAgent({
    messages: [
      ...allMessages.value.map((m) => ({ id: m.id, role: m.role, content: m.content })),
      { id: userMsgId, role: 'user' as const, content: userInput }
    ],
    tools: [],
    context: [],
    forwardedProps: { userId: props.userId }
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
  <div class="flex h-full flex-col bg-default text-default">
    <div class="flex-1 overflow-auto px-4 py-8" @scroll="handleScroll">
      <div v-if="isLoadingHistory" class="text-center py-4 text-muted">
        加载更多...
      </div>

      <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div v-if="allMessages.length === 0" class="pt-28 text-center">
          <div class="text-2xl font-semibold text-highlighted">开始对话吧</div>
          <div class="mt-2 text-sm text-muted">输入消息后，助手会在这里回复。</div>
        </div>

        <div
          v-for="(msg, index) in allMessages"
          :key="msg.id || index"
          class="flex w-full"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="whitespace-pre-wrap break-words text-sm leading-7"
            :class="msg.role === 'user'
              ? 'max-w-[78%] rounded-3xl bg-elevated px-5 py-2.5 text-default'
              : 'w-full rounded-2xl border border-default bg-muted px-5 py-3 text-default shadow-sm'"
          >
            {{ String(msg.content) }}
          </div>
        </div>

        <div v-if="isGenerating" class="flex justify-start">
          <div class="w-full rounded-2xl border border-default bg-muted px-5 py-3 text-sm leading-7 shadow-sm">
            <span class="text-muted">正在思考...</span>
          </div>
        </div>

        <div ref="messagesEndRef" />
      </div>
    </div>

    <div class="bg-default px-4 pb-5 pt-2">
      <div class="mx-auto w-full max-w-3xl rounded-3xl border border-default bg-default p-3 shadow-sm">
        <UTextarea
          v-model="input"
          placeholder="输入消息..."
          :disabled="isGenerating"
          :rows="2"
          autoresize
          variant="none"
          class="w-full"
          :ui="{ base: 'resize-none text-sm leading-6' }"
          @keydown="handleKeydown"
        />
        <div class="mt-2 flex items-center justify-between">
          <span class="text-xs text-muted">Enter 发送，Shift + Enter 换行</span>
          <UButton
            color="neutral"
            :disabled="!input.trim() || isGenerating"
            @click="handleSubmit"
          >
            发送
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
