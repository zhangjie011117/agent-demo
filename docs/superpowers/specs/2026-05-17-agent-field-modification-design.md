# Agent 字段修改与备注添加设计方案

## 概述

修改 `agent` 表的 `name` 和 `type` 字段长度，并为所有数据表的所有字段添加完整的备注（MySQL COMMENT）。

## 修改内容

### 1. Prisma Schema (`schema.prisma`)

#### Agent Model
- `name`: `String` → `String @db.VarChar(100)`
- `type`: `String @db.VarChar(191)` → `String @db.VarChar(32)`

#### 检查所有 Model 的 comment 是否完整（基于迁移文件对照）
以下字段在迁移 SQL 中有 COMMENT，但 schema.prisma 中可能缺少：
- `Tool.description` - 目前无 `@db.VarChar` 标注，迁移 SQL 中是 `VARCHAR(191)`
- `AgentThread.name` - 目前无 `@db.VarChar` 标注，迁移 SQL 中是 `VARCHAR(200)`
- `AgentTool.agent_id` / `AgentTool.tool_id` - 联合主键，需要备注

### 2. Migration SQL

文件: `server/prisma/migrations/20260517000003_modify_agent_field_length/migration.sql`

#### 核心修改
- `agent.name`: `VARCHAR(191)` → `VARCHAR(100)`
- `agent.type`: `VARCHAR(191)` → `VARCHAR(32)`

#### 所有表字段备注
按照现有迁移文件风格，为每个字段添加 `COMMENT '...'`：
- `chat_model` - 7 个字段
- `agent` - 11 个字段
- `agent_thread` - 6 个字段
- `agent_chat` - 10 个字段
- `agent_message` - 8 个字段
- `agent_memory` - 5 个字段
- `tool` - 9 个字段
- `agent_tool` - 2 个字段

### 3. TypeScript 类型 (`agent.types.ts`)

- `Agent` 接口的 `name: string` 和 `type: string` 本身无长度限制，无需修改
- 代码中无依赖具体长度的地方，无需修改

## 实现步骤

1. 创建 `20260517000003_modify_agent_field_length` 迁移目录和 SQL 文件
2. 修改 `schema.prisma` 中 `Agent.name` 和 `Agent.type` 的类型定义
3. 确保 `schema.prisma` 中所有字段都有注释
4. 运行 Prisma 迁移验证

## 回滚方案

删除迁移文件，重置数据库到上一个迁移状态。