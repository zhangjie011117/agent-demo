'use client';

/**
 * AgentChat组件
 * AG-UI对话组件，负责显示消息和处理用户输入
 */
import { useState, useCallback } from 'react';
import { useAgentRun, useAgentChat } from '@/hooks/use-agent-run';
import { useThreadHistory } from '@/hooks/use-thread-history';

interface AgentChatProps {
  agentId: string;
  threadId: string;
  userId: string;
  model?: string;
}

/**
 * AgentChat组件
 * @param agentId - Agent ID
 * @param threadId - 线程 ID
 * @param userId - 用户 ID
 */
export function AgentChat({ agentId, threadId, userId, model }: AgentChatProps) {
  const {
    messages,
    input,
    setInput,
    setMessages,
    addUserMessage,
    addAssistantMessage,
  } = useAgentChat();

  const [isGenerating, setIsGenerating] = useState(false);

  const {
    chats: historyChats,
    loadMore,
    hasMore,
    isLoading: isLoadingHistory,
  } = useThreadHistory(threadId, userId);

  // 将 history chats 转为扁平消息列表
  const historyMessages = historyChats.flatMap((chat) =>
    chat.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
      content: typeof msg.content === 'string' ? msg.content : msg.content?.text || '',
    }))
  );

  // 合并历史消息和当前消息
  const allMessages = [...historyMessages, ...messages];

  // SSE事件处理
  const handleSSEEvent = useCallback((event: any) => {
    console.log('AG-UI Event:', event.type, event.data);

    switch (event.type) {
      case 'TEXT_MESSAGE_START':
        console.log('TEXT_MESSAGE_START received, messageId:', event.data?.messageId);
        break;

      case 'TEXT_MESSAGE_CONTENT':
        console.log('TEXT_MESSAGE_CONTENT received, content:', event.data?.content);
        // 累积文本内容
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          // 如果最后一条是正在生成的助手消息(temp_开头)，则追加
          if (lastMsg?.role === 'assistant' && lastMsg.id.startsWith('temp_')) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMsg,
                content: (lastMsg.content as string) + event.data.content,
              },
            ];
          } else {
            // 创建新消息
            return [
              ...prev,
              {
                id: 'temp_' + Date.now(),
                role: 'assistant' as const,
                content: event.data.content,
              },
            ];
          }
        });
        break;

      case 'TEXT_MESSAGE_END':
        // 消息结束，生成完成 - 替换temp_ id为正式id
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant' && lastMsg.id.startsWith('temp_')) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMsg,
                id: crypto.randomUUID(),
              },
            ];
          }
          return prev;
        });
        setIsGenerating(false);
        break;

      case 'RUN_STARTED':
        // Agent开始运行
        setIsGenerating(true);
        break;

      case 'RUN_FINISHED':
        // Agent运行完成
        setIsGenerating(false);
        break;

      case 'RUN_ERROR':
        // 运行出错
        console.error('Agent run error:', event.data.error);
        setIsGenerating(false);
        alert('Error: ' + event.data.error);
        break;

      case 'TOOL_CALL_START':
        // 工具调用开始
        console.log('Tool call started:', event.data.toolName);
        break;

      case 'TOOL_CALL_ARGS':
        // 工具参数
        console.log('Tool args:', event.data.args);
        break;

      case 'TOOL_CALL_END':
        // 工具调用结束
        console.log('Tool call ended:', event.data.toolCallId);
        break;

      default:
        console.log('Unknown event type:', event.type);
    }
  }, [setMessages]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      // 滚动到顶部时加载更多
      if (target.scrollTop === 0 && hasMore && !isLoadingHistory) {
        loadMore();
      }
    },
    [hasMore, isLoadingHistory, loadMore]
  );

  const { runAgent } = useAgentRun({
    agentId,
    threadId,
    userId,
    onMessage: handleSSEEvent,
  });

  /**
   * 提交处理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isGenerating) {
      return;
    }

    const userInput = input.trim();
    const userMsgId = crypto.randomUUID();

    // 先添加到本地消息列表
    addUserMessage(userInput);

    // 调用Agent，包含当前用户输入
    await runAgent({
      messages: [
        ...messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
        {
          id: userMsgId,
          role: 'user' as const,
          content: userInput,
        },
      ],
      tools: [],
      context: [],
      forwardedProps: {
        agentId,
        userId,
        model,
      },
    });
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#f9f9f9'
    }}>
      {/* 消息列表 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem',
      }} onScroll={handleScroll}>
        {isLoadingHistory && (
          <div style={{ textAlign: 'center', padding: '0.5rem', color: '#999' }}>
            加载更多...
          </div>
        )}

        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#999',
            marginTop: '2rem'
          }}>
            开始对话吧！
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            style={{
              marginBottom: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: msg.role === 'user' ? '#007AFF' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#333',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              {String(msg.content)}
            </div>
            <span style={{
              fontSize: '0.75rem',
              color: '#999',
              marginTop: '0.25rem',
            }}>
              {msg.role === 'user' ? '你' : '助手'}
            </span>
          </div>
        ))}

        {isGenerating && (
          <div style={{
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}>
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: '#fff',
              color: '#666',
            }}>
              正在思考...
            </div>
          </div>
        )}
      </div>

      {/* 输入框 */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '1rem',
          background: '#fff',
          borderTop: '1px solid #e5e5e5',
        }}
      >
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            disabled={isGenerating}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #e5e5e5',
              borderRadius: '24px',
              outline: 'none',
              fontSize: '1rem',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '24px',
              background: isGenerating ? '#ccc' : '#007AFF',
              color: '#fff',
              fontSize: '1rem',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? '发送中...' : '发送'}
          </button>
        </div>
      </form>
    </div>
  );
}
