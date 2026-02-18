# DSL Reference

> **Complete reference for writing Yafai slide XML.**
> Covers syntax, rules, layout patterns, icons, pitfalls, and the MCP workflow.

---

## Critical Rules

These rules are enforced by validation. Breaking them produces broken slides.

1. **ALWAYS use auto-layout** — `layoutMode="vertical"` or `"horizontal"` on every Frame. NEVER use absolute x/y positioning.
2. **Use gap for ALL spacing** — `gap={0}` is NEVER correct. Use real values: `gap={8}`, `gap={16}`, `gap={24}`, `gap={32}`, `gap={48}`. Do NOT create empty "spacer" frames.
3. **Use padding on containers** — cards, content areas, and the root frame need padding. Typical: `padding={24}` to `padding={110}`.
4. **Use `width="fill"` on Text** inside auto-layout so text fills container width and wraps properly.
5. **Use `width="fill"` or `width="hug"` on inner frames** — do NOT use fixed pixel widths like `width={200}` on inner frames. `width="fill"` distributes space evenly. `width="hug"` sizes to content. Fixed `width={1920} height={1080}` is ONLY for the root frame.
6. **Do NOT add `fill="#FFFFFF"`** or any white/near-white fill to frames. Most frames should be transparent (no fill). Only use fill on intentional cards/containers with a visible background like `fill="#F8F8F8"` paired with `cornerRadius`.
7. **Use BOTH vertical AND horizontal layouts** — not everything is a vertical stack.
8. **Every element MUST have a unique `id` attribute** — use descriptive IDs: `"title"`, `"stat-revenue"`, `"problem-card"` — NOT `"frame1"`, `"text2"`.

### Good vs Bad Examples

```xml
<!-- BAD: gap={0}, spacer frames, fixed widths, fill="#FFFFFF" -->
<Frame id="row" layoutMode="horizontal" gap={0} fill="#FFFFFF">
  <Frame id="col-1" width={200}>...</Frame>
  <Frame id="spacer" width="fill" height={24} />
  <Frame id="col-2" width={160}>...</Frame>
</Frame>

<!-- GOOD: proper gap, fill-based sizing, no unnecessary fill -->
<Frame id="row" layoutMode="horizontal" gap={24}>
  <Frame id="col-1" width="fill">...</Frame>
  <Frame id="col-2" width="fill">...</Frame>
</Frame>
```

---

## Properties Reference

### Frame Properties

| Property          | Values                                          | Description |
|-------------------|-------------------------------------------------|-------------|
| `id`              | string                                          | Unique element ID (required) |
| `layoutMode`      | `"vertical"`, `"horizontal"`                    | Auto-layout direction (always use one) |
| `width`           | number, `"fill"`, `"hug"`                       | Width — prefer `"fill"` or `"hug"` over fixed |
| `height`          | number, `"fill"`, `"hug"`                       | Height |
| `gap`             | number                                          | Space between children |
| `padding`         | number                                          | Uniform internal padding |
| `paddingTop`      | number                                          | Top padding (overrides `padding`) |
| `paddingRight`    | number                                          | Right padding |
| `paddingBottom`   | number                                          | Bottom padding |
| `paddingLeft`     | number                                          | Left padding |
| `primaryAxisAlign`| `"start"`, `"center"`, `"end"`, `"space-between"` | Main axis alignment |
| `counterAxisAlign`| `"start"`, `"center"`, `"end"`                  | Cross axis alignment |
| `layoutGrow`      | number                                          | Flex grow (1 = fill available space) |
| `fill`            | hex color string                                | Background color |
| `cornerRadius`    | number                                          | Border radius (uniform, all 4 corners) |
| `clipsContent`    | boolean                                         | Clip children that overflow |
| `stroke`          | hex color string                                | Border color |
| `strokeWeight`    | number                                          | Border thickness |
| `strokeAlign`     | `"inside"`, `"outside"`, `"center"`             | Border position |
| `opacity`         | number (0-1)                                    | Element transparency |

### Text Properties

| Property       | Values           | Description |
|----------------|------------------|-------------|
| `id`           | string           | Unique element ID (required) |
| `width`        | number, `"fill"` | Text width — use `"fill"` for wrapping |
| `fontFamily`   | string           | Font name (default: `"Inter"`) |
| `fontSize`     | number           | Font size in pixels |
| `fontWeight`   | number           | Weight: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold) |
| `fill`         | hex color string | Text color |
| `textAlign`    | `"left"`, `"center"`, `"right"` | Horizontal alignment |
| `lineHeight`   | number           | Line height multiplier |
| `letterSpacing` | number          | Letter spacing multiplier |

