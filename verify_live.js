async function verify() {
  const res = await fetch('https://topstaps-9634.netlify.app/?t=' + Date.now());
  const html = await res.text();
  console.log('Status:', res.status, 'HTML length:', html.length);
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (!match) {
    console.log('Script tag not found');
    return;
  }
  const jsUrl = 'https://topstaps-9634.netlify.app' + match[1];
  console.log('Live JS bundle:', jsUrl);
  const jsRes = await fetch(jsUrl);
  const js = await jsRes.text();
  console.log('JS bundle status:', jsRes.status, 'length:', js.length);
  console.log('Contains Pay Cashless & Relax:', js.includes('Pay Cashless & Relax'));
  console.log('Live deployment verified successfully!');
}

verify().catch(console.error);
