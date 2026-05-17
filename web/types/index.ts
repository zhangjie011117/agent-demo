export interface ThreadMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: unknown
  toolCallId?: string | null
  createdAt: string
}

export interface ThreadChat {
  id: string
  createdAt: string
  rating: number | null
  feedback: string | null
  tokenUsage: unknown
  messages: ThreadMessage[]
}

export interface ThreadItem {
  threadId: string
  name: string
  createdAt: string
  agentId: string
}

export interface AgentOption {
  id: string
  name: string
}

export interface ModelOption {
  id: string
  name: string
  provider: string
}

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: unknown
  toolCallId?: string
}
