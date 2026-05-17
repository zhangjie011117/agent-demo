import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 短期记忆服务
 * 负责从数据库获取最近N轮对话历史
 */
@Injectable()
export class ShortTermMemoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取最近N轮对话历史
   * @param threadId - 线程ID (BigInt)
   * @param limit - 最大轮数，默认为10
   * @returns 格式化后的对话历史字符串
   */
  async getHistory(threadId: bigint, limit: number = 10): Promise<string> {
    // 查询最近N轮chat，每轮包含其messages
    const chats = await this.prisma.agentChat.findMany({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // 反转顺序，使最早的在前
    const reversedChats = chats.reverse();

    // 格式化: 用户/助手/工具 交替
    return reversedChats
      .map((chat) => {
        return chat.messages
          .map((msg) => {
            const role =
              msg.role === 'user'
                ? '用户'
                : msg.role === 'assistant'
                  ? '助手'
                  : '工具结果';
            let content: string;
            try {
              const parsed = JSON.parse(msg.content);
              content = parsed.text || msg.content;
            } catch {
              content = msg.content;
            }
            return `${role}: ${content}`;
          })
          .join('\n');
      })
      .join('\n\n');
  }
}
