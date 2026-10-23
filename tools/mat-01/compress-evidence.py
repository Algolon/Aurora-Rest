"""MAT-01 evidence packaging: re-encode large lit screenshots as JPEG (quality 85) to keep the repository small.

Exact-pixel evidence (debug views, diffs, anything under the size threshold) stays PNG. No other processing is applied:
no resizing, cropping, colour or tone changes. The manifest keeps the SHA-256 of the original lossless capture and adds
the SHA-256 of the committed file. Requires Pillow. Usage: python3 tools/mat-01/compress-evidence.py [docs/mat-01/evidence]
"""
import hashlib, json, os, sys
from PIL import Image

root = sys.argv[1] if len(sys.argv) > 1 else 'docs/mat-01/evidence'
manifest_path = os.path.join(root, 'manifest.json')
manifest = json.load(open(manifest_path))
EXACT_GROUPS = {'diagnostics', 'invariance'}
THRESHOLD = 300_000
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
saved = 0
for shot in manifest['shots']:
    src = os.path.join(root, shot['file'])
    if not shot['file'].endswith('.png') or shot['group'] in EXACT_GROUPS or os.path.getsize(src) < THRESHOLD:
        continue
    jpg = src[:-4] + '.jpg'
    shot.setdefault('sha256', sha(src))
    shot['originalPngSha256'] = shot.pop('sha256')
    before = os.path.getsize(src)
    Image.open(src).convert('RGB').save(jpg, 'JPEG', quality=85, optimize=True)
    os.remove(src)
    saved += before - os.path.getsize(jpg)
    shot['file'] = os.path.basename(jpg)
    shot['sha256'] = sha(jpg)
    shot['encoding'] = 'JPEG q85 re-encode of the lossless capture; no other processing'
manifest['packaging'] = 'Lit screenshots > 300 kB re-encoded as JPEG q85 (tools/mat-01/compress-evidence.py); diagnostics, diffs and small images are the original PNG captures.'
json.dump(manifest, open(manifest_path, 'w'), indent=1)
print(f'saved {saved / 1e6:.1f} MB')
