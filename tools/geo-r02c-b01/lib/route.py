"""Candidate peak-ascent alignment on the B1 surface (peak-ascent-b1). The R1 peak-ascent is kept as reference and is followed
unchanged up to where it enters the edited terrain (blend weight > 0.02). From there a grade-constrained A* on 8 m nodes
(16 directions) climbs to the summit: path grade <= gradeLimit (0.30, the R1 target), the last summitScrambleM (140 m) to the top, a declared summit scramble, may
reach summitGrade; nodes whose terrain slope exceeds cliffSlope are excluded. The path is then simplified within the same grade
limit and resampled at 1 m (like the R1 route points)."""
import heapq,json
import numpy as np

CFG={'nodeM':4.,'gradeLimit':0.30,'summitGrade':0.45,'summitScrambleM':140.,'cliffSlope':1.25,'gentle':0.12,'stepLimit':0.65}

def bilinear(H,x,z):
 """Height on the rendered SW-diagonal triangles (same as src/geo-r02b/terrain.ts HeightGrid.surface)."""
 x=np.asarray(x,float);z=np.asarray(z,float);gx=np.clip((x+3000.)/4.,0,1499.99999999);gz=np.clip((4000.-z)/4.,0,1999.99999999)
 i=np.floor(gx).astype(int);j=np.floor(gz).astype(int);u=gx-i;v=gz-j;a=H[j,i];b=H[j+1,i];c=H[j,i+1];d=H[j+1,i+1]
 return np.where(u+v<=1,a+(c-a)*u+(b-a)*v,d+(b-d)*(1-u)+(c-d)*(1-v))

def edge_step_max(H,X,Z,a,b,n,step=0.65):
 """Steepest walk-controller step (0.65 m) along the edge from every node in direction (a, b)."""
 L=np.hypot(a,b)*n;k=max(1,int(np.ceil(L/step)));best=np.zeros(X.shape);prev=bilinear(H,X,Z)
 for s in range(1,k+1):
  f=s/k;cur=bilinear(H,X+b*n*f,Z+a*n*f);best=np.maximum(best,np.abs(cur-prev)/(L/k));prev=cur
 return best

def grades(H,pts,step=1.):
 p=np.asarray(pts,float);seg=np.hypot(*np.diff(p,axis=0).T);h=bilinear(H,p[:,0],p[:,1]);return np.abs(np.diff(h))/np.maximum(seg,1e-6),seg

def hiking_grades(H,pts,window=10.):
 """Grade over a moving window (default 10 m), the usual way a trail grade is stated; the 1 m values include mesh facets."""
 p=np.asarray(pts,float);s=np.r_[0,np.cumsum(np.hypot(*np.diff(p,axis=0).T))];h=bilinear(H,p[:,0],p[:,1]);t=np.arange(window/2,s[-1]-window/2,1.)
 return np.abs(np.interp(t+window/2,s,h)-np.interp(t-window/2,s,h))/window,t

def resample_legs(pts,step=1.):
 """Resample each leg separately and keep every vertex, so no chord cuts across a switchback corner."""
 out=[np.asarray(pts[0],float)[None]]
 for a,b in zip(pts[:-1],pts[1:]):
  a=np.asarray(a,float);b=np.asarray(b,float);n=max(1,int(np.ceil(np.hypot(*(b-a))/step)));f=np.arange(1,n+1)[:,None]/n;out.append(a+(b-a)*f)
 return np.vstack(out)

def walk_test(H,pts,limit=0.7,sub=0.65):
 """Python emulation of qa.walkRouteForTest + stepWalk in src/geo-r02b/main.ts: walk point to point in sub-steps of at most
 0.65 m; a sub-step is refused when |dh| / step length > 0.7. Returns the index of the first blocked point, or -1."""
 p=np.asarray(pts,float)
 for k in range(1,len(p)):
  d=np.hypot(*(p[k]-p[k-1]));n=max(1,int(np.ceil(d/sub)));f=np.arange(0,n+1)/n;q=p[k-1]+(p[k]-p[k-1])*f[:,None];h=bilinear(H,q[:,0],q[:,1])
  if d>0 and (np.abs(np.diff(h))/(d/n)).max()>limit:return k
 return -1

