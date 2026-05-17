import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma数据库模块 - 全局模块
 * 提供PrismaService供所有模块使用
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
