const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log('Navigating to Home...');
  await page.goto('http://localhost:1420');
  await page.waitForSelector('h1');
  await page.screenshot({ path: 'home_v2.png' });

  console.log('Navigating to Editor...');
  // Click on the first recording card
  await page.click('div.bg-white.rounded-xl.p-6.shadow-sm');
  await page.waitForSelector('h2:has-text("Workflow Steps")');
  await page.screenshot({ path: 'editor_v2.png' });

  console.log('Testing Annotation...');
  await page.click('button:has-text("Add Highlight")');
  // Wait a bit for the highlight to appear
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'annotation_v2.png' });

  await browser.close();
  console.log('Done.');
})();