def resample(pts,step=1.):
 p=np.asarray(pts,float);s=np.r_[0,np.cumsum(np.hypot(*np.diff(p,axis=0).T))];t=np.arange(0,s[-1],step);t=np.r_[t,s[-1]]
 return np.c_[np.interp(t,s,p[:,0]),np.interp(t,s,p[:,1])]

def astar(H,start,goal,box,cfg,WS):
 n=cfg['nodeM'];x0,x1,z0,z1=box;xs=np.arange(x0,x1+n,n);zs=np.arange(z0,z1+n,n);X,Z=np.meshgrid(xs,zs);Hn=bilinear(H,X,Z)
 gz,gx=np.gradient(Hn,n);slope=np.hypot(gx,gz);wet=np.isfinite(bilinear(np.nan_to_num(WS,nan=-1e9),X,Z))&(bilinear(np.nan_to_num(WS,nan=-1e9),X,Z)>Hn-.5)
 dgoal=np.hypot(X-goal[0],Z-goal[1]);bad=((slope>cfg['cliffSlope'])&(dgoal>cfg['summitScrambleM']))|wet|(Hn<=0)
 nz,nx=X.shape;si=(int(round((start[1]-z0)/n)),int(round((start[0]-x0)/n)));gi=(int(round((goal[1]-z0)/n)),int(round((goal[0]-x0)/n)))
 dirs=[(a,b) for a in range(-2,3) for b in range(-2,3) if (a or b) and np.gcd(abs(a),abs(b))==1];emax={d:edge_step_max(H,X,Z,d[0],d[1],n) for d in dirs}
 g=np.full((nz,nx),np.inf);g[si]=0;prev={};heap=[(0.,si)]
 while heap:
  f,c=heapq.heappop(heap)
  if c==gi:break
  if f>g[c]+np.hypot(c[0]-gi[0],c[1]-gi[1])*n+1e-6:continue
  for a,b in dirs:
   q=(c[0]+a,c[1]+b)
   if not(0<=q[0]<nz and 0<=q[1]<nx) or bad[q]:continue
   L=np.hypot(a,b)*n;gr=abs(Hn[q]-Hn[c])/L;lim=cfg['summitGrade'] if dgoal[q]<cfg['summitScrambleM'] else cfg['gradeLimit']
   if gr>lim or emax[(a,b)][c]>cfg['stepLimit']:continue
   cost=L*(1+4*max(0.,gr-cfg['gentle'])+0.6*max(0.,slope[q]-0.7))
   if g[c]+cost<g[q]:g[q]=g[c]+cost;prev[q]=c;heapq.heappush(heap,(g[q]+np.hypot(q[0]-gi[0],q[1]-gi[1])*n,q))
 if gi not in prev:return None
 path=[gi]
 while path[-1]!=si:path.append(prev[path[-1]])
 return [(float(xs[c[1]]),float(zs[c[0]])) for c in path[::-1]]

def edge_ok(H,seg,cfg):
 p=resample(seg,0.65);h=bilinear(H,p[:,0],p[:,1]);d=np.hypot(*np.diff(p,axis=0).T);return bool((np.abs(np.diff(h))/np.maximum(d,1e-6)).max()<=cfg['stepLimit'])

def simplify(H,path,cfg,goal):
 out=[path[0]];k=0
 while k<len(path)-1:
  for m in range(min(len(path)-1,k+12),k,-1):
   seg=resample([path[k],path[m]],1.);gr,_=grades(H,seg);lim=cfg['summitGrade'] if np.hypot(path[m][0]-goal[0],path[m][1]-goal[1])<cfg['summitScrambleM'] else cfg['gradeLimit']
   if (gr.max()<=lim+0.02 and edge_ok(H,seg,cfg)) or m==k+1:out.append(path[m]);k=m;break  # m == k+1 is an original A* edge (node grade within the limit)
 return out

