import { Injectable } from '@nestjs/common';
import { Observable, Observer } from 'rxjs';
import {
  AgUiEventType,
  SseEvent,
  RunStartedData,
  TextMessageStartData,
  TextMessageContentData,
  TextMessageEndData,
  ToolCallStartData,
  ToolCallArgsData,
  ToolCallEndData,
  RunFinishedData,
  RunErrorData,
} from './ag-ui-events';

/**
 * AG-UI SSE服务
 * 负责发送符合AG-UI协议规范的SSE事件
 */
@Injectable()
export class AgUiSseService {
  /**
   * 创建SSE事件Observable
   * 用于流式传输事件到前端
   */
  createStream(): Observable<SseEvent<unknown>> {
    return new Observable((observer) => {
      // 保存observer以便后续发送事件
      this.eventObserver = observer;
    });
  }

  private eventObserver: Observer<SseEvent<unknown>> | null = null;

  /**
   * 发送事件到SSE流
   */
  private send<T>(type: string, data: T): void {
    if (this.eventObserver) {
      this.eventObserver.next({
        type,
        data,
      });
    }
  }

  /**
   * 发送 RUN_STARTED 事件
   * @param runId - 本次运行的唯一ID
   */
  sendRunStarted(runId: string): void {
    const data: RunStartedData = { runId };
    this.send(AgUiEventType.RUN_STARTED, data);
  }

  /**
   * 发送 TEXT_MESSAGE_START 事件
   * @param messageId - 消息ID
   */
  sendTextMessageStart(messageId: string): void {
    const data: TextMessageStartData = {
      messageId,
      role: 'assistant',
    };
    this.send(AgUiEventType.TEXT_MESSAGE_START, data);
  }

  /**
   * 发送 TEXT_MESSAGE_CONTENT 事件
   * @param content - 文本内容增量
   */
  sendTextMessageContent(content: string): void {
    const data: TextMessageContentData = { content };
    this.send(AgUiEventType.TEXT_MESSAGE_CONTENT, data);
  }

  /**
   * 发送 TEXT_MESSAGE_END 事件
   * @param messageId - 消息ID
   */
  sendTextMessageEnd(messageId: string): void {
    const data: TextMessageEndData = { messageId };
    this.send(AgUiEventType.TEXT_MESSAGE_END, data);
  }

  /**
   * 发送 TOOL_CALL_START 事件
   * @param toolCallId - 工具调用ID
   * @param toolName - 工具名称
   */
  sendToolCallStart(toolCallId: string, toolName: string): void {
    const data: ToolCallStartData = { toolCallId, toolName };
    this.send(AgUiEventType.TOOL_CALL_START, data);
  }

  /**
   * 发送 TOOL_CALL_ARGS 事件
   * @param toolCallId - 工具调用ID
   * @param args - 工具参数(JSON字符串)
   */
  sendToolCallArgs(toolCallId: string, args: string): void {
    const data: ToolCallArgsData = { toolCallId, args };
    this.send(AgUiEventType.TOOL_CALL_ARGS, data);
  }

  /**
   * 发送 TOOL_CALL_END 事件
   * @param toolCallId - 工具调用ID
   */
  sendToolCallEnd(toolCallId: string): void {
    const data: ToolCallEndData = { toolCallId };
    this.send(AgUiEventType.TOOL_CALL_END, data);
  }

  /**
   * 发送 RUN_FINISHED 事件
   * @param runId - 运行ID
   */
  sendRunFinished(runId: string): void {
    const data: RunFinishedData = { runId };
    this.send(AgUiEventType.RUN_FINISHED, data);
  }

  /**
   * 发送 RUN_ERROR 事件
   * @param error - 错误信息
   * @param code - 错误码(可选)
   */
  sendRunError(error: string, code?: string): void {
    const data: RunErrorData = { error, code };
    this.send(AgUiEventType.RUN_ERROR, data);
  }

  /**
   * 完成SSE流
   * 不发送额外的done事件(AG-UI协议不需要)
   */
  complete(): void {
    if (this.eventObserver) {
      this.eventObserver.complete();
      this.eventObserver = null;
    }
  }
}
