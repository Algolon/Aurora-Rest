"""Builds tools/geo-r02c-a1a/cameras.json: fixed A1a review cameras shared by M0/V1/V2/V3.
Walk cameras: eye 1.75 m above the loaded variant's ground at a fixed (x, z), fixed yaw/pitch.
Aerial cameras: fixed world position and target. --check verifies every walk camera is dry on R1 and every variant."""
from pathlib import Path
import json,math,sys
import numpy as np
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE/'lib'));sys.path.insert(0,str(HERE))
from grid import ROOT,NX,NZ,load_r1,surface  # noqa: E402
SUMMIT=(-520.,2770.)
def toward(x,z,t):return round(math.atan2(t[0]-x,t[1]-z),4)
P0={c['id']:c for c in json.loads((ROOT/'tools/geo-r02c/cameras.json').read_text())['cameras']}
def walk(cid,name,group,x,z,yaw,pitch,src):return {'id':cid,'name':name,'group':group,'kind':'walk','xz':[round(x,2),round(z,2)],'yaw':yaw,'pitch':pitch,'source':src}
def aerial(cid,name,pos,target):return {'id':cid,'name':name,'group':'oblique','kind':'aerial','xz':[pos[0],pos[2]],'yaw':toward(pos[0],pos[2],(target[0],target[2])),'pitch':0.,'aerial':{'pos':pos,'target':target},'source':'fixed world position and target'}
cams=[]
for pid,cid,name in (('np-from-birchwood','a1a-birchwood','North Peak from Birchwood'),('np-from-valley-shoulder','a1a-valley-shoulder','North Peak from the Central Valley shoulder'),('np-from-tarn-overlook','a1a-tarn-overlook','High Tarn overlook')):
 c=P0[pid];cams.append(walk(cid,name,'approach',*c['xz'],c['yaw'],c['pitch'],'copied from P0 '+pid))
cams.append(walk('a1a-tarn-shore','High Tarn north shore (K1)','high-tarn',1080,2420,toward(1080,2420,SUMMIT),.05,'A1-D K1, facing the summit'))
cams.append(walk('a1a-approach-mid','Alpine approach · peak-ascent mid','approach',-581,2341,toward(-581,2341,SUMMIT),.12,'peak-ascent s = 1825 m'))
cams.append(walk('a1a-approach-upper','Alpine approach · below the final climb','approach',-542,2579,toward(-542,2579,SUMMIT),.2,'peak-ascent s = 2425 m'))
cams.append(walk('a1a-summit-into-c1','A1 crest by the summit · looking down into Nordbotn','summit',-475,2881,toward(-475,2881,(-245.,2930.)),-.28,'n-crown crest 120 m from the summit (A1-D K4 moved: from the summit dome itself C1 is hidden by the brow)'))
cams.append(walk('a1a-ncrown-ridge','n-crown arete · looking back to the summit','summit',-266,3159,toward(-266,3159,SUMMIT),.06,'on the A1 crest, n-crown s = 480 m (K2 moved: the A1-D position faced its own shaded slope)'))
cams.append(walk('a1a-west-arm','W arete · looking up to the summit','summit',-620,2665,toward(-620,2665,SUMMIT),.1,'on the A3 crest'))
cams.append(walk('a1a-c1-floor','C1 floor · looking west at the headwall','c1',-215,2930,-1.5708,.22,'inside the C1 footprint'))
cams.append(walk('a1a-c1-lip','C1 lip · looking west into Nordbotn','c1',-120,2960,-1.65,.12,'east of the C1 lip'))
ch=next(c for c in json.loads((ROOT/'public/geo-r02b/features.json').read_text())['channels'] if c['id']=='tarn-inlet-w');p=np.array(ch['points'])[:,[0,2]]
s=np.r_[0,np.cumsum(np.hypot(*np.diff(p,axis=0).T))]
def at(sv,off):
 k=int(np.searchsorted(s,sv));t=p[min(k+1,len(p)-1)]-p[max(k-1,0)];t/=np.linalg.norm(t);n=np.array([-t[1],t[0]]);q=p[k]+n*off;return q,t
q,t=at(205,-26);cams.append(walk('a1a-g1-upstream','G1 · from upstream, looking down the gully','g1',*q,round(math.atan2(t[0],t[1]),4),-.1,'tarn-inlet-w s = 205 m (reach start), 26 m right bank'))
q,t=at(330,26);cams.append(walk('a1a-g1-downstream','G1 · from downstream, looking up the gully','g1',*q,round(math.atan2(-t[0],-t[1]),4),.04,'tarn-inlet-w s = 330 m, 26 m left (north) bank'))
cams.append(aerial('a1a-oblique-se','Elevated oblique · from the south-east',[700.,1450.,1650.],[-420.,700.,2800.]))
cams.append(aerial('a1a-oblique-n','Elevated oblique · from the north over the sea',[-250.,1300.,4300.],[-450.,650.,2850.]))
cams.append(aerial('a1a-oblique-c1','Elevated oblique · into Nordbotn from the east',[300.,1150.,3150.],[-300.,720.,2900.]))
for c in cams:c['uv']=[round((c['xz'][0]+3000)/10,3),round((4000-c['xz'][1])/10,3)]
def check(H,W):
 bad=[]
 for c in cams:
  if c['kind']!='walk':continue
  g=float(surface(H,[c['xz'][0]],[c['xz'][1]])[0]);w=float(surface(W,[c['xz'][0]],[c['xz'][1]])[0])
  if not (g>0 and (not np.isfinite(w) or g>w+.15)):bad.append((c['id'],g,w))
 return bad
if __name__=='__main__':
 out={'schema':'aurora-rest-review-cameras/1','note':'GEO-R02C-A1a fixed cameras; identical for M0, V1, V2, V3','yawConvention':'0 = north (+z), pi/2 = east (+x)','eyeHeightM':1.75,'fovDeg':60,'cameras':cams}
 (HERE/'cameras.json').write_text(json.dumps(out,indent=1)+'\n')
 R1=load_r1();W=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX);print('cameras',len(cams),'wet/underwater on R1:',check(R1,W))
 if '--check' in sys.argv:
  from validate import compose
  for v in ('v1','v2','v3'):
   try:H,_=compose(v,R1);print(v,'wet:',check(H,W))
   except KeyError:print(v,'not generated yet')
