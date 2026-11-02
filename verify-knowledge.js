const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`PAGE: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`CONSOLE: ${message.text()}`);
  });

  await page.goto("http://127.0.0.1:8022/knowledge.html", { waitUntil: "networkidle" });
  await page.locator('[data-learning-mode="story"]').click();
  await page.locator(".scene-card").nth(1).click();
  const roleVisible = await page.locator("#roleStage").evaluate((node) => !node.hidden);
  await page.locator("#startStory").click();
  await page.waitForTimeout(250);
  const storyVisible = await page.locator("#storyStage").evaluate((node) => !node.hidden);

  console.log(JSON.stringify({ roleVisible, storyVisible, errors }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
