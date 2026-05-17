-- ==========================================
-- Modify user_id column length
-- 日期: 2026-05-17
-- 描述: 将user_id字段从varchar(191)改为varchar(100)
-- ==========================================

ALTER TABLE `agent_thread` MODIFY COLUMN `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID';
ALTER TABLE `agent_chat` MODIFY COLUMN `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID';
ALTER TABLE `agent_message` MODIFY COLUMN `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID';
ALTER TABLE `agent_memory` MODIFY COLUMN `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID';
