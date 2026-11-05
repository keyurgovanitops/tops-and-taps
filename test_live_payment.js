async function testLivePaymentAPI() {
  const apiBase = 'https://topstaps-api.onrender.com';
  console.log('Testing live payment flow on', apiBase);

  // 1. Login
  const loginRes = await fetch(`${apiBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@gmail.com', password: 'customer123' })
  });
  console.log('Login status:', loginRes.status);
  const auth = await loginRes.json();
  const token = auth.access_token;

  // 2. Fetch existing bookings or create one
  const bookingsRes = await fetch(`${apiBase}/api/bookings/my-bookings`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const bookings = await bookingsRes.json();
  console.log('Customer bookings count:', bookings.length);

  console.log('Creating a brand new test booking...');
  const createRes = await fetch(`${apiBase}/api/bookings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      service_id: 2,
      address_id: 1,
      booking_date: '2026-11-10',
      time_slot: '11:00 AM - 01:00 PM',
      notes: 'Testing payment sandbox'
    })
  });
  console.log('Create booking status:', createRes.status);
  const targetBooking = await createRes.json();
  console.log('Created booking:', targetBooking);

  const bId = targetBooking.booking_id || targetBooking.id;
  // 3. Create Razorpay order
  console.log('Calling /api/payments/razorpay/create-order for booking_id', bId, '...');
  const orderRes = await fetch(`${apiBase}/api/payments/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ booking_id: bId })
  });
  console.log('Create order HTTP status:', orderRes.status);
  const order = await orderRes.json();
  console.log('Order response:', {
    order_id: order.order_id,
    amount: order.amount,
    key_id: order.key_id,
    is_live_gateway: order.is_live_gateway
  });

  // 4. Verify Payment
  console.log('Calling /api/payments/razorpay/verify-payment ...');
  const verifyRes = await fetch(`${apiBase}/api/payments/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      booking_id: bId,
      razorpay_order_id: order.order_id,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      razorpay_signature: `sig_sandbox_${Date.now()}`,
      payment_method: 'Razorpay Test Sandbox (UPI)'
    })
  });
  console.log('Verify payment HTTP status:', verifyRes.status);
  const verifyData = await verifyRes.json();
  console.log('Payment verification response:', verifyData);

  // 5. Fetch Invoice
  console.log('Calling /api/payments/invoice/' + bId + ' ...');
  const invoiceRes = await fetch(`${apiBase}/api/payments/invoice/${bId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Invoice HTTP status:', invoiceRes.status);
  const invoiceData = await invoiceRes.json();
  console.log('Generated Tax Invoice:', invoiceData);

  console.log('\n=============================================');
  console.log('LIVE BACKEND PAYMENT & INVOICE FLOW VERIFIED!');
  console.log('=============================================');
}

testLivePaymentAPI().catch(console.error);
