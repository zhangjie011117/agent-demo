import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AgentService } from '../service/service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RunAgentInputDto } from '../../dto/run-agent-input.dto';
import { GetChatsQueryDto } from '../../dto/get-chats-query.dto';
import { GetThreadsQueryDto } from '../../dto/get-threads-query.dto';
import { CreateThreadDto } from '../../dto/create-thread.dto';

/**
 * Agent控制器
 * 处理AG-UI协议的SSE流式接口
 */
@Controller()
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /listAgents
   * 获取所有启用的Agent列表
   */
  @Get('listAgents')
  async listAgents() {
    const agents = await this.prisma.agent.findMany({
      where: { enabled: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { id: 'asc' },
    });

    return agents.map((agent) => ({
      id: String(agent.id),
      name: agent.name,
    }));
  }

  /**
   * POST /runAgent/:agentId
   * AG-UI协议的Agent运行接口
   * 返回SSE流式响应
   */
  @Post('runAgent/:agentId')
  @HttpCode(HttpStatus.OK)
  async runAgent(
    @Param('agentId') agentId: string,
    @Body() input: RunAgentInputDto,
    @Res() res: Response,
  ): Promise<void> {
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用nginx缓冲

    // 订阅SSE事件流
    const subscription = this.agentService.runStream({ ...input, agentId }).subscribe({
      next: (event) => {
        // 发送SSE格式数据: "data: {...}\n\n"
        // 包含type字段让前端识别事件类型
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
      error: (error) => {
        res.write(`data: ${JSON.stringify({ type: 'RUN_ERROR', message: error.message })}\n\n`);
        res.end();
      },
      complete: () => {
        res.end();
      },
    });

    // 处理客户端断开连接
    res.on('close', () => {
      subscription.unsubscribe();
    });
  }

  /**
   * GET /getMessages/:threadId
   * 获取线程下的聊天历史（按 AgentChat 嵌套组织）
   */
  @Get('getMessages/:threadId')
  async getChats(@Param('threadId') threadId: string) {
    return this.agentService.getChats({ threadId });
  }

  /**
   * GET /getThreads/:userId
   * 获取用户的所有线程列表
   */
  @Get('getThreads/:userId')
  async getThreads(@Param('userId') userId: string) {
    return this.agentService.getThreads({ userId });
  }

  /**
   * POST /createThread/:userId
   * 创建一个空会话
   */
  @Post('createThread/:userId')
  async createThread(
    @Param('userId') userId: string,
    @Body() body: { agentId: string },
  ) {
    return this.agentService.createThread({ agentId: body.agentId, userId });
  }

  /**
   * DELETE /deleteThread/:threadId
   * 删除用户的指定会话及其消息
   */
  @Delete('deleteThread/:threadId')
  async deleteThread(@Param('threadId') threadId: string) {
    return this.agentService.deleteThread({ threadId });
  }
}
