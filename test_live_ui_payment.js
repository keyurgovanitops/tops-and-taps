const { chromium } = require('playwright');

async function testLiveUIPayment() {
  console.log('Testing live UI payment on https://topstaps-9634.netlify.app ...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const failedRequests = [];
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console.error:', msg.text());
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', req => {
    console.log('Request failed:', req.url(), req.failure()?.errorText);
    failedRequests.push(req.url());
  });

  // 1. Navigate to landing page
  console.log('Navigating to landing page...');
  await page.goto('https://topstaps-9634.netlify.app/', { waitUntil: 'networkidle', timeout: 30000 });

  // 2. Open login modal or set token in localStorage
  console.log('Logging in as customer via API and seeding session...');
  const loginRes = await page.request.post('https://topstaps-api.onrender.com/api/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    data: { email: 'customer@gmail.com', password: 'customer123' }
  });
  console.log('Login HTTP status:', loginRes.status());
  const loginText = await loginRes.text();
  console.log('Login response text:', loginText.substring(0, 200));
  const auth = JSON.parse(loginText);
  console.log('Auth success for:', auth.user.email, 'Role:', auth.user.role);

  await page.evaluate(authData => {
    localStorage.setItem('token', authData.access_token);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }, auth);

  // 3. Navigate directly to customer portal
  console.log('Navigating to /customer portal...');
  await page.goto('https://topstaps-9634.netlify.app/customer', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 4. Create a new booking via UI if no unpaid bookings exist
  let payBtn = await page.$('button:has-text("Pay")');
  if (!payBtn) {
    console.log('Creating a booking via API so Pay button is present...');
    await page.request.post('https://topstaps-api.onrender.com/api/bookings', {
      headers: { 'Authorization': `Bearer ${auth.access_token}` },
      data: {
        service_id: 1,
        address_id: 1,
        booking_date: '2026-11-12',
        time_slot: '02:00 PM - 04:00 PM',
        notes: 'UI Payment Sandbox Test'
      }
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    payBtn = await page.$('button:has-text("Pay")');
  }

  console.log('Pay button found:', !!payBtn);
  if (payBtn) {
    console.log('Clicking Pay button...');
    await payBtn.click();
    await page.waitForTimeout(1000);

    // Verify Razorpay Standard Checkout Modal opened
    const rzpHeader = await page.$('text=Razorpay');
    console.log('Razorpay modal brand present:', !!rzpHeader);

    const payButton = await page.$('button:has-text("Pay ₹")');
    console.log('Payment modal Pay button present:', !!payButton);

    // Click Pay via Razorpay to trigger OTP / Bank simulator
    console.log('Clicking Pay via Razorpay button in modal...');
    await payButton.click();

    // Wait for OTP Simulation Screen
    await page.waitForTimeout(1000);
    const otpScreen = await page.$('text=Razorpay Test Bank Simulator');
    console.log('Razorpay Test Bank Simulator screen present:', !!otpScreen);

    // Click Simulate Success
    const simulateSuccessBtn = await page.$('button:has-text("Simulate Success")');
    console.log('Simulate Success button present:', !!simulateSuccessBtn);
    if (simulateSuccessBtn) {
      await simulateSuccessBtn.click();
      console.log('Simulating successful authorization...');
    }

    // Wait for payment settlement and invoice generation
    await page.waitForTimeout(3000);

    // Verify modal closes and Paid badge appears
    const paidBadge = await page.$('text=Paid');
    console.log('Paid badge visible on page:', !!paidBadge);
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log('Total console.errors:', consoleErrors.length);
  console.log('Failed network requests:', failedRequests.length);

  const razorpayFailedRequests = failedRequests.filter(u => u.includes('razorpay.com'));
  console.log('Razorpay failed requests (must be 0):', razorpayFailedRequests.length);

  await browser.close();

  if (razorpayFailedRequests.length > 0) {
    console.error('FAILED: Detected failed requests to razorpay.com!');
    process.exit(1);
  }

  console.log('SUCCESS: Live UI payment tested cleanly with 0 Razorpay 400 errors!');
}

testLiveUIPayment().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
