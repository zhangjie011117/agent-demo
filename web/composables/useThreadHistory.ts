import type { ThreadChat } from '~/types'

interface UseThreadHistoryResult {
  chats: ThreadChat[]
  loadMore: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
  reset: () => void
  error: Error | null
}

export const useThreadHistory = (
  threadId: string,
  userId: string,
  limit: number = 20
): UseThreadHistoryResult => {
  const chats = ref<ThreadChat[]>([])
  const nextCursor = ref<string | null>(null)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const resetFlagRef = ref(false)
  const abortController = ref<AbortController | null>(null)

  const config = useRuntimeConfig()
  const apiUrl = config.public.agentApiUrl as string

  const loadMore = async () => {
    if (isLoading.value || !hasMore.value) return

    isLoading.value = true
    error.value = null
    abortController.value = new AbortController()

    try {
      const params = new URLSearchParams({
        threadId,
        userId,
        limit: limit.toString()
      })

      if (nextCursor.value) {
        params.set('beforeMessageId', nextCursor.value)
      }

      const response = await fetch(`${apiUrl}/agent/chats?${params}`, {
        signal: abortController.value.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const result = await response.json()

      if (resetFlagRef.value) {
        resetFlagRef.value = false
        return
      }

      if (result.data && Array.isArray(result.data)) {
        chats.value = [...chats.value, ...result.data]
      }
      if (result.pagination) {
        hasMore.value = result.pagination.hasMore
        nextCursor.value = result.pagination.nextCursor
      }
    } catch (err) {
      console.error('Failed to load history:', err)
      error.value = err instanceof Error ? err : new Error('Failed to load history')
    } finally {
      isLoading.value = false
      abortController.value = null
    }
  }

  const reset = () => {
    resetFlagRef.value = true
    abortController.value?.abort()
    abortController.value = null
    chats.value = []
    nextCursor.value = null
    hasMore.value = true
    error.value = null
  }

  return {
    chats,
    loadMore,
    hasMore,
    isLoading,
    reset,
    error
  }
}
