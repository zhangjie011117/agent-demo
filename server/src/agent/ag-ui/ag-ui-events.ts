/**
 * AG-UI 协议事件类型枚举
 * 定义了Agent与前端通信的所有SSE事件类型
 */
export enum AgUiEventType {
  // Agent开始运行
  RUN_STARTED = 'RUN_STARTED',
  // 文本消息块开始
  TEXT_MESSAGE_START = 'TEXT_MESSAGE_START',
  // 文本内容增量(流式传输)
  TEXT_MESSAGE_CONTENT = 'TEXT_MESSAGE_CONTENT',
  // 文本消息块结束
  TEXT_MESSAGE_END = 'TEXT_MESSAGE_END',
  // 工具调用开始(HITL-人机交互)
  TOOL_CALL_START = 'TOOL_CALL_START',
  // 工具参数
  TOOL_CALL_ARGS = 'TOOL_CALL_ARGS',
  // 工具调用结束
  TOOL_CALL_END = 'TOOL_CALL_END',
  // 运行完成
  RUN_FINISHED = 'RUN_FINISHED',
  // 运行错误
  RUN_ERROR = 'RUN_ERROR',
}

/**
 * SSE事件基础结构
 * 每个data JSON必须包含type字段，值等于事件名
 */
export interface SseEvent<T = unknown> {
  type: string; // 与事件名相同，如 'RUN_STARTED'
  data: T;
}

/**
 * RUN_STARTED: Agent开始运行
 */
export interface RunStartedData {
  runId: string; // 本次运行的唯一ID
}

/**
 * TEXT_MESSAGE_START: 文本消息开始
 */
export interface TextMessageStartData {
  messageId: string; // 消息唯一ID
  role: 'assistant'; // 固定为assistant
}

/**
 * TEXT_MESSAGE_CONTENT: 文本内容增量
 * 流式传输，每个chunk一个事件
 */
export interface TextMessageContentData {
  content: string; // 文本增量内容
}

/**
 * TEXT_MESSAGE_END: 文本消息结束
 */
export interface TextMessageEndData {
  messageId: string; // 结束的消息ID
}

/**
 * TOOL_CALL_START: 工具调用开始(HITL-人机交互)
 */
export interface ToolCallStartData {
  toolCallId: string; // 工具调用ID(用于关联结果)
  toolName: string; // 工具名称
}

/**
 * TOOL_CALL_ARGS: 工具参数
 */
export interface ToolCallArgsData {
  toolCallId: string; // 关联的调用ID
  args: string; // JSON格式的工具参数
}

/**
 * TOOL_CALL_END: 工具调用结束
 */
export interface ToolCallEndData {
  toolCallId: string; // 结束的调用ID
}

/**
 * RUN_FINISHED: 运行成功完成
 */
export interface RunFinishedData {
  runId: string; // 完成的运行ID
}

/**
 * RUN_ERROR: 运行出错
 */
export interface RunErrorData {
  error: string; // 错误信息
  code?: string; // 错误码(可选)
}
