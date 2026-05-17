# Agent Selection Chat Page Design

## Overview

将 Agent 选择功能从 URL 路由 (`/agent/[agentId]`) 移到主聊天页面，用户直接在首页下拉选择 Agent、输入用户 ID、选择模型后即可开始对话。

## Changes

### 1. New Backend Endpoint: `GET /agents`

**File**: `server/src/agent/agent.controller.ts` (new controller or add to existing)

Add new controller for listing agents:

```typescript
@Controller('agents')
export class AgentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAgents() {
    return this.prisma.agent.findMany({
      where: { enabled: true },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
  }
}
```

Register in `app.module.ts`.

### 2. Frontend Main Page (`/`)

**File**: `web/src/app/page.tsx`

Replace current instruction page with full chat UI.

#### State Management

```typescript
const [agents, setAgents] = useState<AgentOption[]>([]);
const [selectedAgent, setSelectedAgent] = useState<string>('');
const [threadId, setThreadId] = useState<string>('');
// ... existing userId, models, selectedModel states
```

#### Config Panel Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Agent: [Dropdown ▼]  User ID: [_______]  Model: [Dropdown ▼]  │
└─────────────────────────────────────────────────────────────┘
```

- **Agent Dropdown**: Fetch from `GET /agents`, show `id` as value, `name` as display
- **User ID Input**: Text input, persists to localStorage
- **Model Dropdown**: Fetch from `GET /models` (existing)

#### Chat Area

- Show warning if agent not selected: "请选择 Agent 后开始对话"
- Once agent + userId + model selected, show `AgentChat` component
- Pass `selectedAgent` as `agentId` to `AgentChat`

### 3. Remove Old Route

**Delete**: `web/src/app/agent/[agentId]/page.tsx`

Remove the entire `/agent/[agentId]` directory.

### 4. Backend Module Registration

**File**: `server/src/app.module.ts`

Add `AgentController` to module imports.

## Data Flow

```
User visits /
  → Fetch /agents → populate agent dropdown
  → Fetch /models → populate model dropdown
  → User selects agent + enters userId + selects model
  → Config valid → render AgentChat component

User sends message
  → POST /agent/run with { agentId, userId, model, messages, ... }
  → SSE response → update chat UI
```

## File Changes Summary

| File | Action |
|------|--------|
| `server/src/agent/agent.controller.ts` | Add new controller for agents |
| `server/src/app.module.ts` | Register new controller |
| `web/src/app/page.tsx` | Rewrite as main chat page |
| `web/src/app/agent/[agentId]/page.tsx` | DELETE |
| `web/src/components/agent-chat.tsx` | No changes (reuse as-is) |

## Testing Checklist

- [ ] `GET /agents` returns list of enabled agents
- [ ] Homepage loads with agent dropdown, userId input, model dropdown
- [ ] Selecting agent + entering userId + selecting model enables chat
- [ ] Chat messages send correctly with selected agent
- [ ] Old `/agent/[agentId]` route returns 404
- [ ] Thread ID persists correctly per agent
