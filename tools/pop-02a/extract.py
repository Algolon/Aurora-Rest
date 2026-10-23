"""Read pinned Aurora sources; extract transitive modules without merging source branches."""
import subprocess,re,json,hashlib,posixpath
from pathlib import Path
if Path('src/nature-library').exists():
 raise RuntimeError('Refusing to overwrite an existing extracted library or its reviewed compatibility fixes; use a pristine isolated destination.')
BASE='asset-lab/birch/src/'
PINS={'birch-shadow':'dfc6b56f98cc560f6debce9b4e1fb3237069ef74','birch-batch':'87b4a2e00f0b29a89ec8aa1c5cdcf3bf7d170f6b','pine':'06a7edadb0a7df798a483f9c3bd8bf0311da67e3','mixed':'5f87d08a430051c9656e7bf44d1dfdc4f784f85d','grass-d1':'64606fe3df5d2444d0af21683319f6637b8d34f8','grass-d2r':'0104a97cd3612e1bf1bec12cec1ea537e92d12e5','rocks-e1':'33adfb992d907e386bc272dd73716d734191f2bf'}
for sha in PINS.values():subprocess.run(['git','cat-file','-e',sha+'^{commit}'],check=True)
manifest={'pins':PINS,'files':[],'protected':{},'sourceException':'POP-02A owner instruction selects POP-01 parent; repository policy unchanged'}
seen=set()
def extract(sha,rel):
 if rel in seen:return
 if 'experimental' in rel:raise RuntimeError('Experimental dependency blocked: '+rel)
 seen.add(rel);blob=subprocess.check_output(['git','show',sha+':'+BASE+rel]);out=Path('src/nature-library')/rel;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(blob)
 manifest['files'].append({'path':str(out),'sourceSha':sha,'sourcePath':BASE+rel,'sha256':hashlib.sha256(blob).hexdigest()})
 for dep in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',blob.decode()):
  target=posixpath.normpath(posixpath.join(posixpath.dirname(rel),dep))
  if target.endswith('.ts'):extract(sha,target)
for root in ['index.ts','pine/index.ts','grass/index.ts','rendering/mixedForest.ts','grass/rendering/grassBatch.ts']:extract(PINS['grass-d2r'],root)
extract(PINS['rocks-e1'],'rocks/index.ts')
for root in ['src/pop-01','public/geo-r02b','src/geo-r02b','src/world']:
 for p in Path(root).rglob('*'):
  if p.is_file():manifest['protected'][str(p)]=hashlib.sha256(p.read_bytes()).hexdigest()
Path('docs/pop-02a/provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Extracted',len(seen),'modules; protected',len(manifest['protected']),'files')