### Icon Properties

| Property      | Values           | Description |
|---------------|------------------|-------------|
| `id`          | string           | Unique element ID (required) |
| `name`        | string           | Kebab-case Lucide icon name (required) |
| `size`        | number           | Pixel size (default: 24) |
| `color`       | hex color string | Stroke color (default: `"#1D1D1D"`) |
| `strokeWidth` | number           | Stroke width (default: 2) |

### Rectangle Properties

| Property       | Values           | Description |
|----------------|------------------|-------------|
| `id`           | string           | Unique element ID (required) |
| `width`        | number, `"fill"` | Rectangle width |
| `height`       | number           | Rectangle height |
| `fill`         | hex color string | Fill color |
| `cornerRadius` | number           | Border radius |

---

## Inline Text Formatting

Use `<B>`, `<I>`, `<U>`, `<S>`, and `<Span>` tags inside `<Text>` to apply mixed styles within a single text node. These map to Figma's range-based text styling APIs.

### Tags

| Tag | Effect | Example |
|-----|--------|---------|
| `<B>` | Bold (fontWeight 700) | `<B>bold text</B>` |
| `<I>` | Italic | `<I>italic text</I>` |
| `<U>` | Underline | `<U>underlined</U>` |
| `<S>` | Strikethrough | `<S>old price</S>` |
| `<Span ...>` | Custom overrides | `<Span fontWeight={600} fill="#FF0000">custom</Span>` |

### `<Span>` Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `fontFamily` | string | Font family override |
| `fontSize` | number | Font size override |
| `fontWeight` | number | Font weight override |
| `fontStyle` | `"normal"`, `"italic"` | Font style override |
| `fill` | hex color | Text color override |
| `textDecoration` | `"underline"`, `"strikethrough"` | Decoration override |
| `letterSpacing` | number | Letter spacing override |

### Examples

```xml
<!-- Mixed bold and italic in a sentence -->
<Text id="tagline" width="fill" fontSize={20} fill="#333333">
  Revenue grew <B>150%</B> with <I>zero</I> configuration.
</Text>

<!-- Strikethrough pricing -->
<Text id="pricing" width="fill" fontSize={24}>
  Was <S>$99/mo</S> — now <U>$49/mo</U>.
</Text>

<!-- Custom color spans -->
<Text id="highlight" width="fill" fontSize={18}>
  Status: <Span fontWeight={600} fill="#22C55E">Active</Span>
</Text>

<!-- Nesting: bold + italic combined -->
<Text id="emphasis" width="fill" fontSize={18}>
  This is <B><I>bold and italic</I></B> text.
</Text>
```

### Notes

- Nesting works: `<B><I>bold+italic</I></B>` applies both styles.
- Plain `<Text>text</Text>` without inline tags is unchanged (backwards compatible).
- Whitespace between tags is preserved: `A <B>B</B> C` renders as "A B C".
- The `text` attribute on `<Text>` takes priority — inline tags only work with children content.

---

## Text in Auto-Layout

```xml
<!-- CORRECT: Text fills container width, wraps naturally -->
<Frame id="content" layoutMode="vertical" gap={16} padding={24}>
  <Text id="heading" width="fill" fontSize={24} fontWeight={500}>
    Title that can be long
  </Text>
  <Text id="body" width="fill" fontSize={20} fill="#444444">
    Body text that wraps properly when it gets too long
    because width="fill" makes it respect the container.
  </Text>
</Frame>

<!-- WRONG: Text clips at fixed width -->
<Frame id="content" layoutMode="vertical" gap={16} padding={24}>
  <Text id="heading" width={100} fontSize={24}>This will clip!</Text>
</Frame>
```

- `width="fill"` on Text inside vertical frame = text fills parent width and wraps correctly
- Text without explicit width in auto-layout = defaults to HUG (no wrapping)
- **Always use `width="fill"` on multi-line text inside auto-layout**

---

## Layout Patterns

