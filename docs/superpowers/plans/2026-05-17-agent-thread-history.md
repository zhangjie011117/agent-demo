# Agent Thread History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现获取 Agent 聊天会话历史消息的功能，支持滚动到顶部时分页加载更早的消息。

**Architecture:** 后端新增 `GET /agent/chats` API，通过 `threadId` 查询 `AgentThread`，预加载嵌套的 `AgentChat` 和 `AgentMessage`，支持基于 `beforeMessageId` 的 cursor 分页。前端新增 `useThreadHistory` hook 管理历史消息加载。

**Tech Stack:** NestJS + Prisma (Backend), Next.js + React (Frontend)

---

## File Structure

### Backend
- Create: `server/src/agent/dto/get-chats-query.dto.ts` — Query 参数 DTO
- Modify: `server/src/agent/agent.controller.ts` — 新增 GET /agent/chats 端点
- Modify: `server/src/agent/agent.service.ts` — 新增 getChats 方法

### Frontend
- Create: `web/src/hooks/use-thread-history.ts` — 历史消息加载 Hook
- Modify: `web/src/components/agent-chat.tsx` — 集成历史消息加载

---

## Task 1: Backend - 创建 GetChatsQueryDto

**Files:**
- Create: `server/src/agent/dto/get-chats-query.dto.ts`

- [ ] **Step 1: 创建 DTO 文件**

```typescript
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 获取聊天历史 Query DTO
 */
export class GetChatsQueryDto {
  @IsString()
  threadId: string;

  @IsOptional()
  @IsString()
  beforeMessageId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/agent/dto/get-chats-query.dto.ts
git commit -m "feat(agent): add GetChatsQueryDto for history API"
```

---

## Task 2: Backend - AgentController 新增端点

**Files:**
- Modify: `server/src/agent/agent.controller.ts:1-10` (imports)
- Modify: `server/src/agent/agent.controller.ts:18-67` (add new endpoint)

- [ ] **Step 1: 添加 Get 导入**

在 imports 中添加：
```typescript
import { Get, Query } from '@nestjs/common';
```

- [ ] **Step 2: 添加新端点**

在 `AgentController` 类中，`runAgent` 方法之后添加：

```typescript
/**
 * GET /agent/chats
 * 获取线程下的聊天历史（按 AgentChat 嵌套组织）
 */
@Get('chats')
async getChats(@Query() query: GetChatsQueryDto) {
  this.logger.log(`Getting chats for thread: ${query.threadId}`);
  return this.agentService.getChats(query);
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/agent/agent.controller.ts
git commit -m "feat(agent): add GET /agent/chats endpoint"
```

---

## Task 3: Backend - AgentService 实现 getChats 方法

**Files:**
- Modify: `server/src/agent/agent.service.ts:1-11` (imports)
- Modify: `server/src/agent/agent.service.ts:17-26` (add method)

- [ ] **Step 1: 添加 DTO 导入**

在 imports 中添加：
```typescript
import { GetChatsQueryDto } from './dto/get-chats-query.dto';
```

- [ ] **Step 2: 添加 getChats 方法**

在 `AgentService` 类中，`runStream` 方法之后添加：

```typescript
/**
 * 获取线程下的聊天历史
 * @param query - GetChatsQueryDto
 * @returns 嵌套结构的聊天数据
 */
async getChats(query: GetChatsQueryDto) {
  const { threadId, beforeMessageId, limit = 20 } = query;

  // 1. 查找线程
  const thread = await this.prisma.agentThread.findFirst({
    where: { uuid: threadId },
  });

  if (!thread) {
    throw new NotFoundException(`Thread not found: ${threadId}`);
  }

  // 2. 构建查询条件
  const whereCondition: any = {
    thread_id: thread.id,
  };

  // 如果有 cursor，只返回该消息之前的 Chats
  if (beforeMessageId) {
    const cursorMessage = await this.prisma.agentMessage.findFirst({
      where: { id: BigInt(beforeMessageId) },
      include: { chat: true },
    });

    if (!cursorMessage) {
      return { data: [], pagination: { hasMore: false, nextCursor: null } };
    }

    // 找到该消息所在 Chat 的 createdAt，使用它作为时间点
    const cursorChat = await this.prisma.agentChat.findFirst({
      where: {
        thread_id: thread.id,
        created_at: { lt: cursorMessage.chat.created_at },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!cursorChat) {
      return { data: [], pagination: { hasMore: false, nextCursor: null } };
    }

    // 找到 cursor 时间点之后的第一条 Chat 的最早消息作为 nextCursor 基准
    const nextCursorChat = await this.prisma.agentChat.findFirst({
      where: {
        thread_id: thread.id,
        created_at: { gt: cursorChat.created_at },
      },
      orderBy: { created_at: 'asc' },
    });

    if (nextCursorChat) {
      const firstMessage = await this.prisma.agentMessage.findFirst({
        where: { chat_id: nextCursorChat.id },
        orderBy: { created_at: 'asc' },
      });
      if (firstMessage) {
        whereCondition.created_at = { gt: cursorChat.created_at };
      }
    } else {
      whereCondition.created_at = { gt: cursorChat.created_at };
    }
  }

  // 3. 查询 Chats（多取一条用于判断 hasMore）
  const chats = await this.prisma.agentChat.findMany({
    where: whereCondition,
    orderBy: { created_at: 'asc' },
    take: limit + 1,
    include: {
      messages: {
        orderBy: { created_at: 'asc' },
      },
    },
  });

  // 4. 判断是否有更多
  const hasMore = chats.length > limit;
  if (hasMore) {
    chats.pop(); // 移除多取的那条
  }

  // 5. 构造响应
  const data = chats.map((chat) => ({
    id: chat.id.toString(),
    createdAt: new Date(Number(chat.created_at)).toISOString(),
    rating: chat.rating,
    feedback: chat.feedback,
    tokenUsage: chat.token_usage,
    messages: chat.messages.map((msg) => ({
      id: msg.id.toString(),
      role: msg.role,
      content: JSON.parse(msg.content),
      toolCallId: null,
      createdAt: new Date(Number(msg.created_at)).toISOString(),
    })),
  }));

  // 6. 计算 nextCursor（最老一条 Chat 的第一条消息 ID）
  let nextCursor: string | null = null;
  if (hasMore && chats.length > 0) {
    const oldestChat = chats[0];
    if (oldestChat.messages.length > 0) {
      nextCursor = oldestChat.messages[0].id.toString();
    }
  }

  return {
    data,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/agent/agent.service.ts
git commit -m "feat(agent): implement getChats method with cursor pagination"
```

