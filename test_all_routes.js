const { chromium } = require('playwright');

async function testAllRoutes() {
  console.log('Testing full suite across all portals on https://topstaps-9634.netlify.app ...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const routes = [
    { path: '/', expected: 'Transparent Pricing. No Surprise Extra Charges.' },
    { path: '/services', expected: 'Explore Verified Services' },
    { path: '/customer', expected: 'Customer Portal' },
    { path: '/admin', expected: 'Master Control & Analytics' },
    { path: '/tech', expected: 'Field Technician Portal' },
    { path: '/provider', expected: 'Provider Dispatch Portal' },
  ];

  for (const r of routes) {
    const consoleErrors = [];
    const pageErrors = [];

    const onConsole = msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    };
    const onPageError = err => {
      pageErrors.push(err.message);
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    const targetUrl = 'https://topstaps-9634.netlify.app' + r.path;
    console.log(`\nNavigating to: ${targetUrl}`);
    const res = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    console.log(`  HTTP status: ${res.status()}`);
    console.log(`  Console Errors: ${consoleErrors.length}`);
    console.log(`  Uncaught Exceptions: ${pageErrors.length}`);

    if (pageErrors.length > 0) {
      console.error(`  FAIL on ${r.path}:`, pageErrors);
      await browser.close();
      process.exit(1);
    }

    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }

  await browser.close();
  console.log('\n=========================================');
  console.log('ALL ROUTES PASSED: 0 UNCAUGHT EXCEPTIONS!');
  console.log('=========================================');
}

testAllRoutes().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});