### Stat Row
```xml
<Frame id="stats-row" layoutMode="horizontal" gap={48} width="fill"
  primaryAxisAlign="space-between">
  <Frame id="stat-1" layoutMode="vertical" gap={8} width="hug">
    <Text id="stat-1-value" fontSize={54} fontWeight={400} fill="#DC3C44">$50B</Text>
    <Text id="stat-1-label" fontSize={16} fill="#6B7280">Market Size</Text>
  </Frame>
  <Frame id="stat-2" layoutMode="vertical" gap={8} width="hug">
    <Text id="stat-2-value" fontSize={54} fontWeight={400} fill="#DC3C44">10M+</Text>
    <Text id="stat-2-label" fontSize={16} fill="#6B7280">Users</Text>
  </Frame>
  <Frame id="stat-3" layoutMode="vertical" gap={8} width="hug">
    <Text id="stat-3-value" fontSize={54} fontWeight={400} fill="#DC3C44">150%</Text>
    <Text id="stat-3-label" fontSize={16} fill="#6B7280">YoY Growth</Text>
  </Frame>
</Frame>
```

### Two-Column Layout
```xml
<Frame id="two-col" layoutMode="horizontal" gap={48} width="fill" height="fill">
  <Frame id="col-left" layoutMode="vertical" gap={24} width="fill">
    <Text id="left-title" width="fill" fontSize={24} fontWeight={500}>Problem</Text>
    <Text id="left-body" width="fill" fontSize={20} fill="#444444">
      Description of the problem.
    </Text>
  </Frame>
  <Frame id="col-right" layoutMode="vertical" gap={24} width="fill">
    <Frame id="right-visual" fill="#F8F8F8" cornerRadius={16} padding={32}
      width="fill" height="fill" layoutMode="vertical" />
  </Frame>
</Frame>
```

### Icon + Text Row
```xml
<Frame id="feature-1" layoutMode="horizontal" gap={16}
  counterAxisAlign="center" width="fill">
  <Icon id="feature-1-icon" name="check-circle" size={24} color="#2A9D8F" />
  <Text id="feature-1-text" width="fill" fontSize={20} fill="#444444">
    Feature description
  </Text>
</Frame>
```

### Card Grid (3 cards)
```xml
<Frame id="card-grid" layoutMode="horizontal" gap={24} width="fill">
  <Frame id="card-1" layoutMode="vertical" gap={16} padding={24}
    fill="#F8F8F8" cornerRadius={16} width="fill">
    <Text id="card-1-title" width="fill" fontSize={20} fontWeight={500}>Card 1</Text>
    <Text id="card-1-desc" width="fill" fontSize={16} fill="#444444">Description</Text>
  </Frame>
  <Frame id="card-2" layoutMode="vertical" gap={16} padding={24}
    fill="#F8F8F8" cornerRadius={16} width="fill">
    <Text id="card-2-title" width="fill" fontSize={20} fontWeight={500}>Card 2</Text>
    <Text id="card-2-desc" width="fill" fontSize={16} fill="#444444">Description</Text>
  </Frame>
  <Frame id="card-3" layoutMode="vertical" gap={16} padding={24}
    fill="#F8F8F8" cornerRadius={16} width="fill">
    <Text id="card-3-title" width="fill" fontSize={20} fontWeight={500}>Card 3</Text>
    <Text id="card-3-desc" width="fill" fontSize={16} fill="#444444">Description</Text>
  </Frame>
</Frame>
```

---

## Slide Structure

### Recommended Root Frame

```xml
<Frame id="slide-{name}" width={1920} height={1080} fill="#F8F9FB"
  layoutMode="vertical"
  paddingTop={110} paddingLeft={110} paddingRight={110} paddingBottom={110}
  gap={48}>
  <!-- Sections flow vertically -->
</Frame>
```

For asymmetric padding (e.g., tighter top for title positioning):
```xml
<Frame id="slide-{name}" width={1920} height={1080} fill="#F8F9FB"
  layoutMode="vertical"
  paddingTop={72} paddingLeft={96} paddingRight={96} paddingBottom={56}
  gap={24}>
  <!-- ... -->
</Frame>
```

### Variable Gaps Between Sections

Since `gap` is a single value per frame, use transparent wrapper frames with `paddingTop` for extra space between specific sections:

```xml
<Frame id="section-wrapper" width="fill" layoutMode="vertical" paddingTop={32}>
  <!-- actual section content -->
</Frame>
```

---

## Tables

- Wrap the entire table in a frame with `cornerRadius={12}` + `clipsContent={true}`
- Header row: `fill="#1A1A2E"` with white text
- Data rows: `fill="#FFFFFF"` with `layoutMode="horizontal"` + `counterAxisAlign="center"`
- Use fixed widths on all columns except last (use `width="fill"` on last)
- Separators between rows: `<Frame id="sep-n" width="fill" height={1} fill="#F0F0F0" layoutMode="horizontal" />`
- Cell content indentation: `paddingLeft={24}`