---

## Task 4: Frontend - 创建 useThreadHistory Hook

**Files:**
- Create: `web/src/hooks/use-thread-history.ts`

- [ ] **Step 1: 创建 Hook 文件**

```typescript
'use client';

import { useState, useCallback } from 'react';

export interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: unknown;
  toolCallId?: string | null;
  createdAt: string;
}

export interface ThreadChat {
  id: string;
  createdAt: string;
  rating: number | null;
  feedback: string | null;
  tokenUsage: unknown;
  messages: ThreadMessage[];
}

export interface UseThreadHistoryResult {
  chats: ThreadChat[];
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  reset: () => void;
}

/**
 * useThreadHistory - 获取线程历史消息
 * @param threadId - 线程 ID
 * @param userId - 用户 ID
 * @param limit - 每页数量，默认 20
 */
export function useThreadHistory(
  threadId: string,
  userId: string,
  limit: number = 20,
): UseThreadHistoryResult {
  const [chats, setChats] = useState<ThreadChat[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3000';

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        threadId,
        limit: limit.toString(),
      });

      if (nextCursor) {
        params.set('beforeMessageId', nextCursor);
      }

      const response = await fetch(`${API_URL}/agent/chats?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const result = await response.json();

      setChats((prev) => [...prev, ...result.data]);
      setHasMore(result.pagination.hasMore);
      setNextCursor(result.pagination.nextCursor);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [threadId, userId, limit, isLoading, hasMore, nextCursor]);

  const reset = useCallback(() => {
    setChats([]);
    setNextCursor(null);
    setHasMore(true);
  }, []);

  return {
    chats,
    loadMore,
    hasMore,
    isLoading,
    reset,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/hooks/use-thread-history.ts
git commit -m "feat(web): add useThreadHistory hook for loading chat history"
```

---

## Task 5: Frontend - Chat 组件集成历史消息加载

**Files:**
- Modify: `web/src/components/agent-chat.tsx:1-8` (imports)
- Modify: `web/src/components/agent-chat.tsx:23-32` (state)
- Modify: `web/src/components/agent-chat.tsx:183-227` (message list)

- [ ] **Step 1: 添加 useThreadHistory 导入**

```typescript
import { useAgentRun, useAgentChat } from '@/hooks/use-agent-run';
import { useThreadHistory } from '@/hooks/use-thread-history';
```

- [ ] **Step 2: 在组件内添加 history hook**

```typescript
const {
  chats: historyChats,
  loadMore,
  hasMore,
  isLoading: isLoadingHistory,
} = useThreadHistory(threadId, userId);
```

- [ ] **Step 3: 将 historyChats 扁平化为消息列表**

在 `AgentChat` 组件中，将 history 消息与当前消息合并：

```typescript
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
```

- [ ] **Step 4: 添加滚动加载逻辑**

在消息列表容器上添加 `onScroll` 处理：

```typescript
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
```

```typescript
// 在消息列表容器上
<div style={{ flex: 1, overflow: 'auto', padding: '1rem' }} onScroll={handleScroll}>
```

- [ ] **Step 5: 显示加载状态**

在消息列表顶部添加加载指示器：

```typescript
{isLoadingHistory && (
  <div style={{ textAlign: 'center', padding: '0.5rem', color: '#999' }}>
    加载更多...
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add web/src/components/agent-chat.tsx
git commit -m "feat(web): integrate history loading in AgentChat"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|------------------|------|
| GET /agent/chats endpoint | Task 2 |
| Query params: threadId, beforeMessageId, limit | Task 1 |
| 嵌套结构响应 (AgentChat -> AgentMessage) | Task 3 |
| cursor 分页逻辑 | Task 3 |
| hasMore / nextCursor | Task 3 |
| useThreadHistory hook | Task 4 |
| 滚动加载更多 | Task 5 |

---

## Type Consistency Check

| Item | Type |
|------|------|
| `GetChatsQueryDto.threadId` | `string` |
| `GetChatsQueryDto.beforeMessageId` | `string \| undefined` |
| `GetChatsQueryDto.limit` | `number \| undefined` (default 20) |
| `AgentService.getChats()` param | `GetChatsQueryDto` |
| `useThreadHistory` param | `threadId: string, userId: string, limit?: number` |
| `ThreadChat.messages[].role` | `'user' \| 'assistant' \| 'system' \| 'tool'` |

All types are consistent across tasks.

---

**Plan complete.**