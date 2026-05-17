import { Injectable } from '@nestjs/common';
import { Agent, ContextItem } from '../types/agent.types';

/**
 * Agent Prompt服务
 * 负责按正确顺序组装system prompt
 */
@Injectable()
export class AgentPromptService {
  /**
   * 构建完整的system prompt
   * 按以下顺序拼接:
   * 1. agent.systemPrompt
   * 2. agent.personaPrompt
   * 3. 长期记忆
   * 4. 短期记忆
   * 5. 回复长度约束
   *
   * @param agent - Agent实体
   * @param context - 上下文(业务画像等)
   * @param longTermMemory - 长期记忆
   * @param shortTermMemory - 短期记忆
   * @returns 完整的system prompt字符串
   */
  buildSystemPrompt(
    agent: Agent,
    context: ContextItem[],
    longTermMemory: string | null,
    shortTermMemory: string | null,
  ): string {
    const parts: string[] = [];

    // 1. 系统提示词
    if (agent.systemPrompt) {
      parts.push(`[系统提示]\n${agent.systemPrompt}`);
    }

    // 2. 角色设定
    if (agent.personaPrompt) {
      parts.push(`[角色设定]\n${agent.personaPrompt}`);
    }

    // 3. 业务画像(来自context)
    const profilePrompt = this.extractProfilePrompt(context);
    if (profilePrompt) {
      parts.push(`[业务画像]\n${profilePrompt}`);
    }

    // 4. 长期记忆
    if (longTermMemory) {
      parts.push(`[用户记忆]\n${longTermMemory}`);
    }

    // 5. 短期记忆(对话历史)
    if (shortTermMemory) {
      parts.push(`[对话历史]\n${shortTermMemory}`);
    }

    // 6. 回复约束
    parts.push(
      `[回复要求]\n请根据以上上下文信息，用简洁专业的语言回复。如果需要执行操作，请明确说明。`,
    );

    return parts.join('\n\n');
  }

  /**
   * 从context中提取业务画像提示词
   * 优先查找description为"业务画像提示词"的项
   * @param context - 上下文数组
   * @returns 业务画像提示词，如果不存在返回null
   */
  private extractProfilePrompt(context: ContextItem[]): string | null {
    if (!context || context.length === 0) {
      return null;
    }

    // 优先查找description为"业务画像提示词"的项
    const profileItem = context.find(
      (c) => c.description === '业务画像提示词',
    );
    if (profileItem?.value) {
      return profileItem.value;
    }

    // 否则使用第一个有效的value
    const firstItem = context.find((c) => c.value);
    return firstItem?.value ?? null;
  }
}