```xml
<Frame id="table" layoutMode="vertical" cornerRadius={12} clipsContent={true}
  width="fill">
  <!-- Header -->
  <Frame id="table-header" layoutMode="horizontal" fill="#1A1A2E"
    padding={16} width="fill" counterAxisAlign="center">
    <Text id="th-1" width={200} fontSize={14} fontWeight={600}
      fill="#FFFFFF">Column 1</Text>
    <Text id="th-2" width="fill" fontSize={14} fontWeight={600}
      fill="#FFFFFF">Column 2</Text>
  </Frame>
  <!-- Row -->
  <Frame id="table-row-1" layoutMode="horizontal" fill="#FFFFFF"
    padding={16} width="fill" counterAxisAlign="center">
    <Text id="td-1-1" width={200} fontSize={14} fill="#444444">Cell 1</Text>
    <Text id="td-1-2" width="fill" fontSize={14} fill="#444444">Cell 2</Text>
  </Frame>
  <!-- Separator -->
  <Frame id="sep-1" width="fill" height={1} fill="#F0F0F0" layoutMode="horizontal" />
  <!-- More rows... -->
</Frame>
```

---

## Icons (Lucide)

Icons are rendered from the Lucide library at build time.

**Syntax:**
```xml
<Icon id="icon-id" name="icon-name" size={24} color="#2A9D8F" />
```

**Attributes:**
- `name` (required): kebab-case Lucide icon name (e.g., `"check"`, `"arrow-right"`, `"bar-chart-3"`)
- `size`: pixel size (default: 24)
- `color`: stroke color (default: `"#1D1D1D"`)
- `strokeWidth`: override stroke width (default: 2)
- `id` (required): unique node ID

**Workflow:** Always call `search_icons("keyword")` first to find valid icon names. Do NOT guess names.

```xml
<!-- Icon + text feature row -->
<Frame id="feat-1" layoutMode="horizontal" gap={16}
  counterAxisAlign="center" width="fill">
  <Icon id="feat-1-icon" name="zap" size={24} color="#DC3C44" />
  <Text id="feat-1-text" width="fill" fontSize={20}>Lightning fast performance</Text>
</Frame>

<!-- Card header with icon -->
<Frame id="card" layoutMode="vertical" gap={16} padding={24}
  fill="#F8F8F8" cornerRadius={16} width="fill">
  <Icon id="card-icon" name="bar-chart-3" size={32} color="#2563EB" />
  <Text id="card-title" width="fill" fontSize={20} fontWeight={500}>Analytics</Text>
  <Text id="card-desc" width="fill" fontSize={16} fill="#6B7280">
    Real-time insights into your data.
  </Text>
</Frame>
```

---

## Pitfalls

### The 100px Default Problem

**What happens:** When `width`/`height` is `"fill"`, `"hug"`, or `undefined`, the renderer defaults to 100px. Then `applyLayoutSizing()` only applies fill/hug when the parent IS auto-layout.

**Result:** Any Frame with `width="fill"` or `height="hug"` inside a `layoutMode="none"` parent gets stuck at 100x100px. Text gets clipped.

**Fix:** Always use `layoutMode="vertical"` or `"horizontal"` on the root frame and all parent frames.

### Text Clipping

- Text without `width="fill"` in auto-layout defaults to HUG — no wrapping
- Long text without proper width will overflow or get cut off
- **Always** set `width="fill"` on multi-line Text elements

### Corner Radius

- DSL only supports uniform `cornerRadius` (all 4 corners same value)
- For top-only or bottom-only radius: wrap content in a frame with `cornerRadius` + `clipsContent={true}`

### Common Mistakes

| Mistake | Fix |
|---------|-----|
| `gap={0}` on parent frame | Use a real gap value: `gap={16}`, `gap={24}`, etc. |
| `fill="#FFFFFF"` on frames | Remove fill — frames are transparent by default |
| Fixed pixel width on inner frames | Use `width="fill"` or `width="hug"` |
| No `id` on elements | Add descriptive `id` to every element |
| Spacer frames for spacing | Use `gap` on the parent instead |
| `fontWeight={700}` on slide titles | Use `fontWeight={300}` (light) for brand consistency |
| Missing `layoutMode` on Frame | Always specify `layoutMode="vertical"` or `"horizontal"` |

