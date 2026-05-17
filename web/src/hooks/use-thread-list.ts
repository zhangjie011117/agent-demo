'use client';

import { useState, useCallback } from 'react';

export interface ThreadItem {
  threadId: string;
  name: string;
  createdAt: string;
  agentId: string;
}

export interface UseThreadListResult {
  threads: ThreadItem[];
  loadThreads: () => Promise<void>;
  isLoading: boolean;
}

/**
 * useThreadList - 获取用户会话列表
 * @param userId - 用户 ID
 */
export function useThreadList(userId: string): UseThreadListResult {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3000';

  const loadThreads = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/agent/threads?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const result = await response.json();
      setThreads(result.data || []);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    threads,
    loadThreads,
    isLoading,
  };
}
