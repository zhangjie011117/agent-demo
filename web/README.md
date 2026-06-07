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

No frontend API URL is required. The browser calls same-origin `/api/**` paths.

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). In development, Nuxt proxies `/api/**` to [http://localhost:3001](http://localhost:3001) and strips the `/api` prefix before forwarding to the backend.

In production, configure your gateway or hosting platform so `/api/**` points to the backend service with the same `/api` prefix stripping behavior.

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
