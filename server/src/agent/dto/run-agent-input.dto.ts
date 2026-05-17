import { IsString, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 消息内容
 * 支持不同角色的消息结构
 */
export class MessageContentDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  role: 'user' | 'assistant' | 'system' | 'tool';

  @IsOptional()
  content: unknown;

  @IsOptional()
  @IsString()
  toolCallId?: string;
}

/**
 * 工具定义(来自AG-UI)
 * 客户端工具的后端描述
 */
export class ToolDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  parameters?: unknown;
}

/**
 * 上下文项
 * 用于传递业务画像等上下文信息
 */
export class ContextItemDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  value?: string;
}

/**
 * 转发属性
 * 包含agentId和userId等关键信息
 */
export class ForwardedPropsDto {
  @IsString()
  agentId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsArray()
  clientDatasetIds?: string[];

  // 允许额外的扩展字段
  [key: string]: unknown;
}

/**
 * AG-UI RunAgentInput DTO
 * 对应AG-UI协议的输入结构
 */
export class RunAgentInputDto {
  @IsString()
  threadId: string;

  @IsString()
  runId: string;

  @IsOptional()
  @IsString()
  parentRunId?: string;

  @IsOptional()
  state?: unknown;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageContentDto)
  messages: MessageContentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolDto)
  tools?: ToolDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContextItemDto)
  context?: ContextItemDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => ForwardedPropsDto)
  forwardedProps: ForwardedPropsDto;
}
