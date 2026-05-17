# Sidebar 会话列表设计

## Overview

为 Agent Chat 添加固定侧边栏，支持用户选择历史会话和创建新会话，参考 GPT 界面风格。

## Layout

```
+------------------+----------------------------------------+
|    Sidebar       |              Main Content              |
|    (280px)       |              (flex: 1)                |
+------------------+----------------------------------------+
| [+ 新建会话]     |  Header: Agent Chat                   |
|                  |----------------------------------------|
| 会话 1           |  Config Panel: Agent/Model/User       |
| 时间: 10:30      |----------------------------------------|
|                  |                                        |
| 会话 2           |           Chat Area                    |
| 时间: 09:15      |                                        |
|                  |                                        |
| 会话 3           |                                        |
| 时间: 昨天       |                                        |
|                  |                                        |
+------------------+----------------------------------------+
```

## API Design

### GET /agent/threads

获取用户的所有会话列表。

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 是 | 用户 ID |

**Response Structure:**
```json
{
  "data": [
    {
      "threadId": "uuid-xxx",
      "name": "会话名称（首条消息摘要，最多30字符）",
      "createdAt": "2024-01-01T10:00:00Z",
      "agentId": "agent-uuid"
    }
  ]
}
```

## Database Query

查询 `AgentThread` 表，按 `created_at` 倒序排列。

对于会话名称，需要关联查询第一条用户消息（通过 `AgentChat` 和 `AgentMessage`）。

## Frontend Components

### Sidebar Component

**位置:** `web/src/components/sidebar.tsx`

**Props:**
```typescript
interface SidebarProps {
  userId: string;
  currentThreadId: string;
  onSelectThread: (threadId: string, agentId?: string) => void;
  onNewThread: () => void;
}
```

**功能:**
1. 加载时获取用户会话列表
2. 显示会话名称（首条消息摘要）和创建时间
3. 当前选中的会话高亮显示
4. 点击会话切换到该 thread
5. 顶部"新建会话"按钮

### Page Layout

修改 `page.tsx`：
- 添加 Sidebar 组件
- 调整布局为水平排列（flex-direction: row）
- Sidebar 和 Chat Area 并排显示

## Session Naming

- 使用该 thread 第一条用户消息的前 30 个字符
- 如果没有消息，显示"新会话"
- 如果消息超过 30 字符，截断并加"..."

## Implementation Plan

### Backend

1. **新增 DTO**: `GetThreadsQueryDto`
   - `userId: string` (必填)

2. **新增 Response DTO**: `ThreadListItemDto`
   - `threadId: string`
   - `name: string`
   - `createdAt: string`
   - `agentId: string`

3. **Controller 端点**: `GET /agent/threads`
   - 验证 userId
   - 查询用户的 AgentThread 列表
   - 关联查询每条 thread 的第一条用户消息作为名称

4. **Service 方法**: `getThreads(userId)`
   - 查询 AgentThread 列表
   - 关联查询 AgentChat -> AgentMessage
   - 提取第一条用户消息的前 30 字符作为名称

### Frontend

1. **新增 Hook**: `useThreadList(userId)`
   - 管理会话列表状态
   - `threads`: 会话列表
   - `loadThreads`: 加载会话列表
   - `isLoading`: 加载状态

2. **新增组件**: `Sidebar`
   - 显示会话列表
   - 处理会话切换
   - 处理新建会话

3. **修改 Page**: `page.tsx`
   - 添加 Sidebar 布局
   - 管理当前选中的 threadId state
   - 传递正确的 threadId 给 AgentChat

## Edge Cases

1. **userId 不存在**: 返回空数组
2. **用户没有任何会话**: 显示"暂无会话"
3. **第一条消息为空**: 显示"新会话"
4. **切换会话**: 重置 Chat 组件的本地消息状态，加载新会话的历史消息

## Acceptance Criteria

1. 侧边栏固定在左侧，宽度 280px
2. 可以看到所有历史会话列表
3. 点击会话可以切换，当前会话高亮
4. 点击"新建会话"创建新会话并切换
5. 会话名称显示首条消息摘要
6. 切换会话后，Chat 区域加载该会话的历史消息
