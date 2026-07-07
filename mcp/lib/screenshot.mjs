import { chromium } from "playwright";

let browser = null;

async function ensureBrowser() {
  if (!browser) {
    try {
      browser = await chromium.launch({ headless: true });
    } catch {
      // Auto-install Chromium on first use
      const { execSync } = await import("node:child_process");
      execSync("npx playwright install chromium", { stdio: "inherit" });
      browser = await chromium.launch({ headless: true });
    }
  }
  return browser;
}

export async function captureScreenshot({ url, viewportWidth = 1280, viewportHeight = 800 }) {
  const b = await ensureBrowser();
  const page = await b.newPage({ viewport: { width: viewportWidth, height: viewportHeight } });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    const buffer = await page.screenshot({ fullPage: false, type: "png" });
    return {
      imageBase64: buffer.toString("base64"),
      width: viewportWidth,
      height: viewportHeight,
    };
  } finally {
    await page.close();
  }
}

export async function identifyElementAtPoint({ url, x, y, viewportWidth = 1280, viewportHeight = 800 }) {
  const b = await ensureBrowser();
  const page = await b.newPage({ viewport: { width: viewportWidth, height: viewportHeight } });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    const info = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;

      // Build CSS selector path (from design-refine content.js describeElementContext)
      function selectorPath(node, maxDepth = 6) {
        const parts = [];
        let current = node;
        let depth = 0;
        while (current && current !== document.documentElement && depth < maxDepth) {
          let desc = current.tagName.toLowerCase();
          if (current.id) {
            desc += "#" + current.id;
          } else if (current.classList && current.classList.length > 0) {
            desc += "." + Array.from(current.classList).join(".");
          }
          parts.unshift(desc);
          current = current.parentElement;
          depth++;
        }
        return parts.join(" > ");
      }

      // Extract key computed styles
      const cs = getComputedStyle(el);
      const styleProps = [
        "color", "background-color", "background",
        "font-size", "font-weight", "font-family", "line-height",
        "padding", "margin", "border", "border-radius",
        "width", "height", "min-width", "min-height", "max-width", "max-height",
        "display", "flex-direction", "justify-content", "align-items", "gap",
        "position", "top", "right", "bottom", "left",
        "box-shadow", "text-align", "opacity",
      ];
      const computedStyles = {};
      for (const prop of styleProps) {
        const val = cs.getPropertyValue(prop);
        if (val && val !== "none" && val !== "normal" && val !== "auto" && val !== "0px" && val !== "rgba(0, 0, 0, 0)") {
          computedStyles[prop] = val;
        }
      }

      // Get outerHTML truncated
      let html = el.outerHTML;
      if (html.length > 12000) {
        html = html.substring(0, 12000) + "\n<!-- truncated -->";
      }

      // Get bounding rect for highlight rendering
      const rect = el.getBoundingClientRect();

      return {
        tagName: el.tagName.toLowerCase(),
        outerHTML: html,
        context: selectorPath(el),
        id: el.id || null,
        classList: Array.from(el.classList),
        computedStyles,
        boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    }, { x, y });

    return info;
  } finally {
    await page.close();
  }
}

// Capture screenshot with an element highlighted (draws a purple border overlay)
export async function captureScreenshotWithHighlight({ url, selector, viewportWidth = 1280, viewportHeight = 800 }) {
  const b = await ensureBrowser();
  const page = await b.newPage({ viewport: { width: viewportWidth, height: viewportHeight } });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    // Inject highlight overlay on the selected element
    if (selector) {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) {
          el.style.outline = "3px solid #7c3aed";
          el.style.outlineOffset = "2px";
        }
      }, selector);
      await page.waitForTimeout(100);
    }

    const buffer = await page.screenshot({ fullPage: false, type: "png" });
    return {
      imageBase64: buffer.toString("base64"),
      width: viewportWidth,
      height: viewportHeight,
    };
  } finally {
    await page.close();
  }
}
