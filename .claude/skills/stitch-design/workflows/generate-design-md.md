# Workflow: Generate DESIGN.md

Create a design system documentation file from an existing Stitch project.

## Steps

### 1. Retrieve Project Data
Use Pencil MCP tools to gather project data:
- `get_editor_state` - current state
- `batch_get` - find representative screens
- `get_variables` - extract design tokens
- `get_screenshot` - capture visual reference

### 2. Analyze Design Elements
Extract five core elements:
- **Project Identity** — Title and ID
- **Atmosphere** — Mood descriptors reflecting the aesthetic
- **Color Palette** — Hex codes with functional purposes
- **Geometry & Shape** — Physical descriptions of roundness, spacing
- **Depth & Elevation** — Shadow treatment and layering

### 3. Write DESIGN.md
Generate `.stitch/DESIGN.md` with these sections:

```markdown
# Design System: [Project Name]

## 1. Visual Theme & Atmosphere
[Evocative mood description]

## 2. Color Palette & Roles
| Color | Hex | Role |
|-------|-----|------|
| Primary | #xxx | Buttons, links |
| Background | #xxx | Page canvas |

## 3. Typography Rules
- Headings: [font, weight, size]
- Body: [font, weight, size]

## 4. Component Styles
- Buttons: [roundness, shadow, hover]
- Cards: [border, shadow, padding]
- Inputs: [border, focus state]

## 5. Layout Principles
- Grid: [columns, gutter]
- Spacing: [base unit]

## 6. Design System Notes for Stitch Generation
[Copy this section into every Stitch prompt]
```

### 4. Verify
Read back the generated file to ensure completeness and accuracy.
