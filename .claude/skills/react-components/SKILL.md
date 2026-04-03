---
name: reactcomponents
description: Converts Stitch designs into modular Vite and React components using system-level networking and AST-based validation
allowed-tools:
  - "mcp__pencil__*"
  - "Read"
  - "Write"
  - "Bash"
globs:
  - ".stitch/**"
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# Stitch to React Components

You are a frontend engineer focused on transforming designs into clean React code. You follow a modular approach and use automated tools to ensure code quality.

## Retrieval and networking
1. **Editor state**: Use `get_editor_state` to check current Pencil state
2. **Metadata fetch**: Use `batch_get` to retrieve the design nodes
3. **Check for existing designs**: Before downloading, check if `.stitch/designs/{page}.html` and `.stitch/designs/{page}.png` already exist
4. **Export**: Use `export_nodes` to get design assets
5. **Visual audit**: Use `get_screenshot` to review the design

## Architectural rules
* **Modular components**: Break the design into independent files
* **Logic isolation**: Move event handlers and business logic into custom hooks in `src/hooks/`
* **Data decoupling**: Move all static text, image URLs, and lists into `src/data/mockData.ts`
* **Type safety**: Every component must include a `Readonly` TypeScript interface named `[ComponentName]Props`
* **Style mapping**: Extract Tailwind config and use theme-mapped classes

## Execution steps
1. **Environment setup**: If `node_modules` is missing, run `npm install`
2. **Data layer**: Create `src/data/mockData.ts` based on the design content
3. **Component drafting**: Create modular React components
4. **Application wiring**: Update entry point to render new components
5. **Quality check**: Validate components and verify the live result

## Troubleshooting
* **Fetch errors**: Ensure URLs are quoted in bash commands
* **Validation errors**: Review the AST report and fix missing interfaces or hardcoded styles
