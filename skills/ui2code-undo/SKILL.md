---
name: ui2code-undo
description: >-
  Undo the last UI refinement made by UI2Code. Triggered when the user wants
  to revert, undo, roll back, or cancel the last UI change.
---

# Undo Last UI Refinement

Revert the source code changes from the most recent UI2Code refinement.

## Workflow

1. **Call `undo_last_refine`** with the user's project directory.

   ```json
   {
     "projectDir": "<user's project directory>"
   }
   ```

2. **Report the result** to the user:
   - If successful: list the reverted files and confirm the undo.
   - If no history: tell the user there are no refinements to undo.
   - If not a git repo: explain that undo requires git.

3. **Refresh the widget** — the user should see the reverted state after the dev server reloads.

## Notes

- Undo reverts only the files changed by the last refinement, not the entire commit.
- Multiple undos will step back through the history one entry at a time.
- After undo, the corresponding history entry is removed.
