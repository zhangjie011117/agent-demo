<script setup lang="ts">
import type { AgentOption, ModelOption } from '~/types'

const config = useRuntimeConfig()
const apiUrl = config.public.agentApiUrl as string

const agents = ref<AgentOption[]>([])
const selectedAgent = ref('')
const userId = ref('')
const models = ref<ModelOption[]>([])
const selectedModel = ref('')
const threadId = ref('')
const isReady = ref(false)
const isConfigValid = ref(false)

const userIdRef = toRef(userId)
const { threads, loadThreads, isLoading: isLoadingThreads } = useThreadList(userIdRef)

watch(userId, (newVal) => {
  if (newVal) {
    loadThreads()
  }
})

onMounted(() => {
  Promise.all([
    fetch(`${apiUrl}/agents`).then((res) => {
      if (!res.ok) throw new Error('Failed to fetch agents')
      return res.json()
    }),
    fetch(`${apiUrl}/models`).then((res) => {
      if (!res.ok) throw new Error('Failed to fetch models')
      return res.json()
    })
  ])
    .then(([agentsData, modelsData]) => {
      agents.value = Array.isArray(agentsData) ? agentsData : []
      models.value = Array.isArray(modelsData) ? modelsData : []
      if (Array.isArray(modelsData) && modelsData.length > 0) {
        selectedModel.value = modelsData[0].id
      }
    })
    .catch((err) => {
      console.error('Failed to fetch config:', err)
    })

  const storedUserId = localStorage.getItem('userId') || ''
  userId.value = storedUserId
  isReady.value = true
})

watch(selectedAgent, (newVal) => {
  if (newVal) {
    let storedThreadId = localStorage.getItem(`thread_${newVal}`)
    if (!storedThreadId) {
      storedThreadId = crypto.randomUUID()
      localStorage.setItem(`thread_${newVal}`, storedThreadId)
    }
    threadId.value = storedThreadId
  }
})

watch([selectedAgent, userId, selectedModel], ([agent, uid, model]) => {
  isConfigValid.value = agent.trim().length > 0 && uid.trim().length > 0 && model.length > 0
})

const handleReset = () => {
  if (!selectedAgent.value) return
  const newThreadId = crypto.randomUUID()
  localStorage.setItem(`thread_${selectedAgent.value}`, newThreadId)
  threadId.value = newThreadId
}

const handleNewThread = () => {
  if (!selectedAgent.value) {
    alert('请先选择 Agent')
    return
  }
  const newThreadId = crypto.randomUUID()
  localStorage.setItem(`thread_${selectedAgent.value}`, newThreadId)
  threadId.value = newThreadId
  loadThreads()
}

const handleSelectThread = (newThreadId: string) => {
  threadId.value = newThreadId
}
</script>

<template>
  <div v-if="!isReady" class="flex items-center justify-center h-screen bg-default text-default">
    加载中...
  </div>

  <div v-else class="flex h-screen bg-default text-default">
    <aside v-if="isConfigValid" class="w-70 bg-muted border-r border-default flex-shrink-0">
      <Sidebar
        :threads="threads"
        :current-thread-id="threadId"
        :is-loading="isLoadingThreads"
        @select="handleSelectThread"
        @new="handleNewThread"
      />
    </aside>

    <main class="flex-1 flex flex-col min-w-0">
      <header class="h-16 px-6 bg-default border-b border-default flex items-center gap-4">
        <span class="text-lg font-medium">Agent Chat</span>
        <span v-if="threadId" class="text-sm text-muted">
          Thread: {{ threadId.substring(0, 8) }}...
        </span>
      </header>

      <div class="flex-1 flex flex-col">
        <div class="px-6 py-3 bg-muted border-b border-default flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-toned">Agent:</span>
            <USelect
              v-model="selectedAgent"
              :options="agents.map(a => ({ value: a.id, label: a.name }))"
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
              @input="(e: any) => {
                userId = e.target.value
                localStorage.setItem('userId', e.target.value)
              }"
            />
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-toned">模型:</span>
            <USelect
              v-model="selectedModel"
              :options="models.map(m => ({ value: m.id, label: `${m.name} (${m.provider})` }))"
              class="w-52"
            />
          </div>

          <UButton
            :disabled="!selectedAgent"
            @click="handleReset"
          >
            清除对话
          </UButton>
        </div>

        <div v-if="isConfigValid" class="flex-1 overflow-hidden">
          <AgentChat
            :agent-id="selectedAgent"
            :thread-id="threadId"
            :user-id="userId"
            :model="selectedModel"
          />
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-muted">
          请选择 Agent、输入用户ID后开始对话
        </div>
      </div>
    </main>
  </div>
</template>
