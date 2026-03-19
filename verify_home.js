const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:5173');
  await page.waitForSelector('h1');
  await page.screenshot({ path: 'home_screen.png' });
  await browser.close();
})();
