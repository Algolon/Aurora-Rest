"""MEASURED: which North Peak terrain is player-visible, which of it forms the skyline, and how much of both the A1a mask
protected. Terrain only (no vegetation, haze or curvature), rendered-triangle heights, eye 1.75 m.
Also measures how far the committed V1/V2/V3 terrain moved each skyline, in screen pixels of the 1280 x 800 review captures.
Outputs: data/visibility.json, data/viewshed.npz (massif-box boolean grids per viewpoint)."""
from b_common import *
from collections import Counter
MASSIF=(-1500.,900.,2150.,3400.)   # same massif box as A1-D silhouettes (x0, x1, z0, z1)
SUMMIT=np.array([-520.,2770.])
pa=route('peak-ascent');s_pa=arclen(pa)
def route_pt(s):return np.array([np.interp(s,s_pa,pa[:,0]),np.interp(s,s_pa,pa[:,1])])
VP=[('birchwood','Birchwood',(-700.,300.),'far approach (A1a/P0 camera)'),
 ('valley-shoulder','Central Valley shoulder',(-175.97,-155.95),'far approach (A1a/P0 camera)'),
 ('central-valley','Central Valley floor',(90.,80.),'far approach (R1 default view)'),
 ('tarn-overlook','High Tarn overlook',(700.,1950.),'High Tarn (A1a/P0 camera, end of tarn-ascent)'),
 ('high-tarn','High Tarn east shore',(1430.,1930.),'High Tarn (R1 default view)'),
 ('tarn-shore','High Tarn north shore',(1080.,2420.),'High Tarn (A1a camera)')]
for s in (1300,1600,1900,2200,2500,2750):
 p=route_pt(s);VP.append((f'route-{s}',f'Alpine route s = {s} m',(float(p[0]),float(p[1])),'peak-ascent centreline'))
R1=r1();V={v:variant(v) for v in ('v1','v2','v3')}
def eye(H,ox,oz):return float(surface(H,[ox],[oz])[0])+1.75
def skyline(H,ox,oz,azs):
 oy=eye(R1,ox,oz);ds=np.r_[np.arange(8,1500,4.),np.arange(1500,7000,8.)];out=[]
 for a in azs:
  t=np.radians(a);xs=ox+np.sin(t)*ds;zs=oz+np.cos(t)*ds;ok=(xs>-2998)&(xs<2998)&(zs>-3998)&(zs<3998)
  ang=np.degrees(np.arctan2(surface(H,xs[ok],zs[ok])-oy,ds[ok]));k=int(np.argmax(ang));out.append((ang[k],xs[ok][k],zs[ok][k],ds[ok][k]))
 return np.array(out)
# massif-box targets at 8 m
gx,gz=np.meshgrid(np.arange(MASSIF[0],MASSIF[1],8.),np.arange(MASSIF[3],MASSIF[2],-8.));tx=gx.ravel();tz=gz.ravel()
land=surface(R1,tx,tz)>0;lab_all,M_all=classify(tx,tz)
def viewshed(ox,oz,step=8.):
 oy=eye(R1,ox,oz);ty=surface(R1,tx,tz)+.5;d=np.hypot(tx-ox,tz-oz);vis=np.zeros(len(tx),bool)
 for k in range(0,len(tx),1500):
  sl=slice(k,k+1500);n=int(max(2,d[sl].max()/step));s=(np.arange(1,n)/n)[None,:]
  xs=ox+(tx[sl]-ox)[:,None]*s;zs=oz+(tz[sl]-oz)[:,None]*s;ys=oy+(ty[sl]-oy)[:,None]*s
  vis[sl]=~(surface(R1,xs.ravel(),zs.ravel()).reshape(xs.shape)>ys+.05).any(axis=1)
 return vis&land
inbox=lambda x,z:(x>=MASSIF[0])&(x<=MASSIF[1])&(z>=MASSIF[2])&(z<=MASSIF[3])
out={'method':'Terrain-only line of sight and skyline on the rendered R1 triangles (eye 1.75 m, target lift 0.5 m, rays to 7 km); '
 'skyline = horizon point of maximum elevation angle per 0.1 deg azimuth; massif skyline = horizon points inside the A1-D massif box '
 f'{MASSIF}; protection = the committed A1a V1 mask (M and classes); pixels = degrees x {PX_PER_DEG:.2f} (60 deg vertical FOV, 800 px).',
 'massifBox':MASSIF,'viewpoints':{}}
