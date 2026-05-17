# agent-demo

AI Agent 服务平台，基于 LangChain、AG-UI 协议构建的智能对话系统。

## 项目简介

本项目是一个 AI Agent 对话平台，包含前后端分离的两个服务：

- **agent-server**: NestJS 后端服务，基于 LangChain 构建 AI 推理能力，通过 Prisma 连接 MySQL 数据库存储数据
- **agent-web**: Nuxt 3 + Vue 3 前端应用，基于 AG-UI 协议实现实时对话交互界面

## 技术栈

### 后端 (server)
- NestJS
- LangChain + LangGraph
- Prisma (MySQL)
- AG-UI 协议

### 前端 (web)
- Nuxt 3
- Vue 3
- Ant Design Vue 4.x
- @ag-ui/client

## 环境要求

- Node.js 18+
- MySQL 8.0+
- pnpm

## 安装运行

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
pnpm install

# 安装前端依赖
cd ../web
pnpm install
```

### 2. 配置环境变量

**server/.env**
```env
DATABASE_URL="mysql://root:password@localhost:3306/agent_service"
DEEPSEEK_API_KEY="your-api-key"
DEEPSEEK_MODEL="deepseek-v4-flash"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
PORT=3000
```

**web/.env** (如需要)
```env
NUXT_PUBLIC_AGENT_API_URL=http://localhost:3000
```

### 3. 数据库初始化 (仅首次)

```bash
cd server
pnpm prisma generate      # 生成 Prisma Client
pnpm prisma db push       # 同步数据库结构
mysql -u root agent_service < prisma/seed.sql  # 初始化种子数据
```

### 4. 启动服务

```bash
# 启动后端 (开发模式)
cd server
pnpm run dev

# 启动前端 (新终端)
cd web
pnpm run dev
```

访问 http://localhost:3000 查看前端界面。

## 常用命令

### 后端
```bash
cd server
pnpm run build        # 编译 TypeScript
pnpm run start        # 生产环境启动
pnpm run dev          # 开发模式启动
pnpm prisma studio    # 打开数据库管理界面
```

### 前端
```bash
cd web
pnpm run dev          # 开发模式
pnpm run build        # 生产构建
pnpm run start        # 生产启动
```
