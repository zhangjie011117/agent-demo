import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Observable, Observer } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AgUiSseService } from './ag-ui/ag-ui-sse.service';
import { ShortTermMemoryService } from './memory/short-term-memory.service';
import { LongTermMemoryService } from './memory/long-term-memory.service';
import { AgentPromptService } from './prompt/agent-prompt.service';
import { RunAgentInputDto } from './dto/run-agent-input.dto';
import { GetChatsQueryDto } from './dto/get-chats-query.dto';
import { Agent } from './types/agent.types';
import { ChatOpenAI } from '@langchain/openai';

/**
 * Agent服务
 * 核心业务逻辑，处理/agent/run请求
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: AgUiSseService,
    private readonly shortTermMemory: ShortTermMemoryService,
    private readonly longTermMemory: LongTermMemoryService,
    private readonly promptService: AgentPromptService,
  ) {}

  /**
   * 处理Agent运行请求
   * @param input - AG-UI RunAgentInput
   * @returns SSE事件流
   */
  runStream(input: RunAgentInputDto): Observable<{ type: string; data: unknown }> {
    return new Observable((observer) => {
      this.executeRun(input, observer).catch((error) => {
        this.logger.error('Agent execution failed:', error);
        observer.next({
          type: 'RUN_ERROR',
          data: { error: error.message || 'Unknown error' },
        });
        observer.complete();
      });
    });
  }

  /**
   * 获取线程下的聊天历史
   * @param query - GetChatsQueryDto
   * @returns 嵌套结构的聊天数据
   */
  async getChats(query: GetChatsQueryDto) {
    const { threadId, userId, beforeMessageId, limit = 20 } = query;

    // 1. 查找线程
    const thread = await this.prisma.agentThread.findFirst({
      where: { uuid: threadId, user_id: userId },
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

      // 使用 cursorChat 的时间作为上界
      whereCondition.created_at = { lt: cursorChat.created_at };
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
      // 找到最老的有消息的 chat
      for (const chat of chats) {
        if (chat.messages.length > 0) {
          nextCursor = chat.messages[0].id.toString();
          break;
        }
      }
      // 如果所有 chat 都没有消息，hasMore 应该是 false
      if (!nextCursor) {
        hasMore = false;
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

  /**
   * 执行Agent运行的主要逻辑
   */
  private async executeRun(
    input: RunAgentInputDto,
    observer: Observer<{ type: string; data: unknown }>,
  ): Promise<void> {
    const { threadId, runId, messages, context, forwardedProps } = input;

    // 从forwardedProps获取userId
    const userId = forwardedProps.userId || 'anonymous';
    const agentIdStr = forwardedProps.agentId;
    const customModel = forwardedProps.model;

    this.logger.log(`Starting agent run: ${runId}, agentId: ${agentIdStr}, userId: ${userId}`);

    try {
      // 1. 查询Agent (通过id字段)
      const agent = await this.prisma.agent.findFirst({
        where: { id: BigInt(agentIdStr), enabled: true },
      });

      if (!agent) {
        throw new NotFoundException(`Agent not found: ${agentIdStr}`);
      }

      // 2. 查询ChatModel
      const chatModel = await this.prisma.chatModel.findFirst({
        where: { id: agent.chat_model_id, enabled: true },
      });

      if (!chatModel) {
        throw new NotFoundException(`ChatModel not found for agent: ${agentIdStr}`);
      }

      // 3. 获取或创建AgentThread
      let thread = await this.prisma.agentThread.findFirst({
        where: { uuid: threadId, user_id: userId },
      });

      if (!thread) {
        const now = BigInt(Date.now());
        thread = await this.prisma.agentThread.create({
          data: {
            agent_id: agent.id,  // 使用BigInt类型的agent.id
            user_id: userId,
            uuid: threadId,
            created_at: now,
            updated_at: now,
          },
        });
        this.logger.log(`Created new thread: ${thread.id}`);
      }

      // 4. 判断续跑 (最后一条message role为tool)
      const isContinuation = messages.at(-1)?.role === 'tool';

      // 获取或创建Chat
      let currentChat;
      let userMessageContent: string;

      if (isContinuation) {
        // 续跑：获取最近chat，保存tool message
        currentChat = await this.prisma.agentChat.findFirst({
          where: { thread_id: thread.id },
          orderBy: { created_at: 'desc' },
        });

        if (currentChat) {
          // 保存tool message
          const lastMessage = messages.at(-1);
          const now = BigInt(Date.now());
          await this.prisma.agentMessage.create({
            data: {
              agent_id: agent.id,
              thread_id: thread.id,
              chat_id: currentChat.id,
              user_id: userId,
              role: 'tool',
              content: JSON.stringify({
                toolCallId: lastMessage.toolCallId,
                text: lastMessage.content,
              }),
              created_at: now,
            },
          });
          this.logger.log(`Saved tool message to chat: ${currentChat.id}`);
        }

        // 从消息中提取用户输入(最后一条user消息)
        const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1);
        userMessageContent = typeof lastUserMessage?.content === 'string'
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage?.content);
      } else {
        // 非续跑：新建chat，保存user message
        const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1);
        userMessageContent = typeof lastUserMessage?.content === 'string'
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage?.content);

        const now = BigInt(Date.now());
        currentChat = await this.prisma.agentChat.create({
          data: {
            agent_id: agent.id,
            thread_id: thread.id,
            user_id: userId,
            content: userMessageContent,
            created_at: now,
            updated_at: now,
          },
        });

        // 保存user message
        await this.prisma.agentMessage.create({
          data: {
            agent_id: agent.id,
            thread_id: thread.id,
            chat_id: currentChat.id,
            user_id: userId,
            role: 'user',
            content: JSON.stringify({ text: userMessageContent }),
            created_at: now,
          },
        });

        this.logger.log(`Created new chat: ${currentChat.id}`);
      }

      if (!currentChat) {
        throw new Error('No chat found or created');
      }

      // 5. 获取短期记忆
      const shortTermMem = await this.shortTermMemory.getHistory(thread.id, 10);

      // 6. 获取长期记忆
      const longTermMem = await this.longTermMemory.getMemory(agent.id, userId);

      // 7. 构建system prompt
      const systemPrompt = this.promptService.buildSystemPrompt(
        agent as Agent,
        context || [],
        longTermMem,
        shortTermMem || null,
      );

      // 8. 发送RUN_STARTED事件
      observer.next({ type: 'RUN_STARTED', data: { runId } });

      // 9. 调用LangChain
      const messageId = `msg_${Date.now()}`;
      observer.next({
        type: 'TEXT_MESSAGE_START',
        data: { messageId, role: 'assistant' },
      });

      // 构建LangChain消息
      const langchainMessages = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => {
          if (m.role === 'user') {
            return { role: 'user', content: String(m.content || '') };
          } else {
            return { role: 'assistant', content: String(m.content || '') };
          }
        });

      // 创建LLM实例
      const llmConfig: any = {
        model: customModel || chatModel.model || 'deepseek-chat',
        apiKey: chatModel.api_key,
        streaming: true,
        temperature: 0.7,
      };

      // 如果有自定义baseUrl，使用configuration
      if (chatModel.base_url) {
        llmConfig.configuration = {
          baseURL: chatModel.base_url,
        };
      }

      const llm = new ChatOpenAI(llmConfig);

      // 流式调用
      let fullResponse = '';

      try {
        // 使用stream进行真正的流式调用
        const stream = await llm.stream([
          { role: 'system', content: systemPrompt },
          ...langchainMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ]);

        // 逐块发送流式响应
        for await (const chunk of stream) {
          const content = chunk.content as string;
          if (content) {
            fullResponse += content;
            observer.next({
              type: 'TEXT_MESSAGE_CONTENT',
              data: { content },
            });
          }
        }
      } catch (llmError: any) {
        this.logger.error('LLM invocation failed:', llmError);
        // 如果LLM调用失败，发送错误
        observer.next({
          type: 'RUN_ERROR',
          data: { error: `LLM调用失败: ${llmError?.message || String(llmError)}` },
        });
        observer.complete();
        return;
      }

      // 发送TEXT_MESSAGE_END
      observer.next({ type: 'TEXT_MESSAGE_END', data: { messageId } });

      // 10. 保存assistant message
      const now = BigInt(Date.now());
      await this.prisma.agentMessage.create({
        data: {
          agent_id: agent.id,
          thread_id: thread.id,
          chat_id: currentChat.id,
          user_id: userId,
          role: 'assistant',
          content: JSON.stringify({ text: fullResponse }),
          created_at: now,
        },
      });

      // 11. 发送RUN_FINISHED
      observer.next({ type: 'RUN_FINISHED', data: { runId } });

      // 12. 触发长期记忆提取(异步)
      await this.longTermMemory.scheduleExtraction(
        currentChat.id,
        agent.id,
        userId,
      );

      observer.complete();
      this.logger.log(`Agent run completed: ${runId}`);
    } catch (error: any) {
      this.logger.error(`Agent run error: ${error?.message || String(error)}`, error?.stack);
      observer.next({
        type: 'RUN_ERROR',
        data: { error: error?.message || String(error) },
      });
      observer.complete();
    }
  }
}
