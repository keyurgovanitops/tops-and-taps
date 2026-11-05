const { chromium } = require('playwright');

async function testLiveTour() {
  console.log('Testing live tour auto-launch and button visibility on https://topstaps-9634.netlify.app ...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  
  // Fresh incognito context (guarantees empty localStorage / first-time user)
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('Navigating to landing page as fresh first-time user...');
  await page.goto('https://topstaps-9634.netlify.app/', { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Check Top Navbar button
  const navTourBtn = await page.$('button:has-text("Interactive Tour")');
  console.log('Top Navbar Interactive Tour button present:', !!navTourBtn);

  // 2. Check Bottom-Left floating trigger button
  const floatingBtn = await page.$('div.fixed.bottom-6.left-6');
  console.log('Bottom-Left floating launcher button present:', !!floatingBtn);

  // 3. Wait for auto-launch trigger (configured at 1000ms delay for first-time visitors)
  console.log('Waiting for automatic tour modal to appear for first-time visitor...');
  await page.waitForTimeout(2500);

  // Check if Tour Modal / Overlay is open
  const tourHeader = await page.$('text=Welcome to TOPS & Taps');
  console.log('Auto-launched Tour Card present on screen:', !!tourHeader);

  const stepIndicator = await page.$('text=Step 1 of');
  console.log('Step Indicator present:', !!stepIndicator);

  if (tourHeader) {
    console.log('Tour card successfully auto-launched for first-time user!');
    // Test clicking Next Step
    const nextBtn = await page.$('button:has-text("Next")');
    if (nextBtn) {
      console.log('Clicking Next Step button in tour card...');
      await nextBtn.click();
      await page.waitForTimeout(1000);
      const step2 = await page.$('text=Step 2 of');
      console.log('Advanced to Step 2:', !!step2);
    }
  }

  console.log('\n--- TOUR VERIFICATION SUMMARY ---');
  console.log('Console Errors:', consoleErrors.length);
  console.log('Top Navbar button verified:', !!navTourBtn);
  console.log('Bottom-Left position verified:', !!floatingBtn);
  console.log('Auto-launch for first-time user verified:', !!tourHeader);

  await browser.close();

  if (!tourHeader || !navTourBtn || !floatingBtn) {
    console.error('FAILED: Tour verification check failed!');
    process.exit(1);
  }
  console.log('SUCCESS: Tour button relocation and auto-launch verified 100%!');
}

testLiveTour().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
