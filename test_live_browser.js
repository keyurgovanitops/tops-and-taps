const { chromium } = require('playwright');

async function testLive() {
  console.log('Launching browser to test https://topstaps-9634.netlify.app ...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console.error:', msg.text());
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('Browser Uncaught PageError:', err.message);
    pageErrors.push(err.message);
  });

  console.log('Navigating to landing page...');
  const res = await page.goto('https://topstaps-9634.netlify.app/', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Landing page HTTP status:', res.status());

  await page.waitForTimeout(2000);

  // Take screenshot of landing page
  await page.screenshot({ path: 'live_landing_screenshot.png', fullPage: true });
  console.log('Screenshot saved to live_landing_screenshot.png');

  // Verify critical elements on page
  const title = await page.title();
  console.log('Page Title:', title);

  const heroText = await page.textContent('h1');
  console.log('Hero H1 Text:', heroText);

  // Check for presence of interactive cost calculator
  const calculatorHeading = await page.$('text=Estimate Your Repair in Seconds');
  console.log('Cost Calculator present:', !!calculatorHeading);

  // Check for presence of How It Works stepper
  const stepperHeading = await page.$('text=How TOPS & Taps Works');
  console.log('How It Works stepper present:', !!stepperHeading);

  // Check for presence of Verified Reviews
  const reviewsHeading = await page.$('text=Verified Neighborhood Reviews');
  console.log('Verified Reviews present:', !!reviewsHeading);

  // Check for presence of Footer
  const footerBrand = await page.$('footer');
  console.log('Footer present:', !!footerBrand);

  console.log('Total Console Errors:', consoleErrors.length);
  console.log('Total Uncaught Page Errors:', pageErrors.length);

  await browser.close();

  if (pageErrors.length > 0) {
    console.error('FAILED: Uncaught page errors detected!');
    process.exit(1);
  }
  console.log('SUCCESS: Live frontend rendered completely with 0 uncaught runtime exceptions!');
}

testLive().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
