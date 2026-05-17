import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentListController } from './agent-list.controller';
import { AgentService } from './agent.service';
import { AgUiSseService } from './ag-ui/ag-ui-sse.service';
import { ShortTermMemoryService } from './memory/short-term-memory.service';
import { LongTermMemoryService } from './memory/long-term-memory.service';
import { AgentPromptService } from './prompt/agent-prompt.service';

/**
 * Agent模块
 * 核心AI Agent业务逻辑模块
 */
@Module({
  controllers: [AgentController, AgentListController],
  providers: [
    AgentService,
    AgUiSseService,
    ShortTermMemoryService,
    LongTermMemoryService,
    AgentPromptService,
  ],
  exports: [AgentService],
})
export class AgentModule {}
