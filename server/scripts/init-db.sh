#!/bin/bash
# 数据库初始化脚本

set -e

echo "开始初始化数据库..."

# 读取环境变量
source ../.env

# 使用环境变量中的DATABASE_URL或使用默认值
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASS=${DB_PASS:-}
DB_NAME=${DB_NAME:-agent_service}

echo "数据库配置:"
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo "  用户: $DB_USER"
echo "  数据库: $DB_NAME"

# 执行SQL脚本
if [ -z "$DB_PASS" ]; then
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" < ./init-db.sql
else
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" < ./init-db.sql
fi

echo ""
echo "数据库初始化完成！"
echo ""
echo "接下来请运行:"
echo "  cd .. && npx prisma migrate dev --name init"
