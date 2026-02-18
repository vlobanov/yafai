# Component Library

> **Reusable DSL component templates for common slide patterns.**
> Check this file before building common patterns — a template may already exist.
> When you create a reusable component, append it to this file.

---

## Slide

**Description:** Base slide container. Every slide starts with this root frame.

**Parameters:**
- `background` (string, default: `#F8F9FB`) — Background color

**Template:**
```xml
<Frame id="slide-{name}" width={1920} height={1080} fill="#F8F9FB"
  layoutMode="vertical"
  paddingTop={110} paddingLeft={110} paddingRight={110} paddingBottom={110}
  gap={48}>
  <!-- Slide content here -->
</Frame>
```

**Usage example:**
```xml
<Frame id="slide-market" width={1920} height={1080} fill="#F8F9FB"
  layoutMode="vertical"
  paddingTop={110} paddingLeft={110} paddingRight={110} paddingBottom={110}
  gap={48}>
  <Text id="title" width="fill" fontSize={60} fontWeight={300} fill="#1D1D1D">
    Market Opportunity
  </Text>
  <!-- ... content ... -->
</Frame>
```

**Guidelines:**
- Always use `layoutMode="vertical"` on root frame
- Use asymmetric padding via `paddingTop/Right/Bottom/Left` when needed (e.g., more top padding for title positioning)
- `fill="#F8F9FB"` is the standard background — do NOT use `#FFFFFF`
- Fixed `width={1920} height={1080}` only on the root frame

---

## SlideTitle

**Description:** Main slide heading with elegant light weight.

**Parameters:**
- `text` (string, required) — Title text
- `color` (string, default: `#1D1D1D`) — Text color

**Template:**
```xml
<Text id="title" width="fill" fontFamily="Inter" fontSize={60} fontWeight={300}
  fill="#1D1D1D">{text}</Text>
```

**Guidelines:**
- **Always use fontWeight={300}** (light) — this is a key brand element
- Use `width="fill"` so long titles wrap properly
- Place as the first child in the root frame

---

## Card

**Description:** Padded content container with visible background and rounded corners.

**Parameters:**
- `background` (string, default: `#F8F8F8`) — Card fill color
- `cornerRadius` (number, default: `16`) — Border radius
- `padding` (number, default: `24`) — Internal padding

**Template:**
```xml
<Frame id="card-{name}" layoutMode="vertical" gap={16}
  padding={24} fill="#F8F8F8" cornerRadius={16}
  width="fill">
  <!-- Card content here -->
</Frame>
```

**Usage example:**
```xml
<Frame id="card-problem" layoutMode="vertical" gap={16}
  padding={24} fill="#F8F8F8" cornerRadius={16}
  width="fill">
  <Text id="card-problem-title" width="fill" fontSize={20} fontWeight={500}>
    The Problem
  </Text>
  <Text id="card-problem-body" width="fill" fontSize={16} fill="#444444">
    Teams waste 40% of their time on manual data entry.
  </Text>
</Frame>
```

**Guidelines:**
- Use `width="fill"` for cards in a row (equal distribution)
- Use `width="hug"` for cards that size to content
- Only apply `fill` on intentional containers — most inner frames should be transparent
- Pair `cornerRadius` with `clipsContent={true}` when children might overflow

---

## StatNumber

**Description:** Large metric value with a descriptive label, displayed vertically.

**Parameters:**
- `value` (string, required) — The big number (e.g., "$127B", "10M+")
- `label` (string, required) — Metric description

**Template:**
```xml
<Frame id="stat-{name}" layoutMode="vertical" gap={8} width="hug">
  <Text id="stat-{name}-value" fontSize={54} fontWeight={400} fill="#DC3C44">
    {value}
  </Text>
  <Text id="stat-{name}-label" fontSize={16} fill="#6B7280">
    {label}
  </Text>
</Frame>
```

**Usage example (stats row):**
```xml
<Frame id="stats-row" layoutMode="horizontal" gap={48} width="fill"
  primaryAxisAlign="space-between">
  <Frame id="stat-tam" layoutMode="vertical" gap={8} width="hug">
    <Text id="stat-tam-value" fontSize={54} fontWeight={400} fill="#DC3C44">$127B</Text>
    <Text id="stat-tam-label" fontSize={16} fill="#6B7280">Total Addressable Market</Text>
  </Frame>
  <Frame id="stat-sam" layoutMode="vertical" gap={8} width="hug">
    <Text id="stat-sam-value" fontSize={54} fontWeight={400} fill="#DC3C44">$34B</Text>
    <Text id="stat-sam-label" fontSize={16} fill="#6B7280">Serviceable Market</Text>
  </Frame>
  <Frame id="stat-cagr" layoutMode="vertical" gap={8} width="hug">
    <Text id="stat-cagr-value" fontSize={54} fontWeight={400} fill="#DC3C44">23%</Text>
    <Text id="stat-cagr-label" fontSize={16} fill="#6B7280">CAGR</Text>
  </Frame>
</Frame>
```

