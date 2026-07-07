/**
 * UI2Code MCP Server
 *
 * Raw JSON-RPC 2.0 stdio server — no SDK dependency.
 * Uses readline on stdin, writes JSON + newline to stdout.
 * All debug/log output goes to stderr only.
 */

import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Widget resource URI
// ---------------------------------------------------------------------------
const WIDGET_URI = "ui://widget/ui2code/refine.html";

// ---------------------------------------------------------------------------
// JSON-RPC transport (stdio, line-delimited)
// ---------------------------------------------------------------------------

function send(message) {
  process.stdout.write(JSON.stringify(message) + "\n");
}

function sendResult(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

// Server-initiated requests with promise tracking
let nextRequestId = 1;
const pendingRequests = new Map();

function request(method, params) {
  const id = `server-${nextRequestId++}`;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    send({ jsonrpc: "2.0", id, method, params });
  });
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "render_ui2code_widget",
    title: "Open UI2Code Widget",
    description: "Open the UI2Code widget for interactive UI refinement.",
    inputSchema: {
      type: "object",
      properties: {
        projectDir: {
          type: "string",
          description: "Absolute path to the project directory.",
        },
        devServerUrl: {
          type: "string",
          description: "Optional dev server URL to preview.",
        },
        title: {
          type: "string",
          description: "Optional title for the widget.",
        },
      },
      required: ["projectDir"],
    },
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  {
    name: "capture_screenshot",
    title: "Capture Screenshot",
    description: "Capture a screenshot of a URL using a headless browser.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL to capture.",
        },
        viewportWidth: {
          type: "integer",
          description: "Viewport width in pixels (default 1280).",
        },
        viewportHeight: {
          type: "integer",
          description: "Viewport height in pixels (default 800).",
        },
      },
      required: ["url"],
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: "identify_element_at_point",
    title: "Identify Element at Point",
    description:
      "Identify the DOM element at the given coordinates on a page.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL of the page.",
        },
        x: {
          type: "number",
          description: "X coordinate.",
        },
        y: {
          type: "number",
          description: "Y coordinate.",
        },
        viewportWidth: {
          type: "integer",
          description: "Viewport width in pixels.",
        },
        viewportHeight: {
          type: "integer",
          description: "Viewport height in pixels.",
        },
      },
      required: ["url", "x", "y"],
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: "save_ui2code_selection",
    title: "Save Element Selection",
    description: "Save the current element selection state for a project.",
    inputSchema: {
      type: "object",
      properties: {
        projectDir: {
          type: "string",
          description: "Absolute path to the project directory.",
        },
        selection: {
          type: "object",
          description: "The selection state object to save.",
        },
      },
      required: ["projectDir", "selection"],
    },
    annotations: {
      readOnlyHint: false,
    },
  },
  {
    name: "get_ui2code_selection",
    title: "Get Element Selection",
    description: "Get the current element selection state for a project.",
    inputSchema: {
      type: "object",
      properties: {
        projectDir: {
          type: "string",
          description: "Absolute path to the project directory.",
        },
      },
      required: ["projectDir"],
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: "compare_screenshots",
    title: "Compare Screenshots",
    description: "Compare two screenshots pixel-by-pixel and return the diff.",
    inputSchema: {
      type: "object",
      properties: {
        beforeBase64: {
          type: "string",
          description: "Base64-encoded PNG of the before screenshot.",
        },
        afterBase64: {
          type: "string",
          description: "Base64-encoded PNG of the after screenshot.",
        },
        threshold: {
          type: "number",
          description:
            "Matching threshold between 0 and 1 (default 0.1). Smaller is more sensitive.",
        },
      },
      required: ["beforeBase64", "afterBase64"],
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: "get_refine_history",
    title: "Get Refinement History",
    description: "Get the modification history for a project.",
    inputSchema: {
      type: "object",
      properties: {
        projectDir: {
          type: "string",
          description: "Absolute path to the project directory.",
        },
      },
      required: ["projectDir"],
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: "undo_last_refine",
    title: "Undo Last Refinement",
    description: "Undo the last AI modification for a project.",
    inputSchema: {
      type: "object",
      properties: {
        projectDir: {
          type: "string",
          description: "Absolute path to the project directory.",
        },
      },
      required: ["projectDir"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
  },
];

// ---------------------------------------------------------------------------
// Tool call dispatch
// ---------------------------------------------------------------------------

async function handleToolCall(name, args) {
  switch (name) {
    case "render_ui2code_widget": {
      const { renderWidget } = await import("./lib/widget-resource.mjs");
      const result = await renderWidget(args);
      return {
        content: result.content,
        structuredContent: result.structuredContent,
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
          "openai/widgetAccessible": true,
        },
      };
    }

    case "capture_screenshot": {
      const { captureScreenshot } = await import("./lib/screenshot.mjs");
      return captureScreenshot(args);
    }

    case "identify_element_at_point": {
      const { identifyElementAtPoint } = await import("./lib/screenshot.mjs");
      return identifyElementAtPoint(args);
    }

    case "save_ui2code_selection": {
      const { saveSelection } = await import("./lib/project.mjs");
      return saveSelection(args);
    }

    case "get_ui2code_selection": {
      const { getSelection } = await import("./lib/project.mjs");
      return getSelection(args);
    }

    case "compare_screenshots": {
      const { compareScreenshots } = await import("./lib/compare.mjs");
      return compareScreenshots(args);
    }

    case "get_refine_history": {
      const { getRefineHistory } = await import("./lib/history.mjs");
      return getRefineHistory(args);
    }

    case "undo_last_refine": {
      const { undoLastRefine } = await import("./lib/history.mjs");
      return undoLastRefine(args);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

async function handleRequest(id, method, params) {
  switch (method) {
    // ----- lifecycle -----
    case "initialize":
      return sendResult(id, {
        protocolVersion: "2025-11-25",
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: "UI2Code MCP", version: "0.1.0" },
        instructions:
          "Use render_ui2code_widget to open the UI refinement widget. " +
          "Use capture_screenshot, identify_element_at_point, compare_screenshots for visual analysis. " +
          "Use get/save_ui2code_selection for element state. " +
          "Use get_refine_history and undo_last_refine for history management.",
      });

    case "ping":
      return sendResult(id, {});

    case "notifications/initialized":
      // Notification — no response needed (no id expected, but be safe)
      return;

    // ----- tools -----
    case "tools/list":
      return sendResult(id, { tools: TOOLS });

    case "tools/call": {
      const toolName = params?.name;
      const toolArgs = params?.arguments ?? {};

      if (!toolName) {
        return sendError(id, -32602, "Missing tool name in params.name");
      }

      try {
        const result = await handleToolCall(toolName, toolArgs);
        return sendResult(id, result);
      } catch (err) {
        console.error(`[ui2code] Tool call error (${toolName}):`, err);
        return sendError(id, -32603, err.message || String(err));
      }
    }

    // ----- resources -----
    case "resources/list":
      return sendResult(id, {
        resources: [
          {
            uri: WIDGET_URI,
            name: "UI2Code Widget",
            description: "Interactive UI refinement widget",
            mimeType: "text/html",
          },
        ],
      });

    case "resources/read": {
      const uri = params?.uri;
      if (uri === WIDGET_URI) {
        try {
          const { getWidgetHtml } = await import("./lib/widget-resource.mjs");
          const html = await getWidgetHtml();
          return sendResult(id, {
            contents: [
              {
                uri: WIDGET_URI,
                mimeType: "text/html",
                text: html,
              },
            ],
          });
        } catch (err) {
          console.error("[ui2code] Widget resource read error:", err);
          return sendError(id, -32603, err.message || String(err));
        }
      }
      return sendError(id, -32602, `Unknown resource URI: ${uri}`);
    }

    // ----- unknown -----
    default:
      if (id !== undefined && id !== null) {
        return sendError(id, -32601, `Method not found: ${method}`);
      }
      // No id means it's a notification we don't handle — ignore silently
      console.error(`[ui2code] Ignoring unknown notification: ${method}`);
  }
}

// ---------------------------------------------------------------------------
// stdin line reader
// ---------------------------------------------------------------------------

const rl = createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    console.error("[ui2code] Failed to parse JSON:", trimmed);
    return;
  }

  // If the message has no method, it is a response to a server-initiated request
  if (!msg.method) {
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) {
        reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      } else {
        resolve(msg.result);
      }
    }
    return;
  }

  // Client request or notification — dispatch
  await handleRequest(msg.id, msg.method, msg.params);
});

rl.on("close", () => {
  console.error("[ui2code] stdin closed, shutting down.");
  process.exit(0);
});

console.error("[ui2code] MCP server started (stdio, JSON-RPC 2.0)");
