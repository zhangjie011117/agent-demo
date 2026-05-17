import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 长期记忆服务
 * 负责获取和提取用户偏好等持久化记忆
 */
@Injectable()
export class LongTermMemoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户的长期记忆
   * @param agentId - Agent ID (BigInt)
   * @param userId - 用户ID
   * @returns 记忆内容，如果不存在返回null
   */
  async getMemory(agentId: bigint, userId: string): Promise<string | null> {
    const memory = await this.prisma.agentMemory.findUnique({
      where: {
        agent_id_user_id: {
          agent_id: agentId,
          user_id: userId,
        },
      },
    });
    return memory?.content ?? null;
  }

  /**
   * 保存或更新长期记忆
   * @param agentId - Agent ID (BigInt)
   * @param userId - 用户ID
   * @param content - 记忆内容
   */
  async saveMemory(agentId: bigint, userId: string, content: string): Promise<void> {
    const now = BigInt(Date.now());
    await this.prisma.agentMemory.upsert({
      where: {
        agent_id_user_id: {
          agent_id: agentId,
          user_id: userId,
        },
      },
      update: {
        content,
        updated_at: now,
      },
      create: {
        agent_id: agentId,
        user_id: userId,
        content,
        created_at: now,
        updated_at: now,
      },
    });
  }

  /**
   * 触发长期记忆提取(异步)
   * 按配置周期异步总结用户偏好
   * @param chatId - 当前Chat ID (BigInt)
   * @param agentId - Agent ID (BigInt)
   * @param userId - 用户ID
   */
  async scheduleExtraction(
    chatId: bigint,
    agentId: bigint,
    userId: string,
  ): Promise<void> {
    // 获取Agent配置
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent?.long_term_memory_config) {
      return;
    }

    const config = typeof agent.long_term_memory_config === 'string'
      ? JSON.parse(agent.long_term_memory_config)
      : agent.long_term_memory_config;

    // 检查是否启用且自动提取
    if (!config?.enabled || !config?.autoExtract) {
      return;
    }

    // 检查是否达到提取周期
    const messageCount = await this.prisma.agentMessage.count({
      where: { chat_id: chatId },
    });

    // 每N条消息提取一次
    if (messageCount % config.extractIntervalTurns !== 0) {
      return;
    }

    // 异步执行记忆提取(不阻塞SSE响应)
    setImmediate(() => this.extractMemory(agentId, userId, chatId));
  }

  /**
   * 执行记忆提取
   * 获取最近消息并调用LLM总结
   */
  private async extractMemory(
    agentId: bigint,
    userId: string,
    chatId: bigint,
  ): Promise<void> {
    try {
      // 获取最近最多40条消息
      const messages = await this.prisma.agentMessage.findMany({
        where: { chat_id: chatId },
        orderBy: { created_at: 'desc' },
        take: 40,
      });

      if (messages.length < 5) {
        return; // 消息太少不提取
      }

      // 格式化消息
      const formattedMessages = messages.reverse().map((msg) => {
        const role = msg.role === 'user' ? '用户' : '助手';
        let content: string;
        try {
          const parsed = JSON.parse(msg.content);
          content = parsed.text || msg.content;
        } catch {
          content = msg.content;
        }
        return `${role}: ${content}`;
      });

      // 构建提取prompt
      const extractionPrompt = `请分析以下对话历史，提取用户的偏好、习惯和目标。
用简洁的语言总结，最多200字。

对话历史:
${formattedMessages.join('\n')}

请直接输出总结，不要有多余的解释。`;

      // TODO: 调用LLM进行总结
      // 目前仅做占位，后续集成LangChain后实现
      console.log('Memory extraction triggered for user:', userId);
      console.log('Extraction prompt:', extractionPrompt);

      // 模拟提取结果
      const extractedMemory = `用户偏好: 喜欢简洁直接的回复。
对话习惯: 通常在晚上活跃。
目标: 寻求AI助手帮助完成日常任务。`;

      await this.saveMemory(agentId, userId, extractedMemory);
    } catch (error) {
      console.error('Memory extraction failed:', error);
    }
  }
}
