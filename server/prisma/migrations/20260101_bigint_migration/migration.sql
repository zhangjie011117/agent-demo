-- Migration: BigInt ID and Timestamp Type Migration
-- Created: 2026-01-01
-- Description: Change all ID and timestamp fields from String/DateTime to BigInt unsigned, add code field

-- Drop foreign key constraints first
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS AgentTool;
DROP TABLE IF EXISTS AgentMemory;
DROP TABLE IF EXISTS AgentMessage;
DROP TABLE IF EXISTS AgentChat;
DROP TABLE IF EXISTS AgentThread;
DROP TABLE IF EXISTS Agent;
DROP TABLE IF EXISTS ChatModel;
DROP TABLE IF EXISTS Tool;

-- Create ChatModel table
CREATE TABLE `ChatModel` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `provider` varchar(191) NOT NULL,
  `baseUrl` varchar(191) DEFAULT NULL,
  `apiKey` text NOT NULL,
  `model` varchar(191) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ChatModel_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create Agent table
CREATE TABLE `Agent` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'assistant',
  `systemPrompt` text NOT NULL,
  `personaPrompt` text NOT NULL,
  `chatModelId` bigint DEFAULT NULL,
  `shortTermMemoryConfig` json DEFAULT NULL,
  `longTermMemoryConfig` json DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Agent_code_key` (`code`),
  KEY `Agent_chatModelId_idx` (`chatModelId`),
  CONSTRAINT `Agent_chatModelId_fkey` FOREIGN KEY (`chatModelId`) REFERENCES `ChatModel` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create AgentThread table
CREATE TABLE `AgentThread` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agentId` bigint NOT NULL,
  `userId` varchar(191) NOT NULL,
  `uuid` varchar(191) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `AgentThread_uuid_userId_key` (`uuid`,`userId`),
  KEY `AgentThread_agentId_userId_idx` (`agentId`,`userId`),
  KEY `AgentThread_uuid_idx` (`uuid`),
  CONSTRAINT `AgentThread_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create AgentChat table
CREATE TABLE `AgentChat` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agentId` bigint NOT NULL,
  `threadId` bigint NOT NULL,
  `userId` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `metadata` json DEFAULT NULL,
  `tokenUsage` json DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `feedback` varchar(191) DEFAULT NULL,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `AgentChat_threadId_createdAt_idx` (`threadId`,`createdAt`),
  KEY `AgentChat_agentId_createdAt_idx` (`agentId`,`createdAt`),
  KEY `AgentChat_threadId_idx` (`threadId`),
  CONSTRAINT `AgentChat_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AgentChat_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `AgentThread` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create AgentMessage table
CREATE TABLE `AgentMessage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agentId` bigint NOT NULL,
  `threadId` bigint NOT NULL,
  `chatId` bigint NOT NULL,
  `userId` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `tokenUsage` json DEFAULT NULL,
  `createdAt` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `AgentMessage_threadId_createdAt_idx` (`threadId`,`createdAt`),
  KEY `AgentMessage_chatId_createdAt_idx` (`chatId`,`createdAt`),
  KEY `AgentMessage_chatId_idx` (`chatId`),
  KEY `AgentMessage_threadId_idx` (`threadId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create AgentMemory table
CREATE TABLE `AgentMemory` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agentId` bigint NOT NULL,
  `userId` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `AgentMemory_agentId_userId_key` (`agentId`,`userId`),
  KEY `AgentMemory_agentId_idx` (`agentId`),
  CONSTRAINT `AgentMemory_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create Tool table
CREATE TABLE `Tool` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'builtin',
  `functionName` varchar(191) DEFAULT NULL,
  `mcpServer` varchar(191) DEFAULT NULL,
  `prompt` text DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Tool_name_key` (`name`),
  KEY `Tool_type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create AgentTool table
CREATE TABLE `AgentTool` (
  `agentId` bigint NOT NULL,
  `toolId` bigint NOT NULL,
  PRIMARY KEY (`agentId`,`toolId`),
  KEY `AgentTool_toolId_idx` (`toolId`),
  CONSTRAINT `AgentTool_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AgentTool_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `Tool` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create _prisma_migrations table
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) PRIMARY KEY,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(191) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- Migration finished
