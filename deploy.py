import os
import zipfile
import urllib.request
import json

dist_dir = 'frontend/dist'
zip_path = 'deploy_bundle.zip'
site_id = '980d414a-4137-42d7-bb9d-50c2e39346f8'
token = 'nfp_PBrSYAVCCdZQGubBq5tKv5fxg2qUbp4v6e02'

print(f"Packaging {dist_dir} into {zip_path}...")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(dist_dir):
        for f in files:
            full_path = os.path.join(root, f)
            arcname = os.path.relpath(full_path, dist_dir).replace('\\', '/')
            print(f"  Adding: {arcname}")
            z.write(full_path, arcname)

file_size = os.path.getsize(zip_path)
print(f"Zip created: {file_size} bytes")

print("Deploying to Netlify via REST API...")
url = f"https://api.netlify.com/api/v1/sites/{site_id}/deploys"

with open(zip_path, 'rb') as f:
    zip_bytes = f.read()

req = urllib.request.Request(
    url,
    data=zip_bytes,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/zip'
    },
    method='POST'
)

with urllib.request.urlopen(req, timeout=90) as response:
    resp_text = response.read().decode('utf-8')
    data = json.loads(resp_text)
    print("Netlify Deploy Response:")
    print(f"  Status: {response.status}")
    print(f"  State: {data.get('state')}")
    print(f"  Deploy ID: {data.get('id')}")
    print(f"  SSL URL: {data.get('ssl_url')}")
    print(f"  URL: {data.get('url')}")

# Clean up zip
if os.path.exists(zip_path):
    os.remove(zip_path)
print("Deployment completed successfully!")

