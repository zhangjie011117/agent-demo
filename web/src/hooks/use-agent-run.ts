'use client';

/**
 * useAgentRun Hook
 * SSE流式调用Hook，用于与后端/agent/run接口通信
 */
import { useState, useCallback } from 'react';

interface UseAgentRunOptions {
  agentId: string;
  threadId: string;
  userId: string;
  onMessage?: (event: any) => void; // AG-UI事件回调
}

interface RunAgentInput {
  messages: any[]; // 对话消息历史
  tools: any[]; // 可用工具列表
  context: any[]; // 上下文(业务画像等)
  forwardedProps: any; // 转发属性(包含agentId, userId等)
}

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: unknown;
  toolCallId?: string;
}

/**
 * useAgentRun - 调用后端SSE接口
 * @param options - 配置选项
 * @returns runAgent函数和isStreaming状态
 */
export function useAgentRun({ agentId, threadId, userId, onMessage }: UseAgentRunOptions) {
  const [isStreaming, setIsStreaming] = useState(false);

  /**
   * runAgent - 发起Agent运行请求
   * @param input - RunAgentInput参数
   */
  const runAgent = useCallback(async (input: RunAgentInput) => {
    setIsStreaming(true);

    try {
      // 发送POST请求到后端SSE端点
      const response = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3000'}/agent/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId, // 线程ID
          runId: crypto.randomUUID(), // 本次运行ID
          state: {}, // 状态对象(可选)
          ...input,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      // 使用ReadableStream读取SSE响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      // 循环读取直到完成
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码并处理SSE数据
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          // SSE格式: "data: {...}"
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              // 触发回调通知组件更新UI
              onMessage?.(event);
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Agent run failed:', error);
      onMessage?.({
        type: 'RUN_ERROR',
        data: { error: error.message || 'Unknown error' },
      });
    } finally {
      setIsStreaming(false);
    }
  }, [agentId, threadId, userId, onMessage]);

  return { runAgent, isStreaming };
}

/**
 * AgentChat状态管理Hook
 * 管理消息列表和输入
 */
export function useAgentChat() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');

  /**
   * 添加用户消息
   */
  const addUserMessage = useCallback((content: string) => {
    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
  }, []);

  /**
   * 添加助手消息
   */
  const addAssistantMessage = useCallback((content: string) => {
    const assistantMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
    };
    setMessages((prev) => [...prev, assistantMessage]);
  }, []);

  /**
   * 清空消息
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    input,
    setInput,
    setMessages,
    addUserMessage,
    addAssistantMessage,
    clearMessages,
  };
}
