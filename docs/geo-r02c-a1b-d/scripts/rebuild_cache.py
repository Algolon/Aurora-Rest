"""Rebuild the git-ignored A1a diagnostic cache that the A1b-D analysis reads (tools/geo-r02c-a1a/.cache/{v1,v3}.npz, the R1
constraint extraction and the R1 divides) WITHOUT touching public/geo-r02c-a1a/: it runs the A1a overlay build in memory and
saves only the mask/displacement arrays, after checking that the result reproduces the committed variant SHA-256.
Usage (repository root): python docs/geo-r02c-a1b-d/scripts/rebuild_cache.py      (about 6 minutes the first time)"""
import json,sys,hashlib
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[3];A=ROOT/'tools/geo-r02c-a1a';sys.path.insert(0,str(A/'lib'));sys.path.insert(0,str(A))
import overlay  # noqa: E402
man=json.loads((ROOT/'public/geo-r02c-a1a/manifest.json').read_text())['variants']
for vid in ('v1','v3'):
 out=A/'.cache'/f'{vid}.npz'
 if out.exists():print(vid,'cache present');continue
 spec,H,changed,D,M,delta,cls,rep,sha,timing=overlay.run(A/f'specs/a1a-{vid}.json')
 assert sha==man[vid]['terrainSha256'],f'{vid}: rebuilt terrain {sha} != committed {man[vid]["terrainSha256"]}'
 overlay.CACHE.mkdir(exist_ok=True)
 np.savez_compressed(out,D=D.astype('<f4'),M=M.astype('<f4'),delta=delta.astype('<f4'),changed=changed,**{'cls_'+k:v for k,v in cls.items()})
 print(vid,'rebuilt, SHA matches the committed variant',sha[:16])
