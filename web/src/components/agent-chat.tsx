'use client';

/**
 * AgentChat组件 - 使用 Ant Design Vue
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Input, Spin, Avatar } from 'antd';
import { useAgentRun, useAgentChat } from '@/hooks/use-agent-run';
import { useThreadHistory } from '@/hooks/use-thread-history';

interface AgentChatProps {
  agentId: string;
  threadId: string;
  userId: string;
  model?: string;
}

export function AgentChat({ agentId, threadId, userId, model }: AgentChatProps) {
  const { messages, input, setInput, setMessages, addUserMessage } = useAgentChat();
  const [isGenerating, setIsGenerating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const {
    chats: historyChats,
    loadMore,
    hasMore,
    isLoading: isLoadingHistory,
  } = useThreadHistory(threadId, userId);

  const historyMessages = historyChats.flatMap((chat) =>
    chat.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
      content: typeof msg.content === 'string' ? msg.content : (msg.content as any)?.text || '',
    }))
  );

  const allMessages = [...historyMessages, ...messages];

  useEffect(() => {
    if (!isLoadingHistory) {
      scrollToBottom();
    }
  }, [historyChats, isLoadingHistory, scrollToBottom]);

  useEffect(() => {
    if (threadId && userId) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, userId]);

  const handleSSEEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'TEXT_MESSAGE_START':
        break;

      case 'TEXT_MESSAGE_CONTENT':
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant' && lastMsg.id.startsWith('temp_')) {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: (lastMsg.content as string) + event.data.content },
            ];
          } else {
            return [
              ...prev,
              { id: 'temp_' + Date.now(), role: 'assistant' as const, content: event.data.content },
            ];
          }
        });
        break;

      case 'TEXT_MESSAGE_END':
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant' && lastMsg.id.startsWith('temp_')) {
            return [...prev.slice(0, -1), { ...lastMsg, id: crypto.randomUUID() }];
          }
          return prev;
        });
        setIsGenerating(false);
        break;

      case 'RUN_STARTED':
        setIsGenerating(true);
        break;

      case 'RUN_FINISHED':
        setIsGenerating(false);
        break;

      case 'RUN_ERROR':
        setIsGenerating(false);
        alert('Error: ' + event.data.error);
        break;

      default:
        break;
    }
  }, [setMessages]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      if (target.scrollTop === 0 && hasMore && !isLoadingHistory) {
        loadMore();
      }
    },
    [hasMore, isLoadingHistory, loadMore]
  );

  const { runAgent } = useAgentRun({ agentId, threadId, userId, onMessage: handleSSEEvent });

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return;

    const userInput = input.trim();
    const userMsgId = crypto.randomUUID();
    addUserMessage(userInput);

    await runAgent({
      messages: [
        ...allMessages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
        { id: userMsgId, role: 'user' as const, content: userInput },
      ],
      tools: [],
      context: [],
      forwardedProps: { agentId, userId, model },
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      {/* 消息列表 */}
      <div
        style={{ flex: 1, overflow: 'auto', padding: '24px' }}
        onScroll={handleScroll}
      >
        {isLoadingHistory && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Spin tip="加载更多..." />
          </div>
        )}

        {allMessages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '100px' }}>
            开始对话吧！
          </div>
        )}

        {allMessages.map((msg, index) => (
          <div
            key={msg.id || index}
            style={{
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '70%' }}>
              {msg.role !== 'user' && <Avatar style={{ background: '#1890ff' }}>AI</Avatar>}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? '#1890ff' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {String(msg.content)}
              </div>
              {msg.role === 'user' && <Avatar style={{ background: '#52c41a' }}>我</Avatar>}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px' }}>
            <Avatar style={{ background: '#1890ff' }}>AI</Avatar>
            <div style={{ padding: '12px 16px', borderRadius: '16px', background: '#fff' }}>
              <Spin size="small" tip="正在思考..." />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入消息..."
          disabled={isGenerating}
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          style={{ borderRadius: '8px' }}
        />
      </div>
    </div>
  );
}
