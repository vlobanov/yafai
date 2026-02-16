# @yafai/primitives

Core primitive definitions for the Yafai AI pitch deck system.

## Overview

This package defines the foundational building blocks used by both the AI agent (to generate slides) and the Figma plugin (to render them). The primitives map 1:1 to Figma node types.

## Primitives

### Frame
The primary container type. Supports auto-layout (flexbox-like), fills, strokes, corner radius, and clipping.

```xml
<Frame 
  x={110} y={80} 
  width={400} height={200} 
  fill="#F8F8F8" 
  cornerRadius={16}
  layoutMode="vertical"
  gap={16}
  padding={24}
>
  <!-- children -->
</Frame>
```

### Text
Text content with full typography control. Note: Display titles use **light weight (300)** for an elegant look.

```xml
<Text 
  x={110} y={80} 
  fontFamily="Inter" 
  fontSize={60} 
  fontWeight={300} 
  fill="#1D1D1D"
>
  Title Here
</Text>
```

### Rectangle
Basic rectangle shape with optional rounded corners.

```xml
<Rectangle 
  x={110} y={300} 
  width={200} height={4} 
  fill="#DC3C44" 
  cornerRadius={2}
/>
```

### Ellipse
Ellipse/circle shape, supports arcs for pie charts.

```xml
<Ellipse 
  x={100} y={100} 
  width={50} height={50} 
  fill="#10b981"
/>
```

### Vector
SVG paths and complex vector shapes.

```xml
<Vector 
  svg="<svg>...</svg>" 
  x={100} y={100} 
  width={24} height={24}
/>
```

### Group
Non-layout grouping of elements.

```xml
<Group name="icon-group">
  <Rectangle ... />
  <Ellipse ... />
</Group>
```

## Design Tokens

The package exports design tokens for consistent styling:

```typescript
import { DesignTokens, Colors, Typography, Spacing } from '@yafai/primitives';

// Canvas dimensions
DesignTokens.canvas.width  // 1920
DesignTokens.canvas.height // 1080

// Colors
Colors.primary      // "#1D1D1D" - Main text
Colors.secondary    // "#444444" - Body text
Colors.accent       // "#DC3C44" - Brand red
Colors.accentBlue   // "#2563EB" - Blue highlights
Colors.success      // "#2A9D8F" - Checkmarks, positive
Colors.background   // "#F8F9FB" - Slide background
Colors.surface      // "#F8F8F8" - Cards

// Typography (note: display uses LIGHT weight!)
Typography.scale.display  // { size: 60, weight: 300, lineHeight: 1.43, letterSpacing: -0.017 }
Typography.scale.h1       // { size: 46, weight: 500, lineHeight: 1.2 }
Typography.scale.h2       // { size: 24, weight: 500, lineHeight: 1.5 }

// Spacing
Spacing.md   // 16
Spacing.lg   // 24
Spacing['6xl'] // 110 (slide margin)
```

## Parser

Parse XML DSL (as output by AI agents) to Primitive objects:

```typescript
import { parseDSL } from '@yafai/primitives';

const primitive = parseDSL(`
  <Frame fill="#F8F9FB" width={1920} height={1080}>
    <Text fontSize={60} fontWeight={300} fill="#1D1D1D">Hello World</Text>
  </Frame>
`);
```

## Schema

Get schema definitions for documentation and validation:

```typescript
import { PrimitiveSchemas, generatePrimitiveDocs } from '@yafai/primitives';

// Get schema for a specific primitive
const frameSchema = PrimitiveSchemas.frame;

// Generate markdown documentation
const docs = generatePrimitiveDocs();
```

## Property Reference

### Common Properties (all primitives)
| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Layer name in Figma |
| `visible` | boolean | Visibility (default: true) |
| `opacity` | number | 0-1 opacity |
| `x`, `y` | number | Position relative to parent |
| `width`, `height` | number \| "fill" \| "hug" | Dimensions |

### Frame-specific
| Property | Type | Description |
|----------|------|-------------|
| `fill` | HexColor | Background color |
| `stroke` | HexColor | Border color |
| `strokeWeight` | number | Border width |
| `cornerRadius` | number \| [t,r,b,l] | Corner radius |
| `layoutMode` | "none" \| "horizontal" \| "vertical" | Auto-layout direction |
| `gap` | number | Space between children |
| `padding` | number \| [v,h] \| [t,r,b,l] | Inner padding |
| `primaryAxisAlign` | "start" \| "center" \| "end" \| "space-between" | Main axis alignment |
| `counterAxisAlign` | "start" \| "center" \| "end" \| "baseline" | Cross axis alignment |
| `clipsContent` | boolean | Clip overflowing content |

### Text-specific
| Property | Type | Description |
|----------|------|-------------|
| `text` | string | Text content |
| `fontFamily` | string | Font family (default: "Inter") |
| `fontSize` | number | Font size in pixels |
| `fontWeight` | number \| string | Font weight (100-900) |
| `lineHeight` | number \| "auto" \| "150%" | Line height |
| `textAlign` | "left" \| "center" \| "right" \| "justified" | Horizontal alignment |
| `fill` | HexColor | Text color |
