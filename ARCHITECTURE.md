# Yafai AI: Pitch Deck Agent Architecture

## Overview

A multi-agent system that helps startup founders create pitch decks. The founder interacts via chat, and AI agents produce slides that render directly in Figma.

### Key Principles

1. **Figma is the rendering engine, not an export target** - Agents output a DSL that maps 1:1 to Figma nodes
2. **Two-tier agents** - Strategy agent (content/messaging) → Slide agents (visual composition)
3. **Living component library** - Agents can extend the component registry; new components are reusable by future agents
4. **Snapshots protect stability** - Slides store expanded primitives, so component changes don't break existing slides

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        FIGMA                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Plugin UI                             │ │
│  │  ┌─────────────┐  ┌─────────────────────────────────┐   │ │
│  │  │ Chat Panel  │  │ Slide Canvas (Figma native)     │   │ │
│  │  └─────────────┘  └─────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
              │ WebSocket
              ▼
┌──────────────────────────────────────────────────────────────┐
│                       BACKEND                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ Chat/Session │  │  Component   │  │   Slide Store     │   │
│  │   Manager    │  │   Registry   │  │                   │   │
│  └──────────────┘  └──────────────┘  └───────────────────┘   │
│                           │                                   │
│                    ┌──────┴──────┐                            │
│                    │   Agent     │                            │
│                    │  Executor   │                            │
│                    └─────────────┘                            │
│                           │                                   │
└───────────────────────────┼──────────────────────────────────┘
                            ▼
                       LLM (Claude)
```

---

## The DSL: Figma-Native Markup

Agents output XML that maps directly to Figma node types. No conversion—just instantiation.

### Tier 1: Primitives (Low-Level)

Map 1:1 to Figma nodes:

```xml
<Frame x={80} y={60} width={400} height={200} fill="#f8fafc" cornerRadius={8} />
<Text x={100} y={80} fontFamily="Inter" fontSize={48} fontWeight={600} fill="#1a1a2e">
  Title Here
</Text>
<Rectangle x={80} y={300} width={200} height={4} fill="#2563eb" />
<Vector svg="..." />
<Group>...</Group>
```

Properties mirror Figma's API:
- Position: `x`, `y`
- Size: `width`, `height`
- Fill: `fill` (color)
- Stroke: `stroke`, `strokeWidth`
- Effects: `cornerRadius`, `shadow`
- Auto-layout: `layoutMode`, `padding`, `itemSpacing`

### Tier 2: Design System Components (High-Level)

Syntactic sugar that expands to primitives with design tokens applied:

```xml
<Slide>
  <SlideTitle>Epidermolysis Bullosa: A Severe Unmet Need</SlideTitle>
  
  <Card x={80} y={180} width={800}>
    <Heading level={3}>What is EB?</Heading>
    <Paragraph>
      A group of rare genetic conditions causing extremely fragile skin...
    </Paragraph>
  </Card>
  
  <StatNumber x={1000} y={180} value="500,000" label="Patients worldwide" />
</Slide>
```

Core components:
- `Slide` - Base container (1920×1080)
- `SlideTitle` - Main heading, positioned at y=60
- `Card` - Content container with background, padding, border-radius
- `Paragraph` - Body text with standard styling
- `Heading` - Section heading (levels 1-3)
- `StatNumber` - Large metric with label
- `BulletList` - Styled list items

---

## Design Tokens

Immutable rules that ensure consistency (extracted from Figma designs):

```yaml
canvas:
  width: 1920px
  height: 1080px

safe-zones:
  margin: 110px
  header-y: 80px
  content-start-y: 228px

typography:
  font-family: "Inter"
  font-family-alt: "Helvetica"  # For checkmarks/symbols
  scale:
    hero: { size: 72px, weight: 700, line-height: 1.21 }
    display: { size: 60px, weight: 300, line-height: 1.43, letter-spacing: -1.7% }  # Light!
    h1: { size: 46px, weight: 500, line-height: 1.2 }
    h2: { size: 24px, weight: 500, line-height: 1.5 }
    h3: { size: 24px, weight: 300, line-height: 1.31 }  # Light
    stat: { size: 54px, weight: 400, line-height: 1.0 }
    body-large: { size: 20px, weight: 400, line-height: 1.35 }
    body: { size: 16px, weight: 400, line-height: 1.55 }
    caption: { size: 13px, weight: 400, line-height: 1.5 }
    overline: { size: 12px, weight: 500, line-height: 1.5, letter-spacing: +20%, uppercase }

colors:
  primary: "#1D1D1D"      # Main text, headings
  secondary: "#444444"    # Body text, list items
  tertiary: "#6B7280"     # Supporting text
  muted: "#999999"        # Labels
  accent: "#DC3C44"       # Brand red
  accent-blue: "#2563EB"  # Blue highlights, CTAs
  success: "#2A9D8F"      # Checkmarks, positive
  background: "#F8F9FB"   # Slide background (off-white)
  surface: "#F8F8F8"      # Cards, containers
  border: "#E8E8E8"       # Dividers

spacing:
  unit: 8px
  allowed: [8, 12, 16, 20, 24, 32, 48, 64, 80, 96, 110, 120]
