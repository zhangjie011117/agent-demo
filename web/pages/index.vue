<script setup lang="ts">
import type { AgentOption } from '~/types'

const config = useRuntimeConfig()
const apiUrl = config.public.agentApiUrl as string

const agents = ref<AgentOption[]>([])
const selectedAgent = ref('')
const userId = ref('')
const threadId = ref('')
const isReady = ref(false)

const userIdRef = toRef(userId)
const {
  threads,
  loadThreads,
  createThread,
  deleteThread,
  isLoading: isLoadingThreads
} = useThreadList(userIdRef)

const agentItems = computed(() => agents.value.map((agent) => ({ value: agent.id, label: agent.name })))
const visibleThreads = computed(() =>
  selectedAgent.value
    ? threads.value.filter((thread) => thread.agentId === selectedAgent.value)
    : []
)
const isConfigValid = computed(() => selectedAgent.value.trim().length > 0 && userId.value.trim().length > 0)
const canChat = computed(() => isConfigValid.value && threadId.value.trim().length > 0)

const selectFirstVisibleThread = () => {
  const firstThread = visibleThreads.value[0]
  threadId.value = firstThread?.threadId || ''
}

const ensureSelectedThreadVisible = () => {
  if (!threadId.value || !visibleThreads.value.some((thread) => thread.threadId === threadId.value)) {
    selectFirstVisibleThread()
  }
}

watch([selectedAgent, userId], async ([agent, uid]) => {
  if (!agent || !uid) {
    threadId.value = ''
    return
  }

  await loadThreads()
  ensureSelectedThreadVisible()
})

onMounted(() => {
  fetch(`${apiUrl}/listAgents`)
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch agents')
      return res.json()
    })
    .then((agentsData) => {
      agents.value = Array.isArray(agentsData) ? agentsData : []
      const firstAgent = agents.value[0]
      if (firstAgent && !selectedAgent.value) {
        selectedAgent.value = firstAgent.id
      }
    })
    .catch(() => {
    })

  const storedUserId = localStorage.getItem('userId') || ''
  userId.value = storedUserId
  isReady.value = true
})

const handleNewThread = async () => {
  if (!selectedAgent.value || !userId.value) {
    alert('请选择 Agent、输入用户ID')
    return
  }

  const thread = await createThread(selectedAgent.value)
  threadId.value = thread.threadId
  await loadThreads()
}

const handleSelectThread = (newThreadId: string) => {
  threadId.value = newThreadId
}

const handleDeleteThread = async (deletedThreadId: string) => {
  await deleteThread(deletedThreadId)

  if (threadId.value === deletedThreadId) {
    selectFirstVisibleThread()
  }
}

const handleUserIdInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  userId.value = value
  localStorage.setItem('userId', value)
}
</script>

<template>
  <div v-if="!isReady" class="flex items-center justify-center h-screen bg-default text-default">
    加载中...
  </div>

  <div v-else class="flex h-screen bg-default text-default">
    <aside class="w-72 bg-muted border-r border-default flex-shrink-0">
      <Sidebar
        :threads="visibleThreads"
        :current-thread-id="threadId"
        :is-loading="isLoadingThreads"
        @select="handleSelectThread"
        @new="handleNewThread"
        @delete="handleDeleteThread"
      />
    </aside>

    <main class="flex-1 flex flex-col min-w-0">
      <div class="flex-1 flex flex-col">
        <div class="px-6 py-3 bg-muted border-b border-default flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-toned">Agent:</span>
            <USelect
              v-model="selectedAgent"
              :items="agentItems"
              placeholder="选择 Agent"
              class="w-44"
            />
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-toned">用户ID:</span>
            <UInput
              :model-value="userId"
              placeholder="输入用户ID"
              class="w-44"
              @input="handleUserIdInput"
            />
          </div>

        </div>

        <div v-if="canChat" class="flex-1 overflow-hidden">
          <AgentChat
            :key="threadId"
            :agent-id="selectedAgent"
            :thread-id="threadId"
            :user-id="userId"
          />
        </div>
        <div v-else-if="isConfigValid" class="flex-1 flex items-center justify-center text-muted">
          点击新聊天开始对话
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-muted">
          请选择 Agent、输入用户ID后开始对话
        </div>
      </div>
    </main>
  </div>
</template>
