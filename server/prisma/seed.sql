-- ==========================================
-- Seed Data
-- 日期: 2026-05-17
-- 描述: 初始化数据
-- ==========================================

-- 插入 ChatModel (AI模型配置)
INSERT INTO `chat_model` (`name`, `provider`, `base_url`, `api_key`, `model`, `enabled`, `created_at`, `updated_at`) VALUES
('deepseek-v4-flash', 'deepseek', 'https://api.deepseek.com', 'your-api-key-here', 'deepseek-v4-flash', true, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);

-- 插入 Agent (AI智能体)
INSERT INTO `agent` (`name`, `type`, `system_prompt`, `persona_prompt`, `chat_model_id`, `short_term_memory_config`, `long_term_memory_config`, `enabled`, `created_at`, `updated_at`) VALUES
('默认助手', 'assistant', '你是一个专业的AI助手，请根据用户的问题提供准确、简洁的回答。', '友好、专业、有耐心', 1, '{"enabled": true, "limitHistoryTurns": 10}', '{"enabled": true, "autoExtract": true, "extractIntervalTurns": 20}', true, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);

-- 插入 Tool (工具)
INSERT INTO `tool` (`name`, `description`, `type`, `function_name`, `mcp_server`, `prompt`, `enabled`, `created_at`, `updated_at`) VALUES
('天气查询', '查询指定城市的天气信息', 'builtin', 'getWeather', NULL, '使用天气查询工具获取实时天气数据', true, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
('计算器', '执行数学计算', 'builtin', 'calculate', NULL, '使用计算器执行数学运算', true, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);
