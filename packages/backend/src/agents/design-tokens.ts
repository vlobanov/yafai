export const designTokens = `
### Canvas
- Width: 1920px
- Height: 1080px

### Layout Rules (CRITICAL)

**Auto-Layout:**
- ALWAYS use layoutMode="vertical" OR "horizontal" on Frames
- NEVER use x/y absolute positioning
- Use BOTH directions - not everything is vertical!

**Sizing (IMPORTANT - avoid clipping):**
- Text: ALWAYS use width="fill" so text wraps properly
- Containers: Use width="hug" / height="hug" to size to content
- Flexible elements: Use width="fill" or layoutGrow={1}
- AVOID fixed widths like width={100} unless truly needed

**Common Patterns:**
| Pattern | Properties |
|---------|------------|
| Text in container | width="fill" (lets text wrap) |
| Stats row | layoutMode="horizontal", gap={48} |
| Card grid | layoutMode="horizontal", children with width="fill" |
| Content columns | layoutMode="horizontal", children with width="fill" |
| Hug-sized card | width="hug", height="hug", padding={24} |
| Fill-width card | width="fill", padding={24} |

### Typography (Inter font - NOTE: Display uses LIGHT weight!)
| Style     | Size | Weight | Notes |
|-----------|------|--------|-------|
| Hero      | 72px | 700    | Cover slide title |
| Display   | 60px | 300    | Slide titles (LIGHT weight!) |
| H1        | 46px | 500    | Scaled titles |
| H2        | 24px | 500    | Section headings |
| H3        | 24px | 300    | Subheadings (light) |
| Stat      | 54px | 400    | Big numbers |
| BodyLarge | 20px | 400    | Primary body text |
| Body      | 16px | 400    | Regular text |
| Caption   | 13px | 400    | Footnotes |
| Overline  | 12px | 500    | UPPERCASE labels (+20% letter-spacing) |

### Colors
| Name       | Value   | Usage              |
|------------|---------|-------------------|
| Primary    | #1D1D1D | Main text, headings |
| Secondary  | #444444 | Body text, lists   |
| Tertiary   | #6B7280 | Supporting text    |
| Muted      | #999999 | Labels             |
| Accent     | #DC3C44 | Brand red          |
| AccentBlue | #2563EB | Blue highlights    |
| Success    | #2A9D8F | Checkmarks         |
| Background | #F8F9FB | Slide background   |
| Surface    | #F8F8F8 | Cards, containers  |
| Border     | #E8E8E8 | Dividers           |

### Spacing
- Base unit: 8px
- Common values: 8, 12, 16, 20, 24, 32, 48, 64, 80, 110
- Slide margin: 110px
`;

export const designTokensObject = {
  canvas: {
    width: 1920,
    height: 1080,
  },
  safeZones: {
    margin: 110,
    headerY: 80,
    contentStartY: 228,
  },
  typography: {
    fontFamily: 'Inter',
    fontFamilyAlt: 'Helvetica',
    scale: {
      hero: { size: 72, weight: 700, lineHeight: 1.21 },
      display: { size: 60, weight: 300, lineHeight: 1.43, letterSpacing: -0.017 },
      h1: { size: 46, weight: 500, lineHeight: 1.2 },
      h2: { size: 24, weight: 500, lineHeight: 1.5 },
      h3: { size: 24, weight: 300, lineHeight: 1.31 },
      stat: { size: 54, weight: 400, lineHeight: 1.0 },
      statLabel: { size: 23, weight: 400, lineHeight: 1.0 },
      bodyLarge: { size: 20, weight: 400, lineHeight: 1.35 },
      body: { size: 16, weight: 400, lineHeight: 1.55 },
      caption: { size: 13, weight: 400, lineHeight: 1.5 },
      overline: { size: 12, weight: 500, lineHeight: 1.5, letterSpacing: 0.2, textTransform: 'uppercase' },
    },
  },
  colors: {
    primary: '#1D1D1D',
    primaryAlt: '#1A1A2E',
    secondary: '#444444',
    tertiary: '#6B7280',
    muted: '#999999',
    accent: '#DC3C44',
    accentBlue: '#2563EB',
    success: '#2A9D8F',
    background: '#F8F9FB',
    backgroundWhite: '#FFFFFF',
    surface: '#F8F8F8',
    border: '#E8E8E8',
  },
  spacing: {
    unit: 8,
    allowed: [8, 12, 16, 20, 24, 32, 48, 64, 80, 96, 110, 120],
  },
} as const;
