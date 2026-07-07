---
name: ui2code-refine
description: >-
  Refine a selected UI element based on user instruction. Triggered when the
  user describes a visual change they want applied to a selected DOM element,
  such as changing colors, layout, spacing, typography, borders, or HTML
  structure of a specific component.
---

# Refine Selected UI Element

Modify the source code for a selected DOM element based on the user's natural language instruction, then verify the result with screenshot comparison.

## Workflow

### Step 1: Get the selected element

Call `get_ui2code_selection` with the user's project directory to retrieve the currently selected element's:
- `outerHTML` — the rendered HTML
- `context` — CSS selector path (e.g. `div.container > button.btn-primary`)
- `tagName` — element tag
- `computedStyles` — current computed CSS styles
- `classList` — CSS class names
- `id` — element ID (if any)

If no element is selected, ask the user to select one in the UI2Code widget first.

### Step 2: Capture a "before" screenshot

Call `capture_screenshot` with the page URL to get the current state. Save the `imageBase64` for later comparison.

### Step 3: Locate the source file

Using the element's `classList`, `id`, `tagName`, and `context`, search the project source code to find the file that defines this element:
- Search for CSS class names: `grep -rn "className.*btn-primary\|class.*btn-primary" src/ app/ components/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html" --include="*.css" --include="*.scss"`
- Search for element IDs: `grep -rn "id.*elementId" src/ --include="*.tsx" --include="*.jsx"`
- Search for text content if available

### Step 4: Create a safety commit

Before making any changes:
```bash
git add -A && git commit -m "ui2code: checkpoint before refine" --allow-empty
```

### Step 5: Modify the source code

Apply the user's requested change. **CRITICAL SCOPING RULES:**

1. **ONLY modify the selected element's styles and/or HTML structure.**
2. **DO NOT change any element outside the selection.** If the selected element is a button inside a card, only the button changes — the card and everything else must remain identical.
3. **DO NOT modify business logic, event handlers, API calls, or state management.**
4. **Prefer CSS/style changes over structural changes** when the instruction is about visual appearance.
5. **When modifying CSS classes**, ensure changes don't affect other elements using the same class. If needed, create a new class or use more specific selectors.
6. **Keep the element's semantic meaning intact** (don't change a `<button>` to a `<div>`, don't remove accessibility attributes).

### Step 6: Wait for HMR

Wait 3 seconds for Hot Module Replacement to propagate:
```bash
sleep 3
```

### Step 7: Capture "after" screenshot and compare

1. Call `capture_screenshot` with the same URL and viewport.
2. Call `compare_screenshots` with the before and after images.
3. Report the similarity score to the user.

### Step 8: Iterate if needed (max 3 iterations)

If the visual result doesn't match the user's instruction:
1. Analyze the diff image to understand what's wrong.
2. Make additional targeted fixes.
3. Wait for HMR (3 seconds).
4. Capture and compare again.

Stop iterating when:
- The change visually matches the user's instruction, OR
- 3 iterations have been reached (report current state to user).

### Step 9: Commit and record history

```bash
git add -A && git commit -m "ui2code: <brief description of the change>"
```

Report to the user:
- What files were modified
- The before/after similarity score
- A summary of what was changed

## Example Instructions and Expected Actions

| User says | Action |
|-----------|--------|
| "Make it rounded with a blue gradient" | Add `border-radius` and `background: linear-gradient(...)` to the element's CSS |
| "Increase the font size and make it bold" | Modify `font-size` and `font-weight` in the element's styles |
| "Change the layout to horizontal" | Switch from `flex-direction: column` to `row` (or add flexbox) |
| "Add more padding and a subtle shadow" | Add `padding` and `box-shadow` properties |
| "Replace this div with a card component" | Restructure the HTML while keeping content (structural change) |

## Error Handling

- If the source file cannot be found, ask the user which file contains the element.
- If git commit fails (not a git repo), proceed without the safety commit but warn the user.
- If the screenshot capture fails, check if the dev server is still running.