def walk_steps(H,pts):
 p=resample(pts,0.65);h=bilinear(H,p[:,0],p[:,1]);d=np.hypot(*np.diff(p,axis=0).T);return (np.abs(np.diff(h))/np.maximum(d,1e-6)>0.7).sum()

def candidate_routes(H,ctx,cfg=CFG):
 f=ctx['features'];r=next(r for r in f['routes'] if r['id']=='peak-ascent');pts=np.array(r['points2'],float);J,I,w=ctx['J'],ctx['I'],ctx['w']
 ji=np.clip(((4000-pts[:,1])/4).round().astype(int)-J.start,0,w.shape[0]-1);ii=np.clip(((pts[:,0]+3000)/4).round().astype(int)-I.start,0,w.shape[1]-1)
 inside=(((4000-pts[:,1])/4).round().astype(int)>=J.start)&(((pts[:,0]+3000)/4).round().astype(int)>=I.start);ww=np.where(inside,w[ji,ii],0.)
 k=int(np.argmax(ww>0.02));keep=pts[:k+1];goal=(-520.,2770.);start=tuple(keep[-1])
 box=(-1500.,500.,1600.,3300.);raw=astar(H.astype(float),start,goal,box,cfg,ctx['WS'])
 if raw is None:return {'status':'no path within the grade limits','reference':'peak-ascent'}
 raw[0]=start;simp=simplify(H.astype(float),raw,cfg,goal);new=resample_legs(simp,1.);full=np.r_[keep[:-1],new]
 gr,seg=grades(H.astype(float),full);d_end=np.hypot(full[1:,0]-goal[0],full[1:,1]-goal[1]);main=d_end>=cfg['summitScrambleM']
 gr0,_=grades(H.astype(float),pts);hg,ht=hiking_grades(H.astype(float),full);s_full=np.r_[0,np.cumsum(seg)];hmain=np.interp(ht,s_full[1:],d_end)>=cfg['summitScrambleM']
 hg0,_=hiking_grades(H.astype(float),pts);step=np.abs(np.diff(bilinear(H.astype(float),full[:,0],full[:,1])))/np.maximum(seg,1e-6)
 rep={'status':'candidate','reference':'peak-ascent (R1 alignment, unchanged, kept as reference)','sharedWithR1Points':int(k+1),'lengthM':round(float(seg.sum()),1),
  'r1LengthM':round(float(np.hypot(*np.diff(pts,axis=0).T).sum()),1),'maxGradeMain':round(float(gr[main].max()),3),'p95GradeMain':round(float(np.percentile(gr[main],95)),3),
  'maxGradeSummitScramble':round(float(gr[~main].max()),3) if (~main).any() else None,
  'hikingGrade10m':{'maxMain':round(float(hg[hmain].max()),3),'p95Main':round(float(np.percentile(hg[hmain],95)),3),'shareMainOver30Pct':round(float((hg[hmain]>0.3).mean()),4),'maxSummitScramble':round(float(hg[~hmain].max()),3) if (~hmain).any() else None},
  'walkControllerLimit':0.7,'walkTestBlockedAt':int(walk_test(H.astype(float),full)),'r1RouteOnB1WalkTestBlockedAt':int(walk_test(H.astype(float),pts)),'r1RouteOnB1HikingGrade10mMax':round(float(hg0.max()),3),'summitScrambleM':cfg['summitScrambleM'],'gradeLimit':cfg['gradeLimit'],
  'r1RouteOnB1MaxGrade':round(float(gr0.max()),3),'r1RouteOnB1Over30PctM':round(float(np.hypot(*np.diff(pts,axis=0).T)[gr0>0.3].sum()),1),'endXZ':[float(full[-1,0]),float(full[-1,1])],'config':cfg}
 return {'routes':[{'id':'peak-ascent','replaces':'peak-ascent','points2':[[round(float(x),2),round(float(z),2)] for x,z in full]}],'report':rep}
