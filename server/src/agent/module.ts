import { Module } from '@nestjs/common';
import { AgentController } from './internal/api/controller';
import { AgentService } from './internal/service/service';
import { ShortTermMemoryService } from './internal/support/memory/short-term-memory';
import { LongTermMemoryService } from './internal/support/memory/long-term-memory';
import { AgentPromptService } from './internal/support/prompt/agent-prompt';

/**
 * Agent模块
 * 核心AI Agent业务逻辑模块
 */
@Module({
  controllers: [AgentController],
  providers: [
    AgentService,
    ShortTermMemoryService,
    LongTermMemoryService,
    AgentPromptService,
  ],
  exports: [AgentService],
})
export class AgentModule {}
