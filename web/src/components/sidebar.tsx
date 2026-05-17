'use client';

import { List, Button, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ThreadItem } from '@/hooks/use-thread-list';

interface SidebarProps {
  threads: ThreadItem[];
  currentThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  isLoading: boolean;
}

export function Sidebar({ threads, currentThreadId, onSelectThread, onNewThread, isLoading }: SidebarProps) {
  return (
    <div style={{
      width: 280,
      borderRight: '1px solid #f0f0f0',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* 新建会话按钮 */}
      <div style={{ padding: '12px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onNewThread}
          block
        >
          新建会话
        </Button>
      </div>

      {/* 会话列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : threads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无会话
          </div>
        ) : (
          <List
            dataSource={threads}
            renderItem={(thread) => (
              <List.Item
                key={thread.threadId}
                onClick={() => onSelectThread(thread.threadId)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: thread.threadId === currentThreadId ? '#e6f7ff' : 'transparent',
                  borderLeft: thread.threadId === currentThreadId ? '3px solid #1890ff' : '3px solid transparent',
                }}
              >
                <List.Item.Meta
                  title={thread.name}
                  description={new Date(thread.createdAt).toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}