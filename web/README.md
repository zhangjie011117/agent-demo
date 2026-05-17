# Agent Web

Agent Chat UI built with Nuxt 4, Vue 3, Nuxt UI, and Tailwind CSS.

## Tech Stack

- **Framework:** Nuxt 4, Vue 3
- **UI Library:** Nuxt UI + Tailwind CSS
- **Language:** TypeScript
- **Agent Client:** @ag-ui/client

## Setup

```bash
pnpm install
```

## Environment Variables

Create a `.env` file:

```env
NUXT_PUBLIC_AGENT_API_URL=http://localhost:3001
```

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The default backend API URL is [http://localhost:3001](http://localhost:3001).

## Build

```bash
pnpm build
```

## Preview

```bash
pnpm preview
```

## Features

- Agent selection and configuration
- SSE streaming chat
- Thread history with pagination
- Session management