```

---

## Component Registry

### Structure

```
component-registry/
├── core/                    # Ships with system
│   ├── primitives/
│   │   ├── Frame.yaml
│   │   ├── Text.yaml
│   │   └── ...
│   └── base/
│       ├── Slide.yaml
│       ├── SlideTitle.yaml
│       ├── Card.yaml
│       └── ...
│
├── deck-{deck_id}/          # Per-deck custom components
│   ├── PipelineTimeline.yaml
│   └── DiseaseSubtypeCard.yaml
│
└── registry.yaml            # Index for agents
```

### Component Definition Format

```yaml
name: PipelineTimeline
version: "1.0.0"
created_by: "agent"
created_at: "2025-01-21T10:30:00Z"

description: |
  Horizontal timeline showing clinical development stages.
  Current stage highlighted, completed in green, future in gray.

parameters:
  - name: stages
    type: array
    items: string
    
  - name: currentStage
    type: number

expansion: |
  <Frame layoutMode="horizontal" itemSpacing={48}>
    {params.stages.map((stageName, index) => {
      const status = index < params.currentStage ? "completed" 
                   : index === params.currentStage ? "current" 
                   : "future";
      return (
        <Frame layoutMode="vertical" itemSpacing={12}>
          <Frame width={48} height={48} cornerRadius={24} 
                 fill={status === "completed" ? "#10b981" : status === "current" ? "#2563eb" : "#d1d5db"}>
            <Text text={String(index + 1)} fontSize={18} fill="#ffffff" />
          </Frame>
          <Text text={stageName} fontSize={status === "current" ? 18 : 14} />
        </Frame>
      );
    })}
  </Frame>
```

---

## Slide Storage: Snapshots for Safety

Each slide stores both semantic source and expanded snapshot:

```yaml
slide_05:
  id: "slide-05-pipeline"
  created_at: "2025-01-21T10:30:00Z"
  
  # Semantic form (what agent intended)
  source:
    type: Slide
    children:
      - type: SlideTitle
        text: "Development Pipeline"
      - type: PipelineTimeline
        component_version: "1.0.0"
        params:
          stages: ["Discovery", "Preclinical", "Phase 1", "Phase 2"]
          currentStage: 2
  
  # Expanded snapshot (what Figma renders - frozen)
  snapshot:
    type: Frame
    width: 1920
    height: 1080
    children:
      # ... full primitive tree
```

**Why both?**
- Snapshot ensures slide never breaks if component changes
- Source allows understanding what's on the slide, refreshing to new versions

---

## Validation Loop

After rendering in Figma, the plugin validates and reports issues:

```json
{
  "slide_id": "slide-05",
  "validation_errors": [
    {
      "type": "text-overflow",
      "element": "Paragraph in Card at (80, 180)",
      "message": "Text overflows container by 45px",
      "suggestion": "Shorten text or increase container height"
    },
    {
      "type": "out-of-bounds",
      "element": "Frame at (1750, 500)",
      "message": "Extends 30px past slide margin",
      "suggestion": "Move left or reduce width"
    }
  ]
}
```

Agent receives feedback and can revise.

---

## Agent Component Extension Flow

1. Agent creates slide using primitives (no existing component fits)
2. Agent recognizes reusable pattern
3. Agent registers new component via tool call
4. Component saved to deck's registry with version 1.0.0
5. Future agents see it in available components
6. Original slide updated to reference component (snapshot preserved)

---

## Agent Context (What They See)

```markdown
## Available Components

### Core
- Slide, SlideTitle, Card, Paragraph, Heading, StatNumber, BulletList

### This Deck's Custom Components  
- PipelineTimeline - Clinical development stages
- DiseaseSubtypeCard - Disease variant with mutation and treatment

### Primitives
- Frame, Text, Rectangle, Vector, Group

## Design Tokens
[colors, typography, spacing]

## Current Task
[Content gist from strategy agent]
```

Agents see component catalog but NOT other slides' content.

---

## Backend Services

1. **Component Registry Service**
   - CRUD for components
   - Version management  
   - Expansion engine (template → primitives)

2. **Slide Store**
   - Source + snapshot per slide
   - Per-deck isolation

3. **Chat/Session Manager**
   - Conversation context
   - Routes agent tool calls

4. **Figma Plugin Bridge**
   - WebSocket to plugin
   - Sends render commands
   - Receives validation results

5. **Agent Executor**
   - Prepares LLM context
   - Parses agent output
   - Validates before committing

---

## Figma Plugin Responsibilities

1. **Render DSL → Figma nodes**
   - Parse XML
   - Expand high-level components to primitives
   - Create corresponding Figma nodes

2. **Validate rendered output**
   - Check bounds
   - Detect text overflow
   - Flag overlaps

3. **Report validation errors** to backend

4. **Chat UI** embedded in plugin

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| XML over JSON | More natural for hierarchical layouts, agents handle it well |
| 1:1 Figma mapping | No brittle conversion; what you specify is what you get |
| Snapshots + source | Stability (snapshots) + understandability (source) |
| Per-deck component namespacing | Decks can have custom components without polluting global registry |
| Validation in Figma | Figma knows actual rendered dimensions; agents can't predict text fitting |
| Agents extend library | No designer needed; system evolves with use |

---

## Next Steps for PoC

1. **Define core primitives** - Frame, Text, Rectangle, Vector with Figma-matching props
2. **Build basic Figma plugin** - Render primitives, no components yet
3. **Add 3-5 base components** - Slide, SlideTitle, Card, Paragraph, StatNumber
4. **Implement expansion engine** - Component → primitives
5. **Add validation** - Bounds checking, text overflow
6. **Wire up agent** - Context preparation, output parsing
7. **Test end-to-end** - Chat → agent → DSL → Figma render → validation → feedback
