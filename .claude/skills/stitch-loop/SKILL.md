---
name: stitch-loop
description: Autonomous multi-page website generation using Stitch with iterative baton-passing loop pattern
allowed-tools:
  - "mcp__pencil__*"
  - "mcp__claude-in-chrome__*"
  - "Read"
  - "Write"
  - "Bash"
globs:
  - ".stitch/**"
  - "**/*.pen"
---

# Stitch Build Loop

You are an **autonomous frontend builder** participating in an iterative site-building loop. Your goal is to generate a page using Stitch, integrate it into the site, and prepare instructions for the next iteration.

## Overview

The Build Loop pattern enables continuous, autonomous website development through a "baton" system. Each iteration:
1. Reads the current task from a baton file (`.stitch/next-prompt.md`)
2. Generates a page using Stitch MCP tools
3. Integrates the page into the site structure
4. Writes the next task to the baton file for the next iteration

## Prerequisites

**Required:**
- Access to the Pencil MCP Server (`mcp__pencil__*`)
- A `.stitch/DESIGN.md` file (generate one using the `design-md` skill if needed)
- A `.stitch/SITE.md` file documenting the site vision and roadmap

**Optional:**
- Chrome DevTools MCP Server — enables visual verification of generated pages

## The Baton System

The `.stitch/next-prompt.md` file acts as a relay baton between iterations:

```markdown
---
page: about
---
A page describing the system overview.

**DESIGN SYSTEM (REQUIRED):**
[Copy from .stitch/DESIGN.md Section 6]

**Page Structure:**
1. Header with navigation
2. Explanation of system functionality
3. Footer with links
```

**Critical rules:**
- The `page` field in YAML frontmatter determines the output filename
- The prompt content must include the design system block from `.stitch/DESIGN.md`
- You MUST update this file before completing your work to continue the loop

## Execution Protocol

### Step 1: Read the Baton
Parse `.stitch/next-prompt.md` to extract page name and prompt content.

### Step 2: Consult Context Files

| File | Purpose |
|------|---------|
| `.stitch/SITE.md` | Site vision, existing pages (sitemap), roadmap |
| `.stitch/DESIGN.md` | Required visual style for Stitch prompts |

### Step 3: Generate with Stitch
Use Pencil MCP tools to generate the page:
1. `get_editor_state` to check current state
2. `batch_design` to generate the screen with enhanced prompt
3. `export_nodes` or `get_screenshot` to retrieve assets

### Step 4: Integrate into Site
1. Save generated assets to `.stitch/designs/{page}.html` and `.stitch/designs/{page}.png`
2. For KiiPS: Convert to JSP using `kiips-page-pattern-guide` patterns
3. Update navigation and cross-page links

### Step 5: Update Site Documentation
Modify `.stitch/SITE.md`:
- Add the new page to Sitemap section with `[x]`
- Remove completed items from Roadmap

### Step 6: Prepare the Next Baton (Critical)
**You MUST update `.stitch/next-prompt.md` before completing.**

## KiiPS Integration

When generating pages for KiiPS:
1. Design in Stitch for visual reference
2. Convert design to JSP following `kiips-page-pattern-guide`
3. Use Bootstrap grid, KiiPS components (RealGrid, search filter, button toolbar)
4. Place JSP in `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/{domain}/`

## File Structure

```
.stitch/
├── metadata.json     # Project & screen IDs
├── DESIGN.md         # Visual design system
├── SITE.md           # Site vision, sitemap, roadmap
├── next-prompt.md    # The baton — current task
└── designs/          # Staging area for Stitch output
    ├── {page}.html
    └── {page}.png
```

## Common Pitfalls

- Forgetting to update `.stitch/next-prompt.md` (breaks the loop)
- Recreating a page that already exists in the sitemap
- Not including the design system block in the prompt
- Leaving placeholder links instead of wiring real navigation
