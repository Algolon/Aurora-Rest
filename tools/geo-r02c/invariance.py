"""GEO-R02C invariance report: compare a candidate terrain (and optional water files) with the canonical R1 artifacts
inside/outside an activation window. Read-only on both inputs.

python tools/geo-r02c/invariance.py --candidate <terrain.f32> [--candidate-water-surface f] [--candidate-water-mesh f]
       [--mask tools/geo-r02c/masks/A1-window-v1.json] [--out report.json] [--self-test]
"""
from pathlib import Path
import argparse,json,sys
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent/'lib'))
from common import ROOT,NX,NZ,CELL,load_grid,load_mask,sha256,stats
from hydro import d8_receivers

def region_stats(d,mask):
 v=d[mask];return {'cells':int(mask.sum()),'cellsChanged':int((v!=0).sum()),**({k:val for k,val in stats(v).items() if k!='n'} if v.size else {})}

def mesh_cells(path):
 """Water triangles keyed by the 4 m cell containing their centroid (R1's mesh is a raw float32 triangle soup)."""
 t=np.fromfile(path,'<f4').reshape(-1,3,3);c=t.mean(axis=1);i=np.clip(((c[:,0]+3000)/CELL).astype(int),0,NX-1);j=np.clip(((4000-c[:,2])/CELL).astype(int),0,NZ-1);return t,j,i

def compare(base,cand,mask,base_ws=None,cand_ws=None,base_mesh=None,cand_mesh=None):
 d=cand-base;inside=mask['inside'];out={'mask':mask['spec']['id'],
  'outsideWindow':region_stats(d,~inside),'frozenRing':region_stats(d,mask['ring']),'feather':region_stats(d,mask['feather']),'core':region_stats(d,mask['core']),
  'outsideByteIdentical':bool(np.array_equal(base[~inside].astype('<f4').view('<u4'),cand[~inside].astype('<f4').view('<u4'))),
  'ringByteIdentical':bool(np.array_equal(base[mask['ring']].astype('<f4').view('<u4'),cand[mask['ring']].astype('<f4').view('<u4')))}
 rb=d8_receivers(base);rc=d8_receivers(cand);out['d8ReceiversChangedOutsideWindow']=int((rb!=rc)[~inside].sum());out['d8ReceiversChangedInsideWindow']=int((rb!=rc)[inside].sum())
 if base_ws is not None and cand_ws is not None:
  same=(base_ws==cand_ws)|(np.isnan(base_ws)&np.isnan(cand_ws));out['waterSurfaceRaster']={'identical':bool(same.all()),'cellsChangedOutsideWindow':int((~same)[~inside].sum()),'cellsChangedInsideWindow':int((~same)[inside].sum())}
 if base_mesh is not None and cand_mesh is not None:
  (tb,jb,ib),(tc,jc,ic)=base_mesh,cand_mesh;ob=~inside[jb,ib];oc=~inside[jc,ic]
  key=lambda t:np.sort(t.reshape(len(t),-1).view('<u4').view(np.dtype((np.void,36))).ravel())
  out['waterMeshOutsideWindow']={'baseTriangles':int(ob.sum()),'candidateTriangles':int(oc.sum()),'identicalTriangleSet':bool(ob.sum()==oc.sum() and np.array_equal(key(tb[ob]),key(tc[oc])))}
 out['pass']=bool(out['outsideByteIdentical'] and out['ringByteIdentical'] and out['d8ReceiversChangedOutsideWindow']==0 and out.get('waterSurfaceRaster',{}).get('cellsChangedOutsideWindow',0)==0
  and out.get('waterMeshOutsideWindow',{}).get('identicalTriangleSet',True))
 return out

def self_test(mask):
 R1=ROOT/'public/geo-r02b';H=load_grid(R1/'terrain.f32');W=load_grid(R1/'water-surface.f32');M=mesh_cells(R1/'water-mesh.f32')
 same=compare(H,H.copy(),mask,W,W.copy(),M,M);assert same['pass'] and same['core'].get('cellsChanged',0)==0,'R1 vs R1 must be identical'
 bump=H.copy();rows,cols=np.nonzero(mask['core']);j,i=int(rows.mean()),int(cols.mean());assert mask['core'][j-5:j+6,i-5:i+6].all();bump[j-5:j+6,i-5:i+6]+=1.
 inside=compare(H,bump,mask);assert inside['pass'] and inside['core']['cellsChanged']==121,'a core-only change must pass with exactly the bumped cells'
 leak=H.copy();leak[5,5]+=.001;outside=compare(H,leak,mask);assert not outside['pass'] and outside['outsideWindow']['cellsChanged']==1,'an outside change must fail'
 return {'r1VsR1':same['pass'],'coreBumpDetectedInsideOnly':inside['pass'],'outsideChangeRejected':not outside['pass']}

def main():
 p=argparse.ArgumentParser();p.add_argument('--candidate',type=Path);p.add_argument('--candidate-water-surface',type=Path);p.add_argument('--candidate-water-mesh',type=Path)
 p.add_argument('--mask',type=Path,default=ROOT/'tools/geo-r02c/masks/A1-window-v1.json');p.add_argument('--out',type=Path);p.add_argument('--self-test',action='store_true')
 a=p.parse_args();mask=load_mask(a.mask)
 if a.self_test:print(json.dumps(self_test(mask)));return
 R1=ROOT/'public/geo-r02b';base=load_grid(R1/'terrain.f32');cand=load_grid(a.candidate)
 ws=(load_grid(R1/'water-surface.f32'),load_grid(a.candidate_water_surface)) if a.candidate_water_surface else (None,None)
 ms=(mesh_cells(R1/'water-mesh.f32'),mesh_cells(a.candidate_water_mesh)) if a.candidate_water_mesh else (None,None)
 rep={'baseSha256':sha256(R1/'terrain.f32'),'candidate':str(a.candidate),'candidateSha256':sha256(a.candidate),**compare(base,cand,mask,*ws,*ms)}
 text=json.dumps(rep,indent=1)+'\n'
 if a.out:a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(text)
 print(text)

if __name__=='__main__':main()
