---
name: ui2code-open
description: >-
  Open the UI2Code widget for visual UI refinement. Triggered when the user
  asks to open, launch, start, or view the UI2Code tool, or wants to begin
  refining UI elements on a web page.
---

# Open UI2Code Widget

Open the native UI2Code widget so the developer can visually select and refine UI elements.

## Workflow

1. **Determine the dev server URL.**
   Ask the user for their dev server URL if not already known (common defaults: `http://localhost:3000`, `http://localhost:5173`, `http://localhost:8080`). Check if the dev server is running.

2. **Call the `render_ui2code_widget` MCP tool** to render the widget as a native Codex widget.

   ```json
   {
     "projectDir": "<absolute path to the user's Codex workspace>",
     "devServerUrl": "<dev server URL>",
     "title": "UI2Code"
   }
   ```

   Use the user's active Codex workspace path as `projectDir`, **not** the UI2Code plugin directory.

3. **Confirm the widget opens.** The widget will display a screenshot of the dev server page.

## Constraints

- Do NOT start any local servers or build processes for the UI2Code plugin itself.
- Do NOT inspect or modify the widget's source files.
- If the MCP tool is unavailable, suggest the user start a new Codex conversation to reload the plugin's MCP tools.
