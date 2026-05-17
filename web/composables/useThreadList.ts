import type { ThreadItem } from '~/types'
import type { Ref } from 'vue'

interface UseThreadListResult {
  threads: ThreadItem[]
  loadThreads: () => Promise<void>
  isLoading: boolean
  error: Error | null
}

export const useThreadList = (userIdRef: Ref<string>): UseThreadListResult => {
  const threads = ref<ThreadItem[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const config = useRuntimeConfig()
  const apiUrl = config.public.agentApiUrl as string

  const loadThreads = async () => {
    if (!userIdRef.value) return  // Use .value since it's now a Ref
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

  return {
    threads,
    loadThreads,
    isLoading,
    error
  }
}
