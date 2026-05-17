import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './agent/module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * 应用根模块
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Prisma数据库模块
    PrismaModule,
    // Agent模块
    AgentModule,
  ],
})
export class AppModule {}
