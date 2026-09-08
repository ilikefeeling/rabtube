const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1080 }
  });
  const page = await context.newPage();

  console.log("Loading Korean page...");
  await page.goto('http://localhost:3000/ko', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // wait for fonts/images
  await page.screenshot({ path: 'landing_ko.png', fullPage: true });

  console.log("Loading English page...");
  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // wait for fonts/images
  await page.screenshot({ path: 'landing_en.png', fullPage: true });

  await browser.close();
  console.log("Screenshots saved.");
})();
