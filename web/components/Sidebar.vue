<script setup lang="ts">
import type { ThreadItem } from '~/types'

interface Props {
  threads: ThreadItem[]
  currentThreadId: string
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', threadId: string): void
  (e: 'new'): void
}>()
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="p-3">
      <UButton block @click="emit('new')">
        + 新建会话
      </UButton>
    </div>

    <div class="flex-1 overflow-auto">
      <div v-if="isLoading" class="text-center py-10 text-muted">
        加载中...
      </div>
      <div v-else-if="threads.length === 0" class="text-center py-10 text-muted">
        暂无会话
      </div>
      <div v-else>
        <div
          v-for="thread in threads"
          :key="thread.threadId"
          class="px-4 py-3 cursor-pointer border-l-3 transition-colors"
          :class="thread.threadId === currentThreadId
            ? 'bg-elevated border-l-primary'
            : 'border-l-default hover:bg-elevated'"
          @click="emit('select', thread.threadId)"
        >
          <div class="text-sm text-highlighted">{{ thread.name }}</div>
          <div class="text-xs text-muted">
            {{ new Date(thread.createdAt).toLocaleString('zh-CN', {
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
