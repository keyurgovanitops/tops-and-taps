const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deploy() {
  if (fs.existsSync('dist.zip')) {
    fs.unlinkSync('dist.zip');
  }
  console.log('Zipping frontend/dist...');
  execSync('powershell -Command "Compress-Archive -Path frontend/dist/* -DestinationPath dist.zip -Force"');
  const size = fs.statSync('dist.zip').size;
  console.log('Created dist.zip, size:', size, 'bytes');

  const fileData = fs.readFileSync('dist.zip');
  const siteId = '980d414a-4137-42d7-bb9d-50c2e39346f8';
  const token = 'nfp_PBrSYAVCCdZQGubBq5tKv5fxg2qUbp4v6e02';

  console.log('Uploading to Netlify...');
  const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/zip'
    },
    body: fileData
  });

  const data = await res.json();
  console.log('Netlify response status:', res.status);
  console.log('Deploy state:', data.state);
  console.log('Deploy URL:', data.ssl_url || data.url);
  console.log('Site URL:', `https://topstaps-9634.netlify.app`);
}

deploy().catch(err => {
  console.error('Error during deployment:', err);
  process.exit(1);
});
