import puppeteer, { type Browser } from "puppeteer-core";
import { existsSync } from "node:fs";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

function findChrome(): string {
  const found = CHROME_PATHS.find(p => existsSync(p));
  if (!found) {
    throw new Error(
      "Chrome/Chromium not found. Install Google Chrome or Chromium.\n" +
      "Searched paths:\n" + CHROME_PATHS.map(p => `  - ${p}`).join("\n"),
    );
  }
  return found;
}

let browser: Browser | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

export async function getBrowser(): Promise<Browser> {
  resetIdleTimer();

  if (browser && browser.connected) {
    return browser;
  }

  browser = await puppeteer.launch({
    headless: true,
    executablePath: findChrome(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--font-render-hinting=none",
      "--disable-lcd-text",
    ],
  });

  browser.on("disconnected", () => {
    browser = null;
  });

  return browser;
}

export async function closeBrowser(): Promise<void> {
  clearIdleTimer();
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}

function resetIdleTimer(): void {
  clearIdleTimer();
  idleTimer = setTimeout(async () => {
    await closeBrowser();
  }, IDLE_TIMEOUT_MS);
}

function clearIdleTimer(): void {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}
