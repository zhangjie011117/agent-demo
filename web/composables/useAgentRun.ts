import { HttpAgent } from '@ag-ui/client'
import type { AgentMessage } from '~/types'
import type {
  RunStartedEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  TextMessageStartEvent,
  RunFinishedEvent,
  RunErrorEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
} from '@ag-ui/core'

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
    url: `${apiUrl}/agent/run`,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Middleware to intercept and forward events
  agent.use((input, next) => {
    return next.run({
      ...input,
      onEvent: (event: any) => {
        // Forward events to callback
        onMessage?.({
          type: event.type,
          data: event
        })
      }
    })
  })

  const runAgent = async (input: RunAgentInput) => {
    isStreaming.value = true

    try {
      const result = await agent.runAgent({
        threadId,
        runId: crypto.randomUUID(),
        messages: input.messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : String(m.content)
        })),
        tools: input.tools,
        context: input.context,
        forwardedProps: {
          ...input.forwardedProps,
          agentId,
          userId
        }
      })

      // Process result if needed
      if (result.newMessages) {
        // Handle new messages from the response
      }

      return result
    } catch (error: any) {
      console.error('Agent run failed:', error)
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
    // HttpAgent doesn't have a built-in cancel method
    // The request will be aborted when the component unmounts
  }

  return { runAgent, isStreaming, cancel }
}

export const useAgentChat = () => {
  const messages = ref<AgentMessage[]>([])
  const input = ref('')

  const addUserMessage = (content: string) => {
    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
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

  return {
    messages,
    input,
    addUserMessage,
    addAssistantMessage,
    clearMessages
  }
}
