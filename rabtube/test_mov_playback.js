const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('Console:', msg.text()));
  page.on('pageerror', err => console.log('PageError:', err));
  await page.setContent('<video controls autoplay src="https://firebasestorage.googleapis.com/v0/b/rabtube-b4444.firebasestorage.app/o/videos%2FhDmhEgrd09cuspZQzoC2nOAxJS82%2F1779601577849.MOV?alt=media&token=0edc05fd-6319-4a49-9173-611ca773b50a"></video>');
  await page.waitForTimeout(3000);
  const videoState = await page.evaluate(() => {
    const v = document.querySelector('video');
    return {
      error: v.error ? v.error.message || v.error.code : null,
      readyState: v.readyState,
      networkState: v.networkState
    };
  });
  console.log(videoState);
  await browser.close();
})();