**Guidelines:**
- Stat value uses accent color (`#DC3C44`) by default
- Stat label uses tertiary color (`#6B7280`)
- Wrap multiple stats in a horizontal frame with `gap={48}` and `primaryAxisAlign="space-between"`
- Use `width="hug"` on individual stat frames, `width="fill"` on the row

---

## BulletList

**Description:** Styled list items with checkmark icons.

**Parameters:**
- `items` (string[], required) — List of text items

**Template:**
```xml
<Frame id="list-{name}" layoutMode="vertical" gap={16} width="fill">
  <Frame id="list-{name}-item-1" layoutMode="horizontal" gap={12}
    counterAxisAlign="center" width="fill">
    <Text fontFamily="Helvetica" fontSize={20} fontWeight={700}
      fill="#2A9D8F">&#x2713;</Text>
    <Text id="list-{name}-item-1-text" width="fill" fontSize={20}
      fill="#444444">{item text}</Text>
  </Frame>
  <!-- more items -->
</Frame>
```

**Usage example:**
```xml
<Frame id="benefits-list" layoutMode="vertical" gap={16} width="fill">
  <Frame id="benefit-1" layoutMode="horizontal" gap={12}
    counterAxisAlign="center" width="fill">
    <Text fontFamily="Helvetica" fontSize={20} fontWeight={700}
      fill="#2A9D8F">&#x2713;</Text>
    <Text id="benefit-1-text" width="fill" fontSize={20}
      fill="#444444">Save 40% on operational costs</Text>
  </Frame>
  <Frame id="benefit-2" layoutMode="horizontal" gap={12}
    counterAxisAlign="center" width="fill">
    <Text fontFamily="Helvetica" fontSize={20} fontWeight={700}
      fill="#2A9D8F">&#x2713;</Text>
    <Text id="benefit-2-text" width="fill" fontSize={20}
      fill="#444444">Deploy in under 5 minutes</Text>
  </Frame>
</Frame>
```

**Guidelines:**
- Checkmark uses Helvetica font, success color (`#2A9D8F`)
- Item text uses secondary color (`#444444`)
- Use `width="fill"` on each item row and on the text so it wraps
- For icon-based lists, prefer `<Icon name="check-circle">` over text checkmarks

---

## Icon Feature Row

**Description:** Horizontal row with a Lucide icon and descriptive text.

**Template:**
```xml
<Frame id="feature-{name}" layoutMode="horizontal" gap={16}
  counterAxisAlign="center" width="fill">
  <Icon id="feature-{name}-icon" name="{icon-name}" size={24} color="#DC3C44" />
  <Text id="feature-{name}-text" width="fill" fontSize={20}
    fill="#444444">{description}</Text>
</Frame>
```

**Guidelines:**
- Always search for icon names with `search_icons` first — don't guess
- Use `counterAxisAlign="center"` to vertically center icon with text
- Icon color typically matches accent or success color

---

## Two-Column Layout

**Description:** Side-by-side content columns for comparison, problem/solution, etc.

**Template:**
```xml
<Frame id="columns" layoutMode="horizontal" gap={48} width="fill" height="fill">
  <Frame id="col-left" layoutMode="vertical" gap={24} width="fill">
    <Text id="col-left-title" width="fill" fontSize={24} fontWeight={500}>
      Left Column Title
    </Text>
    <Text id="col-left-body" width="fill" fontSize={20} fill="#444444">
      Content for the left column.
    </Text>
  </Frame>
  <Frame id="col-right" layoutMode="vertical" gap={24} width="fill">
    <Text id="col-right-title" width="fill" fontSize={24} fontWeight={500}>
      Right Column Title
    </Text>
    <Text id="col-right-body" width="fill" fontSize={20} fill="#444444">
      Content for the right column.
    </Text>
  </Frame>
</Frame>
```

**Guidelines:**
- Both columns use `width="fill"` for equal distribution
- Use `height="fill"` on the container to use remaining vertical space
- Works for 2 or 3 columns — just add more child frames with `width="fill"`

---

## Card Grid

**Description:** Row of equal-width cards for features, team members, pricing tiers, etc.

**Template:**
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

**Guidelines:**
- All cards use `width="fill"` for equal widths
- 3 cards per row is ideal; 4 works for compact content
- Add icons at the top of cards for visual interest: `<Icon name="..." size={32} color="#2563EB" />`
