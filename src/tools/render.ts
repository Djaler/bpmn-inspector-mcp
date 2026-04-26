import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { getBrowser } from "../renderer/browser-manager.js";
import { RENDER_PAGE_HTML } from "../renderer/render-page.js";

const require = createRequire(import.meta.url);

const PADDING = 60;
const DEFAULT_MAX_WIDTH = 4000;

function resolveBpmnJsAsset(relativePath: string): string {
  const bpmnJsDir = require.resolve("bpmn-js/dist/bpmn-viewer.production.min.js");
  return bpmnJsDir.replace("bpmn-viewer.production.min.js", relativePath);
}

export async function renderBpmn(
  filePath: string,
  maxWidth?: number,
): Promise<{ isError?: boolean; content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> }> {
  let xml: string;
  try {
    xml = await readFile(filePath, "utf-8");
  } catch {
    return {
      isError: true,
      content: [{ type: "text", text: `File not found or unreadable: ${filePath}` }],
    };
  }

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Failed to launch browser: ${message}` }],
    };
  }

  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 16000, height: 8000 });
    await page.setContent(RENDER_PAGE_HTML, { waitUntil: "domcontentloaded" });

    await page.addStyleTag({ path: resolveBpmnJsAsset("assets/diagram-js.css") });
    await page.addStyleTag({ path: resolveBpmnJsAsset("assets/bpmn-js.css") });
    await page.addStyleTag({ path: resolveBpmnJsAsset("assets/bpmn-font/css/bpmn-embedded.css") });
    await page.addScriptTag({ path: resolveBpmnJsAsset("bpmn-viewer.production.min.js") });

    const viewbox = await page.evaluate(async (bpmnXml: string) => {
      const container = document.getElementById("canvas")!;
      const viewer = new (window as any).BpmnJS({ container });
      (window as any).__viewer = viewer;
      await viewer.importXML(bpmnXml);
      const canvas = viewer.get("canvas");
      canvas.zoom("fit-viewport");
      const vb = canvas.viewbox();
      return {
        innerWidth: vb.inner.width,
        innerHeight: vb.inner.height,
      };
    }, xml);

    let width = Math.ceil(viewbox.innerWidth + PADDING * 2);
    let height = Math.ceil(viewbox.innerHeight + PADDING * 2);

    const limit = maxWidth ?? DEFAULT_MAX_WIDTH;
    if (width > limit) {
      const scale = limit / width;
      height = Math.ceil(height * scale);
      width = limit;
    }

    await page.setViewport({ width, height });

    await page.evaluate((w: number, h: number) => {
      const container = document.getElementById("canvas")!;
      container.style.width = `${w}px`;
      container.style.height = `${h}px`;
      const viewer = (window as any).__viewer;
      viewer.get("canvas").resized();
      viewer.get("canvas").zoom("fit-viewport");
    }, width, height);

    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width, height },
      encoding: "base64",
    });

    return {
      content: [
        { type: "text", text: `Rendered BPMN diagram (${width}x${height}px)` },
        { type: "image", data: screenshot as string, mimeType: "image/png" },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Render failed: ${message}` }],
    };
  } finally {
    await page.close().catch(() => {});
  }
}
