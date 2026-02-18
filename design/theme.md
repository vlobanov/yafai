# Design Theme

> **This file is the single source of truth for visual design values.**
> Read it before generating any slide. When the user asks to change design properties
> (e.g., "change the accent color to blue"), edit the values here directly.
> Values in this file override hardcoded defaults from `tokens.ts`.

---

## Canvas

| Property   | Value |
|------------|-------|
| Width      | 1920px |
| Height     | 1080px |
| Aspect ratio | 16:9 |
| Background | `#F8F9FB` (off-white) |

## Safe Zones

| Property       | Value | Notes |
|----------------|-------|-------|
| Margin         | 110px | From all edges |
| Header Y       | 80px  | Slide title/header position |
| Content start Y | 228px | Where main content begins |
| Content width  | 1700px | 1920 - 110*2 |
| Content height | 742px  | 1080 - 228 - 110 |

---

## Colors

### Core Text

| Name       | Value     | Usage                    |
|------------|-----------|--------------------------|
| Primary    | `#1D1D1D` | Main text, headings      |
| PrimaryAlt | `#1A1A2E` | Alternate primary (dark blue-black) |
| Secondary  | `#444444` | Body text, list items    |
| Tertiary   | `#6B7280` | Supporting text, labels  |
| Muted      | `#999999` | Placeholders, light labels |
| Subtle     | `#9CA3AF` | Very light text          |

### Brand & Accent

| Name       | Value     | Usage                    |
|------------|-----------|--------------------------|
| Accent     | `#DC3C44` | Primary brand red — stat numbers, emphasis |
| AccentBlue | `#2563EB` | Blue accent — CTAs, highlights |

### Semantic

| Name    | Value     | Usage                    |
|---------|-----------|--------------------------|
| Success | `#2A9D8F` | Checkmarks, positive indicators |
| Warning | `#F59E0B` | Amber warnings           |
| Error   | `#EF4444` | Red errors (not brand red) |
| Info    | `#3B82F6` | Blue informational       |

### Surfaces

| Name            | Value     | Usage                    |
|-----------------|-----------|--------------------------|
| Background      | `#F8F9FB` | Slide background (off-white) |
| BackgroundWhite | `#FFFFFF` | Pure white               |
| Surface         | `#F8F8F8` | Cards, containers        |
| SurfaceAlt      | `#F1F5F9` | Alternate surface        |

### Borders

| Name        | Value     | Usage                    |
|-------------|-----------|--------------------------|
| Border      | `#E8E8E8` | Card borders, dividers   |
| BorderLight | `#F1F5F9` | Light borders            |

### Special

| Name    | Value     |
|---------|-----------|
| Black   | `#000000` |
| White   | `#FFFFFF` |

---

## Typography

**Font family:** Inter (primary), Helvetica (symbols/checkmarks)

### Type Scale

| Style          | Size | Weight | Line Height | Letter Spacing | Notes |
|----------------|------|--------|-------------|----------------|-------|
| Hero           | 84px | 700    | 1.21        | 0              | Cover slide title, bold |
| Display        | 72px | 300    | 1.43        | -1.7%          | Slide titles — **LIGHT weight!** |
| H1             | 56px | 500    | 1.2         | 0              | Scaled/responsive titles |
| H2             | 30px | 500    | 1.5         | 0              | Section headings, card titles |
| H3             | 30px | 300    | 1.31        | 0              | Subheadings (light weight) |
| Stat           | 68px | 400    | 1.0         | 0              | Large metric numbers |
| Stat Suffix    | 34px | 300    | 1.0         | 0              | Stat unit suffixes (M, B+, %) |
| Stat Label     | 19px | 400    | 1.33        | 0              | Metric descriptions |
| Body Large     | 24px | 400    | 1.35        | 0              | Primary body text |
| Body Large Med | 24px | 500    | 1.35        | 0              | Emphasized body text |
| Body           | 20px | 400    | 1.55        | 0              | Regular body text |
| Body Semibold  | 22px | 600    | 1.5         | 0              | Bold body text |
| Body Small     | 19px | 400    | 1.4         | 0              | Smaller body text |
| Caption        | 16px | 400    | 1.5         | 0              | Footnotes, small text |
| Overline       | 16px | 600    | 1.5         | +16%           | UPPERCASE section labels |
| Overline Light | 16px | 300    | 1.5         | +16%           | UPPERCASE light variant |
| Tag            | 14px | 400    | 1.5         | +5%            | Small metadata tags |
| Citation       | 13px | 400    | 1.5         | 0              | Source citations, light grey |
| Table Header   | 13px | 600    | 1.5         | +12%           | UPPERCASE table column headers |
| Table Body     | 17px | 400    | 1.43        | 0              | Table cell text |
| Table Name     | 22px | 700    | 1.3         | 0              | Table row platform names |
| Table Symbol   | 28px | 700    | 1.0         | 0              | ✓/✕/~ check/cross marks |
| Footer         | 13px | 400    | 1.5         | 0              | Footer text, page numbers |
| Checkmark      | 24px | 700    | 1.5         | 0              | Uses Helvetica font |

---

## Spacing

**Base unit:** 8px — all spacing should be multiples of 8.

### Allowed Values

`4, 8, 12, 16, 20, 24, 32, 48, 64, 80, 96, 110, 120`

### Named Shortcuts

| Name | Value |
|------|-------|
| xs   | 4px   |
| sm   | 8px   |
| md   | 16px  |
| lg   | 24px  |
| xl   | 32px  |
| 2xl  | 48px  |
| 3xl  | 64px  |
| 4xl  | 80px  |
| 5xl  | 96px  |
| 6xl  | 110px |

---

## Corner Radius

| Name | Value |
|------|-------|
| none | 0     |
| sm   | 4     |
| md   | 8     |
| lg   | 12    |
| xl   | 16    |
| 2xl  | 24    |
| full | 9999  |

---

## Shadows

| Name | Offset  | Blur | Opacity |
|------|---------|------|---------|
| sm   | 0, 1    | 2    | 5%      |
| md   | 0, 4    | 6    | 10%     |
| lg   | 0, 10   | 15   | 10%     |
| xl   | 0, 20   | 25   | 15%     |

---

## Strokes

| Style       | Color     | Weight | Position | Usage |
|-------------|-----------|--------|----------|-------|
| Divider     | `#E8E8E8` | 2px    | bottom   | Card section dividers |
| Accent Left | `#DC3C44` | 6px    | left     | Callout left accent border |
