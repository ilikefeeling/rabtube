const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Starting Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to http://localhost:3000/auth/register...');
    await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle' });
    
    // Fill out registration form
    const randomEmail = `test_drop_${Date.now()}@gmail.com`;
    console.log(`Registering new user with email: ${randomEmail}`);
    
    await page.fill('input[placeholder="홍길동"]', '테스트원장');
    await page.fill('input[placeholder="doctor@example.com"]', randomEmail);
    await page.fill('input[placeholder="6자 이상"]', 'password123');
    await page.fill('input[placeholder="예) 연세스마일치과"]', '테스트치과의원');
    await page.fill('input[placeholder="예) 제12345호"]', '제99999호');
    await page.selectOption('select', '서울');
    
    console.log('Clicking register button...');
    await page.click('button:has-text("가입하기")');
    
    console.log('Waiting for redirection to homepage...');
    await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    const screenshotDir = 'C:\\Users\\PC2301.HOME-OFFICE\\.gemini\\antigravity\\brain\\880e3913-6d5c-4c3a-bf72-d772ff480254';
    
    // Screenshot 1: Closed state
    console.log('Taking screenshot of closed dropdown...');
    await page.screenshot({ path: path.join(screenshotDir, 'dropdown_1_closed.png') });
    
    // Click avatar summary to open it
    console.log('Clicking the avatar summary...');
    await page.click('details summary');
    
    // Wait a brief moment for any animation
    await page.waitForTimeout(500);
    
    // Screenshot 2: Opened state
    console.log('Taking screenshot of opened dropdown...');
    await page.screenshot({ path: path.join(screenshotDir, 'dropdown_2_opened.png') });
    
    // Click outside to close it (e.g. on the RabTube logo)
    console.log('Clicking outside (RabTube logo) to close...');
    await page.click('text=RabTube');
    
    // Wait a brief moment for transition
    await page.waitForTimeout(500);
    
    // Screenshot 3: Closed again state
    console.log('Taking screenshot of closed dropdown again...');
    await page.screenshot({ path: path.join(screenshotDir, 'dropdown_3_closed_again.png') });
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('An error occurred during test execution:', error);
  } finally {
    await browser.close();
  }
})();
