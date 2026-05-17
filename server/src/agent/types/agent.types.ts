/**
 * Agent相关类型定义
 */

/**
 * 消息内容
 * 支持不同角色的消息结构
 */
export class MessageContent {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: unknown;
  toolCallId?: string;
}

/**
 * 工具定义(来自AG-UI)
 * 客户端工具的后端描述
 */
export class Tool {
  name: string;
  description?: string;
  parameters?: unknown;
}

/**
 * 上下文项
 * 用于传递业务画像等上下文信息
 */
export class ContextItem {
  description?: string;
  value?: string;
}

/**
 * 转发属性
 * 包含agentId和userId等关键信息
 */
export class ForwardedProps {
  agentId: string;
  userId?: string;
  clientDatasetIds?: string[];
  [key: string]: unknown;
}

/**
 * AG-UI RunAgentInput
 * 对应AG-UI协议的输入结构
 */
export class RunAgentInput {
  threadId: string;
  runId: string;
  parentRunId?: string;
  state?: unknown;
  messages: MessageContent[];
  tools?: Tool[];
  context?: ContextItem[];
  forwardedProps: ForwardedProps;
}

/**
 * Agent实体类型(简化版)
 */
export interface Agent {
  id: bigint;
  name: string;
  type: string;
  systemPrompt: string;
  personaPrompt: string;
  chatModelId?: bigint;
  shortTermMemoryConfig?: string;
  longTermMemoryConfig?: string;
  enabled: boolean;
  createdAt: bigint;
  updatedAt: bigint;
}

/**
 * ChatModel实体类型(简化版)
 */
export interface ChatModel {
  id: bigint;
  name: string;
  provider: string;
  baseUrl?: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  createdAt: bigint;
  updatedAt: bigint;
}

/**
 * AgentThread实体类型(简化版)
 */
export interface AgentThread {
  id: bigint;
  agentId: bigint;
  userId: string;
  uuid: string;
  name?: string;
  createdAt: bigint;
  updatedAt: bigint;
}

/**
 * AgentChat实体类型(简化版)
 */
export interface AgentChat {
  id: bigint;
  agentId: bigint;
  threadId: bigint;
  userId: string;
  content: string;
  metadata?: string;
  tokenUsage?: string;
  createdAt: bigint;
  updatedAt: bigint;
}

/**
 * AgentMessage实体类型(简化版)
 */
export interface AgentMessage {
  id: bigint;
  agentId: bigint;
  threadId: bigint;
  chatId: bigint;
  userId: string;
  role: string;
  content: string;
  tokenUsage?: string;
  createdAt: bigint;
}

/**
 * 内存配置类型
 */
export interface ShortTermMemoryConfig {
  enabled: boolean;
  limitHistoryTurns: number;
}

/**
 * 长期记忆配置类型
 */
export interface LongTermMemoryConfig {
  enabled: boolean;
  autoExtract: boolean;
  extractIntervalTurns: number;
}
