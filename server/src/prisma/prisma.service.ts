import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma服务 - 数据库访问层
 * 提供PrismaClient实例进行数据库操作
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * 模块初始化时连接数据库
   */
  async onModuleInit() {
    await this.$connect();
    console.log('Database connected successfully');
  }

  /**
   * 模块销毁时断开数据库连接
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Database disconnected');
  }
}
