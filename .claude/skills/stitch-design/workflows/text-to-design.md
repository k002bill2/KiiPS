# Workflow: Text-to-Design

Transform a text description into a high-fidelity design screen.

## Steps

### 1. Enhance the User Prompt
Before calling the Stitch MCP tool, apply the "Prompt Enhancement Pipeline".
- Identify the platform (Web/Mobile) and page type.
- Incorporate any existing project design system from `.stitch/DESIGN.md`.
- Use specific Design Mappings and Prompting Keywords.

### 2. Identify the Project
Use `get_editor_state` to check current state, or `open_document` to start fresh.

### 3. Generate the Screen
Use Pencil MCP `batch_design` with the enhanced prompt.

### 4. Present AI Feedback
Always show the text description and suggestions to the user.

### 5. Download Design Assets
After generation, export screenshots and HTML to `.stitch/designs/` directory.

### 6. Review and Refine
- If the result is not exactly as expected, use the edit-design workflow.
- Do NOT re-generate from scratch unless the fundamental layout is wrong.

## Tips
- **Be structural**: Break the page into header, content areas, and footer.
- **Specify colors**: Use hex codes for precision.
- **Set the tone**: Explicitly mention if the design should be minimal, professional, or vibrant.
