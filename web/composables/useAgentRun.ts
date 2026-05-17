import { HttpAgent } from '@ag-ui/client'
import type { AgentMessage } from '~/types'

interface AgentEvent {
  type: string
  data: any
}

interface UseAgentRunOptions {
  agentId: string
  threadId: string
  userId: string
  onMessage?: (event: AgentEvent) => void
}

interface RunAgentInput {
  messages: AgentMessage[]
  tools: any[]
  context: any[]
  forwardedProps: any
}

export const useAgentRun = ({ agentId, threadId, userId, onMessage }: UseAgentRunOptions) => {
  const isStreaming = ref(false)

  const config = useRuntimeConfig()
  const apiUrl = config.public.agentApiUrl as string
  const agent = new HttpAgent({
    url: `${apiUrl}/runAgent/${agentId}`,
    threadId,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const runAgent = async (input: RunAgentInput) => {
    isStreaming.value = true

    try {
      agent.setMessages(input.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: typeof m.content === 'string' ? m.content : String(m.content)
      })) as any)

      const result = await agent.runAgent({
        runId: crypto.randomUUID(),
        tools: input.tools,
        context: input.context,
        forwardedProps: {
          ...input.forwardedProps,
          userId
        }
      }, {
        onRunStartedEvent: ({ event }: any) => onMessage?.(event),
        onTextMessageStartEvent: ({ event }: any) => onMessage?.(event),
        onTextMessageContentEvent: ({ event }: any) => onMessage?.(event),
        onTextMessageEndEvent: ({ event }: any) => onMessage?.(event),
        onRunFinishedEvent: ({ event }: any) => onMessage?.(event),
        onRunErrorEvent: ({ event }: any) => onMessage?.(event),
      } as any)

      return result
    } catch (error: any) {
      onMessage?.({
        type: 'RUN_ERROR',
        data: { error: error.message || 'Unknown error' }
      })
      throw error
    } finally {
      isStreaming.value = false
    }
  }

  const cancel = () => {
    // Streaming cancellation can be added here if the UI exposes a stop action.
  }

  return { runAgent, isStreaming, cancel }
}

export const useAgentChat = () => {
  const messages = ref<AgentMessage[]>([])
  const input = ref('')

  const addUserMessage = (content: string, id: string = crypto.randomUUID()) => {
    const userMessage: AgentMessage = {
      id,
      role: 'user',
      content
    }
    messages.value = [...messages.value, userMessage]
    input.value = ''
  }

  const addAssistantMessage = (content: string) => {
    const assistantMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content
    }
    messages.value = [...messages.value, assistantMessage]
  }

  const clearMessages = () => {
    messages.value = []
  }

  const setMessages = (updater: AgentMessage[] | ((messages: AgentMessage[]) => AgentMessage[])) => {
    messages.value = typeof updater === 'function' ? updater(messages.value) : updater
  }

  return {
    messages,
    input,
    setMessages,
    addUserMessage,
    addAssistantMessage,
    clearMessages
  }
}
