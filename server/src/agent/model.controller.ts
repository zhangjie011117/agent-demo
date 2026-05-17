import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 模型控制器
 * 提供模型配置查询接口
 */
@Controller('models')
export class ModelController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /models
   * 获取所有启用的模型列表
   */
  @Get()
  async getModels() {
    const models = await this.prisma.chatModel.findMany({
      where: { enabled: true },
      select: {
        id: true,
        name: true,
        provider: true,
        model: true,
      },
      orderBy: { id: 'asc' },
    });

    return models.map((m) => ({
      id: m.model,
      name: m.name,
      provider: m.provider,
    }));
  }
}
