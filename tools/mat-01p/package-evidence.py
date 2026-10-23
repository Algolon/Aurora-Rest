"""MAT-01P evidence packaging (requires Pillow). Run once after compare-images.py, which works on the lossless PNGs.

* Candidate-OFF screenshots whose PNG bytes equal the baseline PNG bytes are not stored twice: the run keeps its
  per-shot SHA-256 values (equal to the baseline's) and records `filesIdenticalTo`.
* Remaining lossless PNG captures are re-encoded as JPEG quality 88 (no resize, crop or tone change). Each shot keeps
  `originalPngSha256` and gains the committed file's `sha256`.
Usage: python3 tools/mat-01p/package-evidence.py [docs/mat-01p/regression]
"""
import hashlib, json, os, sys
from PIL import Image

root = sys.argv[1] if len(sys.argv) > 1 else 'docs/mat-01p/regression'
mpath = os.path.join(root, 'manifest.json')
m = json.load(open(mpath))
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
runs = {r['id']: r for r in m['runs']}
base = {s['view']: s for s in runs['base-high']['shots']}
dup = runs.get('cand-high-default')
if dup and all(s['sha256'] == base[s['view']]['sha256'] for s in dup['shots']):
    for s in dup['shots']:
        p = os.path.join(root, s['file'])
        if os.path.exists(p):
            os.remove(p)
        s['file'] = None
    dup['filesIdenticalTo'] = 'base-high'
    if os.path.isdir(os.path.join(root, dup['id'])) and not os.listdir(os.path.join(root, dup['id'])):
        os.rmdir(os.path.join(root, dup['id']))
for r in m['runs']:
    for s in r['shots']:
        if not s['file'] or not s['file'].endswith('.png'):
            continue
        src = os.path.join(root, s['file'])
        dst = src[:-4] + '.jpg'
        s['originalPngSha256'] = s.pop('sha256')
        Image.open(src).convert('RGB').save(dst, 'JPEG', quality=88, optimize=True)
        os.remove(src)
        s['file'] = s['file'][:-4] + '.jpg'
        s['sha256'] = sha(dst)
        s['encoding'] = 'JPEG q88 re-encode of the lossless PNG capture; statistics were computed on the PNG'
m['packaging'] = ('cand-high-default PNGs were byte-identical to base-high and are not stored twice (hashes kept). '
                  'Other captures: JPEG q88 re-encodes; originalPngSha256 identifies the lossless capture used for all statistics.')
json.dump(m, open(mpath, 'w'), indent=1)
print('packaged', sum(len(r['shots']) for r in m['runs']), 'shots')
