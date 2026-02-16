# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yafai AI is a multi-agent system that helps startup founders create pitch decks in Figma via natural language chat. AI agents produce slides using an XML DSL that maps 1:1 to Figma node types, rendered directly in a Figma plugin.

## Monorepo Structure

npm workspaces with 3 packages:

- **`packages/primitives`** (`@yafai/primitives`) — Core DSL types (Frame, Text, Rectangle, Ellipse, Vector, Group, Image), XML parser, design tokens, and schemas. The foundational shared dependency.
- **`packages/backend`** (`@yafai/backend`) — Fastify WebSocket server with LangGraph/Claude AI agent orchestration, tool implementations (create_slide, update_node, etc.), component registry, slide store, and session management. Uses OpenRouter for LLM access.
- **`packages/figma-plugin`** (`@yafai/figma-plugin`) — React/Zustand UI embedded in Figma with chat panel, DSL renderer (primitives → Figma nodes), and validation engine. Built with esbuild + Tailwind CSS.

## Commands

```bash
npm install                  # Install all workspace dependencies
npm run build                # Build all packages
npm run build:primitives     # Build primitives (must build first — other packages depend on it)
npm run build:backend        # Build backend
npm run build:figma-plugin   # Build Figma plugin

npm run dev:backend          # Watch mode for backend (tsx watch)
npm run dev:figma-plugin     # Watch mode for plugin (esbuild watch)
npm run start:backend        # Run backend server

npm run test                 # Run tests across all workspaces
npm run test:primitives      # Run primitives tests only (Vitest)
npm run typecheck            # TypeScript type checking across all packages

npm run lint                 # Lint with Biome
npm run lint:fix             # Auto-fix lint issues
npm run format               # Format with Biome
```

To run a single test file: `npx vitest run <path>` from the package directory or root.

Build order matters: primitives must be built before backend or figma-plugin.

## Code Style

- **Biome** for linting and formatting (not ESLint/Prettier)
- 2-space indentation, single quotes, organized imports
- `noExplicitAny` is off; unused vars/imports are warnings
- TypeScript strict mode, target ES2020, ESM modules

## Architecture

**Data flow:** User (Figma plugin) → WebSocket → Backend (Fastify) → AI Agent (LangGraph + Claude via OpenRouter) → XML DSL → WebSocket → Plugin → Parser → Renderer → Figma nodes

**DSL has two tiers:**
- **Tier 1 (Primitives):** Frame, Text, Rectangle, Vector, Group — map 1:1 to Figma nodes
- **Tier 2 (Components):** Slide, SlideTitle, Card, Paragraph, Heading, StatNumber, BulletList — syntactic sugar that expands to primitives with design tokens

**Key patterns:**
- Slides store both semantic `source` (component-level DSL) and expanded `snapshot` (primitive-level, frozen at render time) for stability
- Component registry supports per-deck custom components that agents can create and reuse
- Validation runs in Figma (only Figma knows actual rendered dimensions), errors feed back to the agent
- Auto-layout is the primary layout mechanism (not absolute positioning)
- All canvas dimensions are 1920×1080 with 110px safe-zone margins

**Backend agent tools:** `create_slide`, `update_slide`, `update_node`, `get_slide`, `list_slides`, `register_component`, `list_components`

## Environment Variables

Required in `.env` at root:
```
OPENROUTER_API_KEY=<key>
```

Optional:
```
PORT=3001
HOST=0.0.0.0
MODEL_NAME=anthropic/claude-sonnet-4.5
WORKSPACE_DIR=./workspace
```

## Key Reference

- `ARCHITECTURE.md` — Comprehensive system design, DSL spec, design tokens, and decisions
- `packages/primitives/README.md` — Primitive API reference with examples
- `packages/figma-plugin/README.md` — Plugin dev guide and architecture
- `packages/backend/src/agents/prompts.ts` — Agent system prompts with DSL rules and constraints
