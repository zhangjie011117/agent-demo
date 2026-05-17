# Agent Thread History API Design

## Overview

实现获取 Agent 聊天会话历史消息的功能，支持滚动到顶部时分页加载更早的消息。

## API Design

### Endpoint

```
GET /agent/chats
```

### Query Parameters

| 参数             | 类型   | 必填 | 说明                              |
|------------------|--------|------|-----------------------------------|
| `threadId`       | string | 是   | 线程 ID                           |
| `beforeMessageId`| string | 否   | cursor，返回该消息之前的消息       |
| `limit`          | number | 否   | 每页数量，默认 20                 |

### Response Structure

```json
{
  "data": [
    {
      "id": "chat-uuid-1",
      "createdAt": "2024-01-01T10:00:00Z",
      "rating": null,
      "feedback": null,
      "tokenUsage": { "prompt": 100, "completion": 200 },
      "messages": [
        {
          "id": "msg-uuid-1",
          "role": "user",
          "content": "Hello",
          "toolCallId": null,
          "createdAt": "2024-01-01T10:00:00Z"
        },
        {
          "id": "msg-uuid-2",
          "role": "assistant",
          "content": "Hi there!",
          "toolCallId": null,
          "createdAt": "2024-01-01T10:00:01Z"
        }
      ]
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "msg-uuid-1"
  }
}
```

### 排序规则

- `AgentChat` 按 `createdAt` 正序（从旧到新）
- `AgentMessage` 在每个 Chat 内按 `createdAt` 正序（从旧到新）

## Database Schema

参考 `/server/prisma/schema.prisma` 中的现有模型：

- `AgentThread` - 线程，关联 user 和 agent
- `AgentChat` - 单次对话轮次（用户输入 + AI 回复）
- `AgentMessage` - 消息，支持 user/assistant/system/tool 角色

## Implementation Plan

### Backend

1. **新增 DTO**: `GetChatsQueryDto`
   - `threadId: string` (必填)
   - `beforeMessageId?: string` (可选 cursor)
   - `limit?: number` (默认 20)

2. **新增 Controller 端点**: `GET /agent/chats`
   - 验证 threadId 存在
   - 验证 threadId 对应的线程属于当前用户

3. **Service 层逻辑**:
   - 根据 threadId 查询 AgentThread
   - 如果有 beforeMessageId，定位该消息并只返回更早的 Chats
   - 预加载 AgentMessages
   - 构造分页响应

### Frontend

1. **新增 Hook**: `useThreadHistory(threadId)`
   - `messages`: 消息列表
   - `loadMore`: 加载更多（滚动到顶部时调用）
   - `hasMore`: 是否还有更多
   - `isLoading`: 加载状态

2. **修改 Chat 组件**:
   - 维护消息列表状态
   - 滚动到顶部时调用 loadMore
   - 追加历史消息到列表顶部

## Edge Cases

1. **threadId 不存在**: 返回 404
2. **threadId 无对应聊天**: 返回空 data 数组，hasMore: false
3. **beforeMessageId 不存在**: 返回空 data，hasMore: false
4. **beforeMessageId 是第一条消息**: 返回空 data，hasMore: false
5. **limit 超过最大值**: 限制为 100

## Acceptance Criteria

1. 前端可以获取指定线程的所有历史消息
2. 滚动到顶部时能加载更早的消息
3. 消息按对话轮次（AgentChat）组织，每个轮次内的消息按时间正序
4. 分页正确，hasMore 和 nextCursor 准确
5. 权限检查：用户只能访问自己的线程
