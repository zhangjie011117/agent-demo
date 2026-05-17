'use client';

/**
 * 主页
 * 显示Agent列表、配置用户ID和模型，然后进入对话
 */
import { useState, useEffect } from 'react';
import { AgentChat } from '@/components/agent-chat';

interface AgentOption {
  id: string;
  name: string;
}

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export default function HomePage() {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [threadId, setThreadId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [isConfigValid, setIsConfigValid] = useState(false);

  useEffect(() => {
    // 获取Agent列表
    const apiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3000';

    Promise.all([
      fetch(`${apiUrl}/agents`).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch agents');
        return res.json();
      }),
      fetch(`${apiUrl}/models`).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch models');
        return res.json();
      }),
    ])
      .then(([agentsData, modelsData]) => {
        setAgents(Array.isArray(agentsData) ? agentsData : []);
        setModels(Array.isArray(modelsData) ? modelsData : []);
        if (Array.isArray(modelsData) && modelsData.length > 0) {
          setSelectedModel(modelsData[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch config:', err);
      });

    // 从localStorage获取已保存的userId
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = '';
    }
    setUserId(storedUserId);

    setIsReady(true);
  }, []);

  // 当选择Agent时，初始化该Agent的threadId
  useEffect(() => {
    if (selectedAgent) {
      let storedThreadId = localStorage.getItem(`thread_${selectedAgent}`);
      if (!storedThreadId) {
        storedThreadId = crypto.randomUUID();
        localStorage.setItem(`thread_${selectedAgent}`, storedThreadId);
      }
      setThreadId(storedThreadId);
    }
  }, [selectedAgent]);

  // 验证配置是否有效
  useEffect(() => {
    const valid = selectedAgent.trim().length > 0 && userId.trim().length > 0 && selectedModel.length > 0;
    setIsConfigValid(valid);
  }, [selectedAgent, userId, selectedModel]);

  // 保存userId到localStorage
  const handleUserIdChange = (value: string) => {
    setUserId(value);
    localStorage.setItem('userId', value);
  };

  // 清除对话并重置
  const handleReset = () => {
    if (!selectedAgent) return;
    const newThreadId = crypto.randomUUID();
    localStorage.setItem(`thread_${selectedAgent}`, newThreadId);
    setThreadId(newThreadId);
  };

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
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Agent Chat</h1>
        {selectedAgent && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#666' }}>
            Thread: {threadId}
          </p>
        )}
      </header>

      {/* 配置面板 */}
      <div style={{
        padding: '1rem',
        background: '#f5f5f5',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center'
      }}>
        {/* Agent选择 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Agent:</label>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            disabled={agents.length === 0}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              width: '180px',
              background: '#fff',
            }}
          >
            <option value="">选择 Agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {/* 用户ID输入 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>用户ID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => handleUserIdChange(e.target.value)}
            placeholder="输入用户ID"
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              width: '180px',
            }}
          />
        </div>

        {/* 模型选择 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>模型:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={models.length === 0}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              width: '200px',
              background: '#fff',
            }}
          >
            {models.length === 0 && (
              <option value="">加载中...</option>
            )}
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <button
            onClick={handleReset}
            disabled={!selectedAgent}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: '#fff',
              color: selectedAgent ? '#666' : '#ccc',
              fontSize: '0.875rem',
              cursor: selectedAgent ? 'pointer' : 'not-allowed',
            }}
          >
            清除对话
          </button>
        </div>
      </div>

      {/* 配置提示 */}
      {!isConfigValid && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#fef3cd',
          color: '#856404',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          请选择 Agent、输入用户ID后开始对话
        </div>
      )}

      {/* 聊天区域 */}
      {isConfigValid ? (
        <AgentChat
          agentId={selectedAgent}
          threadId={threadId}
          userId={userId}
          model={selectedModel}
        />
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9f9f9',
          color: '#999'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '0.5rem' }}>请在上方选择 Agent、输入用户ID后开始对话</p>
          </div>
        </div>
      )}
    </div>
  );
}
