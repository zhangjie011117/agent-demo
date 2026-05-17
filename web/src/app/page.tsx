'use client';

/**
 * 主页 - 使用 Ant Design Vue
 */
import { useState, useEffect } from 'react';
import { Layout, Select, Input, Button, message, ConfigProvider } from 'antd';
import { AgentChat } from '@/components/agent-chat';
import { Sidebar } from '@/components/sidebar';
import { useThreadList, ThreadItem } from '@/hooks/use-thread-list';
import zhCN from 'antd/locale/zh_CN';

const { Header, Sider, Content } = Layout;

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
  const [messageApi, contextHolder] = message.useMessage();

  const { threads, loadThreads, isLoading: isLoadingThreads } = useThreadList(userId);

  useEffect(() => {
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

    let storedUserId = localStorage.getItem('userId') || '';
    setUserId(storedUserId);
    setIsReady(true);
  }, []);

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

  useEffect(() => {
    const valid = selectedAgent.trim().length > 0 && userId.trim().length > 0 && selectedModel.length > 0;
    setIsConfigValid(valid);
  }, [selectedAgent, userId, selectedModel]);

  useEffect(() => {
    if (userId) {
      loadThreads();
    }
  }, [userId, loadThreads]);

  const handleReset = () => {
    if (!selectedAgent) return;
    const newThreadId = crypto.randomUUID();
    localStorage.setItem(`thread_${selectedAgent}`, newThreadId);
    setThreadId(newThreadId);
    messageApi.success('对话已清除');
  };

  const handleNewThread = () => {
    if (!selectedAgent) {
      messageApi.warning('请先选择 Agent');
      return;
    }
    const newThreadId = crypto.randomUUID();
    localStorage.setItem(`thread_${selectedAgent}`, newThreadId);
    setThreadId(newThreadId);
    loadThreads();
    messageApi.success('新会话已创建');
  };

  if (!isReady) {
    return (
      <ConfigProvider locale={zhCN}>
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          加载中...
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      {contextHolder}
      <Layout style={{ minHeight: '100vh' }}>
        {isConfigValid && (
          <Sider width={280} style={{ background: '#fafafa', borderRight: '1px solid #f0f0f0' }}>
            <Sidebar
              threads={threads}
              currentThreadId={threadId}
              onSelectThread={(newThreadId) => setThreadId(newThreadId)}
              onNewThread={handleNewThread}
              isLoading={isLoadingThreads}
            />
          </Sider>
        )}
        <Layout>
          <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>Agent Chat</div>
            {threadId && (
              <div style={{ fontSize: 12, color: '#999' }}>
                Thread: {threadId.substring(0, 8)}...
              </div>
            )}
          </Header>

          <Content style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 24px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Agent:</span>
                <Select
                  value={selectedAgent}
                  onChange={setSelectedAgent}
                  placeholder="选择 Agent"
                  style={{ width: 180 }}
                  options={agents.map(a => ({ value: a.id, label: a.name }))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>用户ID:</span>
                <Input
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    localStorage.setItem('userId', e.target.value);
                  }}
                  placeholder="输入用户ID"
                  style={{ width: 180 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>模型:</span>
                <Select
                  value={selectedModel}
                  onChange={setSelectedModel}
                  style={{ width: 200 }}
                  options={models.map(m => ({ value: m.id, label: `${m.name} (${m.provider})` }))}
                />
              </div>

              <Button onClick={handleReset} disabled={!selectedAgent}>
                清除对话
              </Button>
            </div>

            {isConfigValid ? (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <AgentChat
                  agentId={selectedAgent}
                  threadId={threadId}
                  userId={userId}
                  model={selectedModel}
                />
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                请选择 Agent、输入用户ID后开始对话
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
