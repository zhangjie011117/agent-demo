'use client';

/**
 * Agent对话页面
 * 根据agentId显示对应的对话界面
 */
import { useState, useEffect } from 'react';
import { AgentChat } from '@/components/agent-chat';

interface AgentPageProps {
  params: {
    agentId: string;
  };
}

/**
 * Agent对话页
 * 接收agentId参数并渲染对话组件
 */
export default function AgentPage({ params }: AgentPageProps) {
  const { agentId } = params;

  // 使用useState只在客户端初始化
  const [threadId, setThreadId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 在客户端初始化 threadId
    let storedThreadId = localStorage.getItem(`thread_${agentId}`);
    if (!storedThreadId) {
      storedThreadId = crypto.randomUUID();
      localStorage.setItem(`thread_${agentId}`, storedThreadId);
    }
    setThreadId(storedThreadId);

    // 在客户端初始化 userId
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);

    setIsReady(true);
  }, [agentId]);

  // SSR时显示loading
  if (!isReady) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666'
      }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '1rem',
        borderBottom: '1px solid #e5e5e5',
        background: '#fff'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Agent: {agentId}</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#666' }}>
          Thread: {threadId}
        </p>
      </header>

      <AgentChat
        agentId={agentId}
        threadId={threadId}
        userId={userId}
      />
    </div>
  );
}
