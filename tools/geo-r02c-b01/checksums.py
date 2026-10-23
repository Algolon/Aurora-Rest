"""Writes docs/geo-r02c-b01/data/checksums.json: SHA-256 of every B01 source, output and evidence file, plus the protected
canonical inputs (R1 terrain, water surface, features, A-R1 design master). review.html and checksums.json itself are excluded
(the page embeds this list). Usage: python3 tools/geo-r02c-b01/checksums.py"""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/geo-r02c-b01/data/checksums.json'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
KEY=['public/geo-r02b/terrain.f32','public/geo-r02b/water-surface.f32','public/geo-r02b/features.json','docs/geo-r02b/design-master-A-R1-v1.json',
 'tools/geo-r02c-b01/design/north-massif-b1.json','docs/geo-r02c-b01/iteration/north-massif-b1.0.json','public/geo-r02c-b01/b1.patch.f32','public/geo-r02c-b01/manifest.json','public/geo-r02c-b01/routes.json']
files=[]
for d in ('docs/geo-r02c-b01','public/geo-r02c-b01','tools/geo-r02c-b01','src/geo-r02c-b01'):
 for p in sorted((ROOT/d).rglob('*')):
  r=p.relative_to(ROOT).as_posix()
  if p.is_file() and '.cache' not in r and '__pycache__' not in r and r not in ('docs/geo-r02c-b01/review.html','docs/geo-r02c-b01/data/checksums.json'):files.append(r)
files+= ['tests/geo-r02c-b01.test.ts','src/geo-r02c-a1a/variants.ts','src/geo-r02b/main.ts']
OUT.write_text(json.dumps({'key':{k:sha(ROOT/k) for k in KEY},'fileCount':len(files),'files':{f:sha(ROOT/f) for f in files}},indent=1)+'\n');print(len(files),'files')
