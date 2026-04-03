---
name: design-md
description: Automated design system documentation generation from Stitch/Pencil projects into DESIGN.md files
allowed-tools:
  - "mcp__pencil__*"
  - "Read"
  - "Write"
globs:
  - ".stitch/**"
  - "**/*.pen"
---

# Design System Analysis & DESIGN.md Generation

This skill enables you to synthesize semantic design systems from Stitch/Pencil projects into `DESIGN.md` files that serve as definitive sources for generating aligned screens.

## Workflow

### 1. Discovery & Retrieval

Use Pencil MCP tools to gather project data:
1. `get_editor_state` — Check current editor state
2. `batch_get` — Find representative screens/nodes
3. `get_variables` — Extract design tokens
4. `get_screenshot` — Capture visual reference
5. `get_style_guide` — Get existing style guidelines

### 2. Analysis Framework

Extract five core elements from the project:

| Element | What to Extract |
|---------|----------------|
| **Project Identity** | Title, purpose, target audience |
| **Atmosphere** | Evocative mood descriptors (e.g., "clean and professional") |
| **Color Palette** | Natural language names + hex codes + functional purposes |
| **Geometry & Shape** | Physical descriptions (e.g., "pill-shaped" for rounded-full) |
| **Depth & Elevation** | Shadow treatment and layering approach |

### 3. Output Format

Generate `.stitch/DESIGN.md` with this structure:

```markdown
# Design System: [Project Name]

## 1. Visual Theme & Atmosphere
[Evocative mood description — 2-3 sentences]

## 2. Color Palette & Roles
| Color Name | Hex | Role |
|------------|-----|------|
| Primary Blue | #2563eb | Buttons, links, active states |
| Background | #ffffff | Page canvas |
| Surface | #f9fafb | Cards, panels |
| Text Primary | #111827 | Headings, body text |
| Text Secondary | #6b7280 | Labels, captions |
| Success | #10b981 | Positive indicators |
| Error | #ef4444 | Validation errors |

## 3. Typography Rules
- Headings: [font-family], [weight], [sizes]
- Body: [font-family], [weight], [line-height]
- Captions: [font-family], [weight], [size]

## 4. Component Styles
- Buttons: [roundness, padding, shadow, hover]
- Cards: [border, shadow, padding, roundness]
- Inputs: [border, focus state, padding]
- Tables: [header style, row hover, borders]

## 5. Layout Principles
- Grid: [system, columns, gutter]
- Spacing: [base unit, scale]
- Breakpoints: [mobile, tablet, desktop]

## 6. Design System Notes for Stitch Generation
**Copy this entire section into every Stitch prompt:**

- Platform: Web, Desktop-first
- Theme: [Light/Dark]
- Background: [description] (#hex)
- Primary: [description] (#hex)
- Text: [description] (#hex)
- Buttons: [roundness], [shadow]
- Cards: [roundness], [shadow]
```

### 4. KiiPS Default Design System

For KiiPS projects without an existing design system:

```markdown
# KiiPS Design System

## Color Palette
| Color | Hex | Role |
|-------|-----|------|
| Primary Dark | #2c3e50 | Headers, navigation |
| Primary Blue | #3498db | Links, active buttons |
| Success | #27ae60 | Positive status |
| Warning | #f39c12 | Warnings |
| Danger | #e74c3c | Errors, delete buttons |
| Background | #f5f6fa | Page background |
| Surface | #ffffff | Cards, panels |
| Text Primary | #2c3e50 | Headings |
| Text Secondary | #7f8c8d | Labels |
| Border | #dcdde1 | Dividers, borders |

## Typography
- Headings: Noto Sans KR, Bold
- Body: Noto Sans KR, Regular, 14px
- Grid: Noto Sans KR, Regular, 13px

## Components
- Buttons: 4px radius, 8px 16px padding
- Cards: 4px radius, 1px border #dcdde1
- Inputs: 4px radius, 1px border, blue focus glow
- Tables: RealGrid 2.6.3 with zebra striping
```

## Critical Success Factors

- Prioritize descriptive language over technical jargon
- Include functional context for every color
- Maintain consistent terminology throughout
- The resulting DESIGN.md becomes the reference for all future Stitch generations
