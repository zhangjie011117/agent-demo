import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Agent列表控制器
 * 提供Agent配置查询接口
 */
@Controller('agents')
export class AgentListController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /agents
   * 获取所有启用的Agent列表
   */
  @Get()
  async getAgents() {
    const agents = await this.prisma.agent.findMany({
      where: { enabled: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { id: 'asc' },
    });

    return agents.map((a) => ({
      id: String(a.id),
      name: a.name,
    }));
  }
}
