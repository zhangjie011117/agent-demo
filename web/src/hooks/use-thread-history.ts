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
