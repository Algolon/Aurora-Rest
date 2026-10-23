"""Protected-file integrity against the B1.1 checkpoint (MEASURED with git, nothing written except the JSON report).
Every tracked file at the base commit outside the B2a additions must be byte-identical in the working tree, except the two declared
additive viewer edits. Writes docs/geo-r02c-b2a/data/protected-integrity.json; exit 1 on any unexpected change.
  python3 tools/geo-r02c-b2a/protect_check.py [--base 679958e6b29d7739c4b0b37809e0c11101a264c4]"""
from pathlib import Path
import argparse,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[2]
B2A=('docs/geo-r02c-b2a/','public/geo-r02c-b2a/','src/geo-r02c-b2a/','tools/geo-r02c-b2a/','tests/geo-r02c-b2a.test.ts')
DECLARED={'src/geo-r02b/main.ts':'imports and registers the B2a review cameras (?cams=b2a)',
 'src/geo-r02c-a1a/variants.ts':'accepts the b2a variant family and routes that are added (adds: true) rather than replaced'}
KEY=['public/geo-r02b/terrain.f32','public/geo-r02b/water-surface.f32','public/geo-r02b/features.json','docs/geo-r02b/design-master-A-R1-v1.json',
 'tools/geo-r02c-b01/design/north-massif-b1.json','public/geo-r02c-b01/b1.patch.f32','public/geo-r02c-b01/manifest.json','public/geo-r02c-b01/routes.json']
git=lambda *a:subprocess.run(['git',*a],cwd=ROOT,capture_output=True,text=True,check=True).stdout
def main():
 a=argparse.ArgumentParser();a.add_argument('--base',default='679958e6b29d7739c4b0b37809e0c11101a264c4');base=a.parse_args().base
 changed=[l for l in git('diff','--name-status',base,'--').splitlines() if l]
 tracked_untracked=[l[3:] for l in git('status','--porcelain','--untracked-files=all').splitlines() if l.startswith('??')]
 unexpected=[l for l in changed if l.split('\t')[-1] not in DECLARED and not l.split('\t')[-1].startswith(B2A)]
 stray=[p for p in tracked_untracked if not p.startswith(B2A)]
 key={k:{'base':git('rev-parse',f'{base}:{k}').strip(),'worktree':git('hash-object',k).strip()} for k in KEY}
 out={'base':base,'head':git('rev-parse','HEAD').strip(),'changedTrackedFiles':changed,'declaredAdditiveEdits':DECLARED,'unexpectedChanges':unexpected,
  'untrackedOutsideB2a':stray,'keyFilesGitBlob':key,'keyFilesIdentical':all(v['base']==v['worktree'] for v in key.values())}
 out['pass']=not unexpected and not stray and out['keyFilesIdentical']
 (ROOT/'docs/geo-r02c-b2a/data').mkdir(parents=True,exist_ok=True);(ROOT/'docs/geo-r02c-b2a/data/protected-integrity.json').write_text(json.dumps(out,indent=1)+'\n')
 print(json.dumps({k:out[k] for k in ('changedTrackedFiles','unexpectedChanges','untrackedOutsideB2a','keyFilesIdentical','pass')},indent=1));return out['pass']
if __name__=='__main__':sys.exit(0 if main() else 1)
