-- 种子数据脚本
-- 运行前请确保已执行迁移

USE agent_service;

-- ============================================
-- 插入测试数据
-- ============================================

-- 获取当前时间戳
SET @now = UNIX_TIMESTAMP() * 1000;

-- 插入 ChatModel (DeepSeek配置)
INSERT INTO `ChatModel` (
  `code`,
  `name`,
  `provider`,
  `baseUrl`,
  `apiKey`,
  `model`,
  `enabled`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'cm_default',
  'DeepSeek Default',
  'deepseek',
  'https://api.deepseek.com',
  'sk-e573a2a292994e24b358a2745a7eed69',
  'deepseek-v4-flash',
  1,
  @now,
  @now
);

-- 插入 Agent (测试用)
INSERT INTO `Agent` (
  `code`,
  `name`,
  `type`,
  `systemPrompt`,
  `personaPrompt`,
  `chatModelId`,
  `shortTermMemoryConfig`,
  `longTermMemoryConfig`,
  `enabled`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'agent_test',
  '测试助手',
  'assistant',
  '你是一个专业的AI助手，请用简洁专业的语言回复用户。',
  '你是一个乐于助人的助手，擅长回答各类问题。',
  1,
  '{"enabled": true, "limitHistoryTurns": 10}',
  '{"enabled": false, "autoExtract": false, "extractIntervalTurns": 20}',
  1,
  @now,
  @now
);

SELECT 'Seed data inserted successfully!' AS status;
