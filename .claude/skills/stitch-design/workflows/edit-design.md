# Workflow: Edit-Design

Make targeted changes to an already generated design.

## Steps

### 1. Identify the Screen
Use `get_editor_state` or `batch_get` to find the current design state.

### 2. Formulate the Edit Prompt
Be specific about the changes:
- **Location**: "Change the color of the [primary button] in the [hero section]..."
- **Visuals**: "...to a darker blue (#004080) and add a subtle shadow."
- **Structure**: "Add a secondary button next to the primary one with the text 'Learn More'."

### 3. Apply the Edit
Use Pencil MCP `batch_design` with targeted edit operations.

### 4. Present AI Feedback
Always show the text description and suggestions to the user.

### 5. Download Updated Assets
Export updated screenshots to `.stitch/designs/`, overwriting previous versions.

### 6. Verify and Repeat
- Check the output to see if the changes were applied correctly.
- If more polish is needed, repeat with a new specific prompt.

## Tips
- **Keep it focused**: One edit at a time.
- **Reference components**: Use professional terms like "navigation bar", "hero section", "card grid".
- **Mention colors**: Use hex codes for precise color matching.
