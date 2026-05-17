# agent-demo

AI Agent 服务平台，基于 LangChain、AG-UI 协议构建的智能对话系统。

## 项目简介

本项目是一个 AI Agent 对话平台，包含前后端分离的两个服务：

- **server**: NestJS 后端服务，基于 LangChain + LangGraph 构建 AI 推理能力，通过 Prisma 连接 MySQL 数据库存储数据
- **web**: Nuxt 3 + Vue 3 前端应用，基于 AG-UI 协议实现实时对话交互界面

## 技术栈

### 后端 (server)

- NestJS
- LangChain + LangGraph
- Prisma (MySQL)
- AG-UI 协议

### 前端 (web)

- Nuxt 3
- Vue 3
- @nuxt/ui
- @ag-ui/client

## 项目结构

```
agent-demo/
├── server/                      # NestJS 后端服务
│   ├── prisma/
│   │   ├── schema.prisma       # 数据库模型定义
│   │   ├── migrations/         # 数据库迁移文件
│   │   └── seed.sql            # 种子数据
│   └── src/
│       ├── main.ts             # 应用入口
│       ├── app.module.ts       # 根模块
│       ├── prisma/             # Prisma 服务
│       └── agent/              # Agent 核心模块
│           ├── dto/            # 数据传输对象
│           ├── types/          # 类型定义
│           ├── module.ts       # Agent 模块
│           └── internal/
│               ├── api/        # API 控制器
│               ├── service/    # 业务服务
│               └── support/    # 支持功能
│                   ├── ag-ui/ # AG-UI 事件处理
│                   ├── memory/# 记忆系统
│                   └── prompt/ # 提示词管理
└── web/                        # Nuxt 3 前端应用
    ├── assets/
    │   └── css/
    │       └── main.css        # 全局样式
    ├── components/
    │   ├── Sidebar.vue         # 侧边栏（会话列表）
    │   └── AgentChat.vue       # 对话组件
    ├── composables/
    │   ├── useThreadList.ts    # 会话列表管理
    │   ├── useAgentRun.ts      # Agent 运行
    │   └── useThreadHistory.ts # 历史消息
    ├── pages/
    │   └── index.vue           # 主页面
    ├── types/
    │   └── index.ts            # 类型定义
    └── nuxt.config.ts          # Nuxt 配置
```

## 数据模型

### Agent
AI 智能体配置，包含系统提示词、角色设定、记忆配置等。

### ChatModel
AI 模型配置，支持 DeepSeek、OpenAI、Azure 等提供商。

### AgentThread
对话线程，用户与 Agent 的一个会话上下文。

### AgentChat
一次对话（一轮），包含用户输入和对应的助手回复。

### AgentMessage
对话消息，记录每轮对话中的每条消息（用户/助手/系统/工具）。

### AgentMemory
长期记忆，由 AI 自动总结的用户偏好、习惯等。

### Tool / AgentTool
工具定义及 Agent 与工具的关联关系。

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
PORT=3001
```

**web/.env** (可选)
```env
NUXT_PUBLIC_AGENT_API_URL=http://localhost:3001
```

### 3. 数据库初始化

```bash
cd server
pnpm prisma generate      # 生成 Prisma Client
pnpm prisma db push       # 同步数据库结构
mysql -u root agent_service < prisma/seed.sql  # 初始化种子数据
```

### 4. 启动服务

```bash
# 启动后端
cd server
pnpm run dev

# 启动前端（新终端）
cd web
pnpm run dev
```

后端服务运行在 http://localhost:3001，前端服务运行在 http://localhost:3000。

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
pnpm run typecheck    # 类型检查
```

## 主要功能

- **多 Agent 支持**: 可配置多个 AI 智能体，每个 Agent 有独立的系统提示词和工具
- **会话管理**: 支持创建、切换、删除对话线程
- **实时对话**: 基于 AG-UI 协议实现流式输出
- **短期记忆**: 支持配置最近 N 轮对话作为短期记忆
- **长期记忆**: 支持 AI 自动总结用户偏好并持久化
- **工具扩展**: 支持为 Agent 绑定不同工具（内置工具/MCP 工具）
