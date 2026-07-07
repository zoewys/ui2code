// mcp/lib/widget-resource.mjs — Widget HTML resource registration & serving
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
const WIDGET_HTML_PATH = path.join(PLUGIN_ROOT, "widget", "index.html");
export const WIDGET_URI = "ui://widget/ui2code/refine.html";

let cachedHtml = null;

/**
 * Read and cache the widget HTML from disk.
 * The HTML is self-contained (all CSS/JS inlined) and includes
 * the MCP Apps Bridge protocol for communicating with the server.
 */
export function getWidgetHtml() {
  if (!cachedHtml) {
    cachedHtml = readFileSync(WIDGET_HTML_PATH, "utf8");
  }
  return cachedHtml;
}

/**
 * Handle the render_ui2code_widget tool call.
 * Registers context and returns the widget render instruction.
 */
export function renderWidget({ projectDir, devServerUrl, title }) {
  const resolvedTitle = title || "UI2Code";

  return {
    content: [
      {
        type: "text",
        text: `Rendered the ${resolvedTitle} widget for project at ${projectDir}.${devServerUrl ? ` Dev server: ${devServerUrl}` : ""}`,
      },
    ],
    structuredContent: {
      version: 1,
      widget: "ui2code-refine-widget",
      title: resolvedTitle,
      rendering: "native-widget",
      projectDir: projectDir || null,
      devServerUrl: devServerUrl || null,
    },
    _meta: {
      "openai/outputTemplate": WIDGET_URI,
      "openai/widgetAccessible": true,
    },
  };
}
