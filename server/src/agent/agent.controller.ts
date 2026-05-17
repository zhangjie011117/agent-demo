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
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AgentService } from './agent.service';
import { RunAgentInputDto } from './dto/run-agent-input.dto';
import { GetChatsQueryDto } from './dto/get-chats-query.dto';
import { GetThreadsQueryDto } from './dto/get-threads-query.dto';
import { CreateThreadDto } from './dto/create-thread.dto';

/**
 * Agent控制器
 * 处理AG-UI协议的SSE流式接口
 */
@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  /**
   * POST /agent/run
   * AG-UI协议的Agent运行接口
   * 返回SSE流式响应
   */
  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runAgent(
    @Body() input: RunAgentInputDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Received agent run request: ${input.runId}`);

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用nginx缓冲

    // 订阅SSE事件流
    const subscription = this.agentService.runStream(input).subscribe({
      next: (event) => {
        // 发送SSE格式数据: "data: {...}\n\n"
        // 包含type字段让前端识别事件类型
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
      error: (error) => {
        this.logger.error(`SSE error: ${error.message}`, error.stack);
        res.write(`data: ${JSON.stringify({ type: 'RUN_ERROR', message: error.message })}\n\n`);
        res.end();
      },
      complete: () => {
        this.logger.log(`SSE stream completed for run: ${input.runId}`);
        res.end();
      },
    });

    // 处理客户端断开连接
    res.on('close', () => {
      this.logger.log(`Client disconnected for run: ${input.runId}`);
      subscription.unsubscribe();
    });
  }

  /**
   * GET /agent/chats
   * 获取线程下的聊天历史（按 AgentChat 嵌套组织）
   */
  @Get('chats')
  async getChats(@Query() query: GetChatsQueryDto) {
    this.logger.log(`Getting chats for thread: ${query.threadId}`);
    return this.agentService.getChats(query);
  }

  /**
   * GET /agent/threads
   * 获取用户的所有线程列表
   */
  @Get('threads')
  async getThreads(@Query() query: GetThreadsQueryDto) {
    this.logger.log(`Getting threads for user: ${query.userId}`);
    return this.agentService.getThreads(query);
  }

  /**
   * POST /agent/threads
   * 创建一个空会话
   */
  @Post('threads')
  async createThread(@Body() body: CreateThreadDto) {
    this.logger.log(`Creating thread for user: ${body.userId}, agent: ${body.agentId}`);
    return this.agentService.createThread(body);
  }

  /**
   * DELETE /agent/threads/:threadId
   * 删除用户的指定会话及其消息
   */
  @Delete('threads/:threadId')
  async deleteThread(
    @Param('threadId') threadId: string,
    @Query() query: GetThreadsQueryDto,
  ) {
    this.logger.log(`Deleting thread: ${threadId} for user: ${query.userId}`);
    return this.agentService.deleteThread({ threadId, userId: query.userId });
  }
}