VS={}
for vid,label,(ox,oz),kind in VP:
 az0=float(np.degrees(np.arctan2(SUMMIT[0]-ox,SUMMIT[1]-oz)));dist=float(np.hypot(*(SUMMIT-[ox,oz])))
 half=28. if dist>1500 else 70.;azs=np.arange(az0-half,az0+half+1e-9,.1)
 sk=skyline(R1,ox,oz,azs);m=inbox(sk[:,1],sk[:,2])
 lab,M=classify(sk[m,1],sk[m,2]);cnt=Counter(lab);n=max(1,m.sum())
 dpx={v:(skyline(V[v],ox,oz,azs[m])[:,0]-sk[m,0])*PX_PER_DEG if m.any() else np.zeros(0) for v in V}
 vis=viewshed(ox,oz);VS[vid]=vis.reshape(gx.shape)
 vl=lab_all[vis];vc=Counter(vl);nv=max(1,vis.sum())
 jj,ii=cell_of(tx[vis],tz[vis]);ok=jj>=0;dv1=np.zeros(vis.sum());dv1[ok]=(V['v1'][jj[ok]+J.start,ii[ok]+I.start]-R1[jj[ok]+J.start,ii[ok]+I.start])
 dist_sky=sk[m,3]
 out['viewpoints'][vid]={'label':label,'kind':kind,'xz':[r(ox),r(oz)],'eyeM':r(eye(R1,ox,oz)),'distanceToSummitM':round(dist),'azimuthSpanDeg':[r(azs[0]),r(azs[-1])],
  'massifSkylineSamples':int(m.sum()),'massifSkylineDistanceM':{'min':round(float(dist_sky.min())) if m.any() else None,'median':round(float(np.median(dist_sky))) if m.any() else None,'max':round(float(dist_sky.max())) if m.any() else None},
  'massifSkylineByProtectionPct':{k:r(100*c/n) for k,c in cnt.most_common()},
  'massifSkylineEditablePct':r(100*float((M>0).mean())) if m.any() else 0.,
  'deltaHFor3pxM':{'atMedianSkylineDistance':r(np.median(dist_sky)*np.tan(np.radians(3/PX_PER_DEG))) if m.any() else None},
  'skylineShiftPx':{v:{'maxAbs':r(np.abs(d).max(),2) if d.size else 0.,'samplesOver1px':int((np.abs(d)>1).sum()),'samplesOver3px':int((np.abs(d)>3).sum())} for v,d in dpx.items()},
  'visibleMassifCells8m':int(vis.sum()),'visibleByProtectionPct':{k:r(100*c/nv) for k,c in vc.most_common()},
  'visibleEditablePct':r(100*float((M_all[vis]>0).mean())),
  'visibleCellsChangedByV1Pct':r(100*float((np.abs(dv1)>.05).mean())),'visibleMaxV1ChangeM':r(np.abs(dv1).max() if dv1.size else 0,1),
  'skyline':[[r(a,2),r(x),r(z),r(d)] for (a,x,z,d) in sk[m][::5]],'skylineAzimuths':[r(a,1) for a in azs[m][::5]]}
 o=out['viewpoints'][vid];print(f"{vid:16s} sky={o['massifSkylineSamples']:4d} editable={o['massifSkylineEditablePct']:5.1f}% shiftV1={o['skylineShiftPx']['v1']['maxAbs']:5.2f}px V2={o['skylineShiftPx']['v2']['maxAbs']:5.2f} vis={o['visibleMassifCells8m']:6d} visEdit={o['visibleEditablePct']:5.1f}% visChgV1={o['visibleCellsChangedByV1Pct']:5.1f}% {dict(list(o['massifSkylineByProtectionPct'].items())[:4])}",flush=True)
dump('visibility.json',out);np.savez_compressed(DATA/'viewshed.npz',gx=gx,gz=gz,**VS)
