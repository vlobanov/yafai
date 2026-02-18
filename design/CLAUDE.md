# Yafai Slide Generation

This folder is the single source of truth for generating pitch deck slides in Figma via the Yafai MCP server.

## Quick Start

1. Read **`theme.md`** — colors, typography, spacing values
2. Read **`dsl-reference.md`** — XML syntax, rules, layout patterns, pitfalls
3. Check **`components.md`** — reusable templates for common patterns

## Design Reference Files

- **`theme.md`** — Colors, typography scale, spacing tokens, corner radii, shadows. Values here override code defaults.
- **`components.md`** — Reusable DSL component templates (Slide, Card, StatNumber, BulletList, etc.). Check before building common patterns.
- **`dsl-reference.md`** — Complete DSL syntax reference with property tables, layout patterns, icon usage, pitfalls, and a full slide example.

## MCP Workflow

1. **`start_session`** — ensures working directories exist and checks Figma connection
2. **Write XML** — save slide XML to `design/slides/{name}.xml` (e.g., `design/slides/problem.xml`)
3. **`apply_slide`** — call with `file: "design/slides/{name}.xml"` to validate and render in Figma. The slideId is auto-derived from the filename (`problem.xml` → slideId `"problem"`).
4. **Check validation errors** — look for `text-overflow`, `overlap`, `out-of-bounds` in the response. Fix XML and re-apply before taking a snapshot.
5. **`get_validation_errors`** — for detailed per-slide error breakdown
6. **`take_snapshot`** — export a PNG screenshot for visual review
7. **Read screenshot** — the snapshot is saved to `design/screenshots/{slideId}-{timestamp}.png`. Read the file at the project-relative path returned in the response.
8. **Iterate** — edit the XML file and call `apply_slide` again with the same file to update the Figma frame in place.

## Path Convention

Always use **project-relative paths** like `design/slides/foo.xml` — never absolute paths. The MCP server resolves them against the project root on its side.

## Slide File Naming

Save slides as `design/slides/{slide-name}.xml`:
- `problem.xml`
- `market-opportunity.xml`
- `solution.xml`
- `business-model.xml`
- `traction.xml`
- `team.xml`
- `ask.xml`

The filename (without `.xml`) becomes the slideId used to track and update the slide.

## Updating Slides

Edit the XML file in `design/slides/`, then call `apply_slide(file: "design/slides/{name}.xml")`. Because the slideId is derived from the filename, the existing Figma frame is found and updated in place.

## Updating the Design

- **Colors/typography** — edit `theme.md` directly
- **New reusable patterns** — append to `components.md`
- **DSL rules/examples** — update `dsl-reference.md`

## Screenshots

Saved automatically by the MCP server to `design/screenshots/`. Read them at the project-relative path returned by `take_snapshot`. These are `.gitignore`d — they're ephemeral build artifacts.
