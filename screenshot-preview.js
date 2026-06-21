const path = require("node:path");
const { chromium } = require("playwright");

(async () => {
  const filePath = path.resolve(__dirname, "index.html");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
  await page.goto(`file:///${filePath.replaceAll("\\", "/")}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.resolve(__dirname, "preview-dashboard.png"), fullPage: true });
  await browser.close();
})();
