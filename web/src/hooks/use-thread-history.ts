'use client';

import { useState, useCallback, useRef } from 'react';

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
  error: Error | null;
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
  const [error, setError] = useState<Error | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3000';
  const resetFlagRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        threadId,
        userId,
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

      // Skip if reset was called during fetch
      if (resetFlagRef.current) {
        resetFlagRef.current = false;
        return;
      }

      if (result.data && Array.isArray(result.data)) {
        setChats((prev) => [...prev, ...result.data]);
      }
      if (result.pagination) {
        setHasMore(result.pagination.hasMore);
        setNextCursor(result.pagination.nextCursor);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(err instanceof Error ? err : new Error('Failed to load history'));
    } finally {
      setIsLoading(false);
    }
  }, [threadId, userId, limit, isLoading, hasMore, nextCursor]);

  const reset = useCallback(() => {
    resetFlagRef.current = true;
    setChats([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    chats,
    loadMore,
    hasMore,
    isLoading,
    reset,
    error,
  };
}
