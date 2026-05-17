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
  (e: 'delete', threadId: string): void
}>()
</script>

<template>
  <div class="flex h-full flex-col bg-muted text-default">
    <div class="border-b border-default p-3">
      <UButton
        block
        color="primary"
        variant="solid"
        icon="i-lucide-plus"
        class="justify-center"
        @click="emit('new')"
      >
        新聊天
      </UButton>
    </div>

    <div class="px-4 pb-2 pt-4 text-xs font-medium tracking-wide text-muted">
      会话
    </div>

    <div class="flex-1 overflow-auto px-2 pb-3">
      <div v-if="isLoading" class="text-center py-10 text-muted">
        加载中...
      </div>
      <div v-else-if="threads.length === 0" class="text-center py-10 text-muted">
        暂无会话
      </div>
      <div v-else class="space-y-1">
        <div
          v-for="thread in threads"
          :key="thread.threadId"
          class="group relative cursor-pointer rounded-xl border px-3 py-2.5 transition-all"
          :class="thread.threadId === currentThreadId
            ? 'border-transparent bg-primary/10'
            : 'border-transparent text-toned hover:bg-elevated/70'"
          @click="emit('select', thread.threadId)"
        >
          <span
            v-if="thread.threadId === currentThreadId"
            class="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-primary"
          />
          <div class="min-w-0">
            <div class="flex min-w-0 items-center gap-2">
              <div
                class="min-w-0 flex-1 truncate text-sm font-semibold"
                :class="thread.threadId === currentThreadId ? 'text-primary' : 'text-toned'"
              >
                {{ thread.name }}
              </div>
              <UButton
                v-if="thread.threadId === currentThreadId"
                color="error"
                variant="ghost"
                size="xs"
                class="shrink-0"
                @click.stop="emit('delete', thread.threadId)"
              >
                删除
              </UButton>
            </div>
            <div
              class="mt-1 truncate text-xs"
              :class="thread.threadId === currentThreadId ? 'text-highlighted' : 'text-muted'"
            >
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
  </div>
</template>
