-- ==========================================
-- Initial Schema Migration
-- 日期: 2026-05-17
-- 描述: 初始化完整数据库结构
-- ==========================================

-- ==========================================
-- ChatModel: AI模型配置
-- ==========================================
CREATE TABLE `chat_model` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(100) NOT NULL COMMENT '模型配置名称',
    `provider` VARCHAR(32) NOT NULL COMMENT '提供商: deepseek / openai / azure',
    `base_url` VARCHAR(500) NULL COMMENT 'API地址(可选，用于代理)',
    `api_key` VARCHAR(500) NOT NULL COMMENT 'API密钥',
    `model` VARCHAR(200) NOT NULL COMMENT '模型名称: deepseek-chat / gpt-4o',
    `enabled` BOOLEAN NOT NULL DEFAULT true COMMENT '是否启用',
    `created_at` BIGINT NOT NULL COMMENT '创建时间戳',
    `updated_at` BIGINT NOT NULL COMMENT '更新时间戳',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Agent: AI智能体配置
-- ==========================================
CREATE TABLE `agent` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(100) NOT NULL COMMENT 'Agent名称',
    `type` VARCHAR(32) NOT NULL DEFAULT 'assistant' COMMENT '类型: assistant',
    `system_prompt` TEXT NOT NULL COMMENT '系统提示词',
    `persona_prompt` TEXT NOT NULL COMMENT '角色设定提示词',
    `chat_model_id` BIGINT NULL COMMENT '关联的ChatModel ID',
    `short_term_memory_config` JSON NULL COMMENT '短期记忆配置: { enabled: true, limitHistoryTurns: 10 }',
    `long_term_memory_config` JSON NULL COMMENT '长期记忆配置: { enabled: true, autoExtract: true, extractIntervalTurns: 20 }',
    `enabled` BOOLEAN NOT NULL DEFAULT true COMMENT '是否启用',
    `created_at` BIGINT NOT NULL COMMENT '创建时间戳',
    `updated_at` BIGINT NOT NULL COMMENT '更新时间戳',

    PRIMARY KEY (`id`),
    INDEX `agent_chat_model_id_idx`(`chat_model_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- AgentThread: 对话线程
-- 用户与Agent的一个会话上下文
-- ==========================================
CREATE TABLE `agent_thread` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `agent_id` BIGINT NOT NULL COMMENT '所属Agent ID',
    `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID',
    `uuid` VARCHAR(36) NOT NULL COMMENT '客户端提供的threadId(全局唯一)',
    `name` VARCHAR(200) NULL COMMENT '线程名称',
    `created_at` BIGINT NOT NULL COMMENT '创建时间戳',
    `updated_at` BIGINT NOT NULL COMMENT '更新时间戳',

    PRIMARY KEY (`id`),
    INDEX `agent_thread_agent_id_user_id_idx`(`agent_id`, `user_id`),
    UNIQUE INDEX `agent_thread_uuid_user_id_key`(`uuid`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- AgentChat: 一次对话(一轮)
-- 包含用户输入和对应的助手回复
-- ==========================================
CREATE TABLE `agent_chat` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `agent_id` BIGINT NOT NULL COMMENT '所属Agent ID',
    `thread_id` BIGINT NOT NULL COMMENT '所属线程ID',
    `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID',
    `content` TEXT NOT NULL COMMENT '用户本轮输入的消息',
    `metadata` JSON NULL COMMENT '元数据(扩展字段)',
    `token_usage` JSON NULL COMMENT 'token使用量统计',
    `rating` INT NULL COMMENT '用户评分(可选)',
    `feedback` TEXT NULL COMMENT '用户反馈(可选)',
    `created_at` BIGINT NOT NULL COMMENT '创建时间戳',
    `updated_at` BIGINT NOT NULL COMMENT '更新时间戳',

    PRIMARY KEY (`id`),
    INDEX `agent_chat_thread_id_created_at_idx`(`thread_id`, `created_at`),
    INDEX `agent_chat_agent_id_created_at_idx`(`agent_id`, `created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- AgentMessage: 对话消息
-- 记录每轮对话中的每条消息(用户/助手/系统/工具)
-- ==========================================
CREATE TABLE `agent_message` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `agent_id` BIGINT NOT NULL COMMENT '所属Agent ID',
    `thread_id` BIGINT NOT NULL COMMENT '所属线程ID',
    `chat_id` BIGINT NOT NULL COMMENT '所属Chat ID',
    `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID',
    `role` VARCHAR(10) NOT NULL COMMENT '角色: user / assistant / system / tool',
    `content` TEXT NOT NULL COMMENT '消息内容(JSON格式)',
    `token_usage` JSON NULL COMMENT 'token使用量统计',
    `created_at` BIGINT NOT NULL COMMENT '创建时间戳',

    PRIMARY KEY (`id`),
    INDEX `agent_message_thread_id_created_at_idx`(`thread_id`, `created_at`),
    INDEX `agent_message_chat_id_created_at_idx`(`chat_id`, `created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- AgentMemory: 长期记忆
-- 由AI自动总结的用户偏好、习惯等
-- ==========================================
CREATE TABLE `agent_memory` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `agent_id` BIGINT NOT NULL COMMENT '所属Agent ID',
    `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID',
    `content` TEXT NOT NULL COMMENT '记忆内容',
    `created_at` BIGINT NOT NULL COMMENT '创建时间戳',
    `updated_at` BIGINT NOT NULL COMMENT '更新时间戳',

    PRIMARY KEY (`id`),
    INDEX `agent_memory_agent_id_idx`(`agent_id`),
    UNIQUE INDEX `agent_memory_agent_id_user_id_key`(`agent_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Tool: 可用工具定义
-- ==========================================
CREATE TABLE `tool` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(100) NOT NULL COMMENT '工具唯一名称',
    `description` VARCHAR(191) NULL COMMENT '工具描述',
    `type` VARCHAR(20) NOT NULL DEFAULT 'builtin' COMMENT '类型: builtin / mcp',
    `function_name` VARCHAR(100) NULL COMMENT '函数名(用于builtin类型)',
    `mcp_server` VARCHAR(1024) NULL COMMENT 'MCP服务器地址(用于mcp类型)',
    `prompt` TEXT NULL COMMENT '工具使用提示词',
    `enabled` BOOLEAN NOT NULL DEFAULT true COMMENT '是否启用',
    `created_at` BIGINT NOT NULL COMMENT '创建时间戳',
    `updated_at` BIGINT NOT NULL COMMENT '更新时间戳',

    PRIMARY KEY (`id`),
    UNIQUE INDEX `tool_name_key`(`name`),
    INDEX `tool_type_idx`(`type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- AgentTool: Agent与Tool的关联关系
-- ==========================================
CREATE TABLE `agent_tool` (
    `agent_id` BIGINT NOT NULL COMMENT 'Agent ID',
    `tool_id` BIGINT NOT NULL COMMENT 'Tool ID',

    PRIMARY KEY (`agent_id`, `tool_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- 外键约束
-- ==========================================
ALTER TABLE `agent` ADD CONSTRAINT `agent_chat_model_id_fkey` FOREIGN KEY (`chat_model_id`) REFERENCES `chat_model`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agent_thread` ADD CONSTRAINT `agent_thread_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `agent_chat` ADD CONSTRAINT `agent_chat_thread_id_fkey` FOREIGN KEY (`thread_id`) REFERENCES `agent_thread`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `agent_message` ADD CONSTRAINT `agent_message_chat_id_fkey` FOREIGN KEY (`chat_id`) REFERENCES `agent_chat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `agent_memory` ADD CONSTRAINT `agent_memory_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `agent_tool` ADD CONSTRAINT `agent_tool_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `agent_tool` ADD CONSTRAINT `agent_tool_tool_id_fkey` FOREIGN KEY (`tool_id`) REFERENCES `tool`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

