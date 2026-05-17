import type { ThreadItem } from '~/types'
import type { Ref } from 'vue'

interface UseThreadListResult {
  threads: Ref<ThreadItem[]>
  loadThreads: () => Promise<void>
  createThread: (agentId: string) => Promise<ThreadItem>
  deleteThread: (threadId: string) => Promise<void>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
}

export const useThreadList = (userIdRef: Ref<string>): UseThreadListResult => {
  const threads = ref<ThreadItem[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const config = useRuntimeConfig()
  const apiUrl = config.public.agentApiUrl as string

  const loadThreads = async () => {
    if (!userIdRef.value) {
      threads.value = []
      return
    }
    error.value = null

    isLoading.value = true
    try {
      const response = await fetch(`${apiUrl}/agent/threads?userId=${encodeURIComponent(userIdRef.value)}`)
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
      const result = await response.json()
      threads.value = result.data || []
    } catch (err) {
      console.error('Failed to load threads:', err)
      error.value = err instanceof Error ? err : new Error(String(err))
    } finally {
      isLoading.value = false
    }
  }

  const createThread = async (agentId: string) => {
    if (!userIdRef.value) throw new Error('Missing userId')
    error.value = null

    const response = await fetch(`${apiUrl}/agent/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, userId: userIdRef.value })
    })

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
    const result = await response.json()
    const thread = result.data as ThreadItem
    threads.value = [thread, ...threads.value.filter((item) => item.threadId !== thread.threadId)]
    return thread
  }

  const deleteThread = async (threadId: string) => {
    if (!userIdRef.value) throw new Error('Missing userId')
    error.value = null

    const response = await fetch(
      `${apiUrl}/agent/threads/${encodeURIComponent(threadId)}?userId=${encodeURIComponent(userIdRef.value)}`,
      { method: 'DELETE' }
    )

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
    threads.value = threads.value.filter((thread) => thread.threadId !== threadId)
  }

  return {
    threads,
    loadThreads,
    createThread,
    deleteThread,
    isLoading,
    error
  }
}
