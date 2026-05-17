/**
 * 主页
 * 显示Agent列表或引导用户创建对话
 */
export default function HomePage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Agent Chat</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        AG-UI based AI Agent Chat Interface
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <h2>快速开始</h2>
        <p>访问以下路径测试对话:</p>
        <code style={{ background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px' }}>
          /agent/[agentId]
        </code>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>使用说明</h3>
        <ol style={{ marginBottom: 0 }}>
          <li>确保后端服务运行在 localhost:3000</li>
          <li>准备好 Agent ID</li>
          <li>访问 /agent/[agentId] 开始对话</li>
          <li>在Agent对话页面输入消息开始聊天</li>
        </ol>
      </div>
    </div>
  );
}
