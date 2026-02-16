# @yafai/figma-plugin

Figma plugin for Yafai AI pitch deck system.

## Overview

This plugin renders Yafai primitives to Figma nodes. It communicates with the AI backend via WebSocket and provides:

1. **Primitive Rendering** - Converts `@yafai/primitives` DSL to Figma nodes
2. **Validation** - Checks rendered output for common issues (overflow, out-of-bounds)
3. **Chat UI** - React-based interface for interacting with the AI agent

## Tech Stack

- **React 18** - UI framework
- **Zustand** - State management
- **Tailwind CSS** - Styling with Figma CSS variables
- **esbuild** - Fast bundling
- **TypeScript** - Type safety

## Figma Theme Support

The plugin automatically supports Figma's light and dark themes using CSS variables. All colors are defined using Figma's semantic color tokens (e.g., `--figma-color-bg`, `--figma-color-text-brand`).

Reference: [Figma CSS Variables](https://developers.figma.com/docs/plugins/css-variables/)

## Development

### Prerequisites

- Node.js 18+
- Figma Desktop App

### Setup

```bash
# From monorepo root
npm install

# Build primitives first
npm run build:primitives

# Build plugin
npm run build:figma-plugin
```

### Loading in Figma

1. Open Figma Desktop
2. Go to Plugins → Development → Import plugin from manifest
3. Select `packages/figma-plugin/manifest.json`

### Development Mode

```bash
npm run dev:figma-plugin
```

This watches for changes to code, CSS, and rebuilds automatically.

## Architecture

```
figma-plugin/
├── src/
│   ├── code.ts           # Main plugin entry (runs in Figma sandbox)
│   ├── renderer/         # Primitive → Figma node conversion
│   │   ├── render.ts     # Main render dispatcher
│   │   ├── colors.ts     # Color conversion utilities
│   │   ├── effects.ts    # Effect conversion
│   │   ├── layout.ts     # Auto-layout conversion
│   │   └── primitives/   # Per-primitive renderers
│   └── ui/               # Plugin UI (React - future)
├── dist/
│   └── ui.html           # Plugin UI (static for now)
└── manifest.json         # Figma plugin manifest
```

## API

### Rendering

The plugin accepts messages from the UI:

```typescript
// Render a single primitive
parent.postMessage({
  pluginMessage: {
    type: "render",
    primitive: {
      type: "frame",
      width: 1920,
      height: 1080,
      fill: "#ffffff",
      children: [...]
    },
    options: {
      x: 0,
      y: 0,
      select: true
    }
  }
}, "*");

// Render multiple primitives
parent.postMessage({
  pluginMessage: {
    type: "render-batch",
    primitives: [...]
  }
}, "*");
```

### Validation

```typescript
// Validate a rendered node
parent.postMessage({
  pluginMessage: {
    type: "validate",
    nodeId: "123:456"
  }
}, "*");
```

### Response Messages

```typescript
// Render result
{
  type: "render-result",
  success: true,
  nodeId: "123:456",
  warnings: [
    { type: "missing-font", message: "..." }
  ]
}

// Validation result
{
  type: "validation-result",
  nodeId: "123:456",
  errors: [
    { 
      type: "out-of-bounds",
      element: "Card",
      message: "Extends 30px past right margin",
      suggestion: "Move left or reduce width"
    }
  ]
}
```

## Renderer Details

### Frame Rendering

Frames are converted to Figma `FrameNode` with full support for:

- Fills and strokes
- Corner radius (uniform or per-corner)
- Auto-layout with gap, padding, alignment
- Clipping
- Effects (shadows, blurs)
- Recursive child rendering

### Text Rendering

Text nodes support:

- Font loading (with fallback to Inter)
- Full typography control
- Text alignment and auto-resize
- Text decoration and case transforms

### Shape Rendering

- **Rectangle** → `RectangleNode`
- **Ellipse** → `EllipseNode` (with arc support)
- **Vector** → `VectorNode` or imported SVG
- **Image** → `RectangleNode` with image fill

### Group Rendering

Groups are created from their children using `figma.group()`.
