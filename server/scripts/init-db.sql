-- 创建数据库脚本
-- 注意: 此脚本只创建数据库，表结构由 Prisma migration 创建
-- 运行顺序: 1. init-db.sql (创建数据库)  2. prisma migrate  3. seed.sql (插入数据)

CREATE DATABASE IF NOT EXISTS agent_service
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

SELECT 'Database agent_service created successfully!' AS status;