---

## MCP Workflow

The MCP server is a pure XML-to-Figma bridge. Claude Code writes XML files and sends them via MCP tools.

### Steps

1. **`start_session`** — ensures `design/slides/` and `design/screenshots/` exist, checks Figma connection
2. **Write XML** — save slide XML to `design/slides/{name}.xml` (e.g., `design/slides/problem.xml`)
3. **`apply_slide(file: "design/slides/{name}.xml")`** — validates the XML and renders it in Figma. The slideId is auto-derived from the filename (`problem.xml` → `"problem"`). Returns validation errors inline.
4. **Check validation errors** — look for `text-overflow`, `overlap`, and `out-of-bounds` in the response. Fix these before taking a snapshot.
5. **`get_validation_errors`** — use for detailed per-slide breakdown if needed
6. **`take_snapshot`** — export PNG screenshot for final visual review (only after validation passes). Returns a project-relative path like `design/screenshots/problem-1234567890.png`.
7. **Iterate** — edit XML, then `apply_slide` with same file to update the Figma frame in place

> **Path convention:** Always use project-relative paths (`design/slides/foo.xml`), never absolute. The MCP server resolves them against the project root.

### Validation Error Types

| Error | Meaning | Likely Fix |
|-------|---------|------------|
| `text-overflow` | Text is clipped by its container | Add `width="fill"` to text, or increase container size |
| `out-of-bounds` | Element extends past slide or 110px safe-zone | Reduce content or adjust padding. Intentional for edge footers. |
| `overlap` | Elements overlapping each other | Layout is broken — check auto-layout and gap settings |

---

## Complete Slide Example

A full market-opportunity slide with proper IDs, auto-layout, and design tokens:

```xml
<Slide id="slide-market">
  <Frame id="content" layoutMode="vertical" gap={48} padding={110}
    width={1920} height={1080} fill="#F8F9FB">

    <!-- Title (LIGHT weight 300 for elegant look) -->
    <Text id="title" width="fill" fontFamily="Inter" fontSize={60}
      fontWeight={300} fill="#1D1D1D">
      Market Opportunity
    </Text>

    <!-- Stats row (HORIZONTAL!) -->
    <Frame id="stats-row" layoutMode="horizontal" gap={48} width="fill"
      primaryAxisAlign="space-between">
      <Frame id="stat-tam" layoutMode="vertical" gap={8} width="hug">
        <Text id="stat-tam-value" fontSize={54} fontWeight={400}
          fill="#DC3C44">$127B</Text>
        <Text id="stat-tam-label" fontSize={16}
          fill="#6B7280">Total Addressable Market</Text>
      </Frame>
      <Frame id="stat-sam" layoutMode="vertical" gap={8} width="hug">
        <Text id="stat-sam-value" fontSize={54} fontWeight={400}
          fill="#DC3C44">$34B</Text>
        <Text id="stat-sam-label" fontSize={16}
          fill="#6B7280">Serviceable Market</Text>
      </Frame>
      <Frame id="stat-cagr" layoutMode="vertical" gap={8} width="hug">
        <Text id="stat-cagr-value" fontSize={54} fontWeight={400}
          fill="#DC3C44">23%</Text>
        <Text id="stat-cagr-label" fontSize={16}
          fill="#6B7280">CAGR</Text>
      </Frame>
    </Frame>

    <!-- Two-column content -->
    <Frame id="two-col" layoutMode="horizontal" gap={48} width="fill"
      height="fill">
      <Frame id="col-why-now" layoutMode="vertical" gap={24} width="fill">
        <Text id="why-now-title" width="fill" fontSize={24}
          fontWeight={500}>Why Now?</Text>
        <Text id="why-now-body" width="fill" fontSize={20} fill="#444444">
          Market conditions have shifted dramatically in the past 2 years,
          creating a unique window of opportunity.
        </Text>
      </Frame>
      <Frame id="col-advantage" layoutMode="vertical" gap={24} width="fill">
        <Text id="advantage-title" width="fill" fontSize={24}
          fontWeight={500}>Our Advantage</Text>
        <Text id="advantage-body" width="fill" fontSize={20} fill="#444444">
          First-mover advantage combined with proprietary technology
          gives us an unfair competitive edge.
        </Text>
      </Frame>
    </Frame>
  </Frame>
</Slide>
```
