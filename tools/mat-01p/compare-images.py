"""MAT-01P regression statistics and composites from tools/mat-01p/compare.mjs captures (requires Pillow + NumPy).

Pairs: identity (baseline High vs candidate branch with the candidate OFF, must be pixel-identical) and candidate
(baseline vs baked noise, High and Mobile). Because baked noise is a different realisation of statistically matched
noise, pixel deltas measure *where* patches moved; pattern statistics measure whether the look is preserved:
frame mean colour shift, luminance spread ratio, luminance-histogram L1 distance and a 1/16-scale tone difference.
Usage: python3 tools/mat-01p/compare-images.py [docs/mat-01p/regression]
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image

root = sys.argv[1] if len(sys.argv) > 1 else 'docs/mat-01p/regression'
m = json.load(open(os.path.join(root, 'manifest.json')))
runs = {r['id']: r for r in m['runs']}
PAIRS = [('identity-high', 'base-high', 'cand-high-default'), ('candidate-high', 'base-high', 'cand-high-baked'),
         ('candidate-mobile', 'base-mobile', 'cand-mobile-baked')]
load = lambda p: np.asarray(Image.open(os.path.join(root, p)).convert('RGB')).astype(np.float64)
lum = lambda a: a @ np.array([.2126, .7152, .0722])
os.makedirs(os.path.join(root, 'composites'), exist_ok=True)
# Baked noise tiles every 32 lattice cells. At the nadir cameras (320 m, 60° vertical FOV, 800 px) one pixel ≈ 0.46 m,
# so the candidate's periods map to these horizontal lags (px). 'control' is a lag that matches no period.
M_PER_PX = 2 * 320 * np.tan(np.radians(30)) / 800
PERIODS_M = {'nadir-forest': {'ecotone 103 m': 32 / .31, 'patch 288 m': 9 * 32, 'meso 373 m': 2.2 * 5.3 * 32, 'control 240 m': 240},
             'nadir-meadow': {'ecotone 103 m': 32 / .31, 'patch 192 m': 6 * 32, 'control 240 m': 240, 'control 330 m': 330}}
def repetition(img, view):
    # Pearson autocorrelation of high-passed luminance at each period lag, horizontally (≈ world x).
    L = lum(img)
    blur = np.asarray(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).resize((L.shape[1] // 64, L.shape[0] // 64), Image.BOX).resize((L.shape[1], L.shape[0]), Image.BILINEAR)).astype(np.float64)
    H = L - blur
    out = {}
    for label, metres in PERIODS_M[view].items():
        lag = int(round(metres / M_PER_PX))
        if lag >= H.shape[1] - 64:
            continue
        a, b = H[:, :-lag].ravel(), H[:, lag:].ravel()
        out[f'{label} (lag {lag} px)'] = round(float(np.corrcoef(a, b)[0, 1]), 4)
    return out
summary = {'tool': 'tools/mat-01p/compare-images.py', 'note': 'Values in 0..255 sRGB units unless stated. hist L1 is in 0..2.', 'pairs': {}}
for name, a_id, b_id in PAIRS:
    if a_id not in runs or b_id not in runs:
        continue
    rows = {}
    for shot in runs[a_id]['shots']:
        v = shot['view']
        other = next(s for s in runs[b_id]['shots'] if s['view'] == v)
        A, B = load(shot['file']), load(other['file'])
        d = np.abs(A - B).max(axis=2)
        la, lb = lum(A), lum(B)
        ha, _ = np.histogram(la, bins=32, range=(0, 255)); hb, _ = np.histogram(lb, bins=32, range=(0, 255))
        small = lambda X: np.asarray(Image.fromarray(X.astype(np.uint8)).resize((X.shape[1] // 16, X.shape[0] // 16), Image.BOX)).astype(np.float64)
        rows[v] = {
            'maxDelta': int(d.max()), 'meanDelta': round(float(d.mean()), 3), 'fractionOver16': round(float((d > 16).mean()), 5),
            'meanColourShift': round(float(np.abs(A.reshape(-1, 3).mean(0) - B.reshape(-1, 3).mean(0)).max()), 3),
            'lumStdRatio': round(float(lb.std() / max(la.std(), 1e-6)), 4),
            'histL1': round(float(np.abs(ha / ha.sum() - hb / hb.sum()).sum()), 4),
            'toneDelta16': round(float(np.abs(small(A) - small(B)).mean()), 3),
            'shaA': shot['sha256'], 'shaB': other['sha256'],
        }
        if name != 'identity-high':
            amp = np.clip(d * 4, 0, 255).astype(np.uint8)
            h, w = A.shape[0] // 2, A.shape[1] // 2
            tiles = [Image.fromarray(A.astype(np.uint8)), Image.fromarray(B.astype(np.uint8)), Image.fromarray(amp).convert('RGB')]
            comp = Image.new('RGB', (w * 3, h))
            for i, t in enumerate(tiles):
                comp.paste(t.resize((w, h), Image.LANCZOS), (i * w, 0))
            path = os.path.join(root, 'composites', f'{name}--{v}.jpg')
            comp.save(path, 'JPEG', quality=88)
            rows[v]['composite'] = f'composites/{name}--{v}.jpg'
            rows[v]['compositeSha256'] = hashlib.sha256(open(path, 'rb').read()).hexdigest()
        if v.startswith('nadir-') and name != 'identity-high':
            rows[v]['repetition'] = {'a': repetition(A, v), 'b': repetition(B, v)}
    vals = list(rows.values())
    agg = {k: (max(r[k] for r in vals) if k in ('maxDelta', 'meanColourShift', 'histL1', 'toneDelta16', 'fractionOver16') else None) for k in vals[0] if isinstance(vals[0][k], (int, float))}
    agg['lumStdRatioRange'] = [min(r['lumStdRatio'] for r in vals), max(r['lumStdRatio'] for r in vals)]
    summary['pairs'][name] = {'a': a_id, 'b': b_id, 'worst': {k: v for k, v in agg.items() if v is not None}, 'views': rows}
    print(name, json.dumps(summary['pairs'][name]['worst']))
json.dump(summary, open(os.path.join(root, 'summary.json'), 'w'), indent=1)
