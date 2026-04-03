# Stitch MCP Tool Schemas (Pencil)

Use these examples to format your tool calls to the Stitch/Pencil MCP server correctly.

> **Note**: In KiiPS project, Stitch MCP is available as `mcp__pencil__*` tools.

---

## Project & Editor Management

### `get_editor_state`
Get current editor state - active file, selection, context.
```json
// No parameters needed
{}
```

### `open_document`
Open a .pen file or create a new one.
```json
{
  "filePathOrNew": "new"  // or path to existing .pen file
}
```

---

## Design Operations

### `batch_design`
Create or modify designs in .pen files.
```json
{
  "operations": [
    {
      "type": "create",
      "prompt": "A modern dashboard with sidebar navigation and data cards"
    }
  ]
}
```

### `batch_get`
Retrieve nodes by patterns or IDs.
```json
{
  "patterns": ["**/header*"],
  "nodeIds": ["node-id-1"]
}
```

---

## Style & Guidelines

### `get_guidelines`
Get design guidelines for a specific topic.
```json
{
  "topic": "web-app"  // Options: code, table, tailwind, landing-page, slides, design-system, mobile-app, web-app
}
```

### `get_style_guide_tags`
Get available tags for style guide queries.

### `get_style_guide`
Get a style guide by tags or name.
```json
{
  "tags": ["modern", "dashboard"],
  "name": "corporate-clean"
}
```

---

## Export & Screenshots

### `export_nodes`
Export design nodes to files.

### `get_screenshot`
Capture screenshot of current design.

### `get_variables`
Get design variables/tokens.

### `set_variables`
Set design variables/tokens.
