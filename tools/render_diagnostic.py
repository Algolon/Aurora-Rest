import json,numpy as np,matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap,LightSource,Normalize
from matplotlib.patches import PathPatch
from matplotlib import patheffects as pe
from pathlib import Path
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'docs/terrain-samples.json').read_text())
x=np.array(d['xs']);z=np.array(d['zs']);h=np.array(d['h']);c=np.array(d['coast'])
heights=[-80,0,10,35,70,140,220,350,500,710]
cols=['#305363','#557e85','#cfbc8b','#63816c','#4a7157','#577764','#8a906d','#92907d','#817e7a','#e8e4db']
cmap=LinearSegmentedColormap.from_list('Nordic',list(zip((np.array(heights)-min(heights))/(max(heights)-min(heights)),cols)),N=256)
ls=LightSource(azdeg=315,altdeg=51)
shade=ls.hillshade(h,vert_exag=2.2,dx=60,dy=60)
color=cmap(Normalize(-80,710)(h))[:,:,:3]
out=np.clip(color*(.60+.48*shade[:,:,None]),0,1)
fig,ax=plt.subplots(figsize=(10.5,12.6),dpi=165);fig.patch.set_facecolor('#172b31');ax.set_facecolor('#254850')
ax.imshow(out,origin='lower',extent=(x[0],x[-1],z[0],z[-1]),aspect='equal',interpolation='bilinear')
ax.contour(x,z,h,levels=[0,100,200,300,450,600],colors='#e9efdb',alpha=.3,linewidths=.48)
ax.contour(x,z,c,levels=[0],colors=['#eddec0'],linewidths=1.2,alpha=.9)
river=[(1015,2490),(1090,2280),(1155,2050),(1055,1830),(970,1550),(1005,1200),(850,850),(790,480),(900,150),(975,-250),(1090,-520),(1110,-900),(1230,-1220),(1330,-1650),(1550,-2050),(1780,-2270),(2010,-2600)]
ax.plot(*zip(*river),color='#89d1d0',lw=2.4,alpha=.96,solid_capstyle='round')
plt_x=np.array([710+320*np.cos(t) for t in np.linspace(0,2*np.pi,180)])
plt_z=np.array([2590+255*np.sin(t) for t in np.linspace(0,2*np.pi,180)])
ax.fill(plt_x,plt_z,color='#5aa1a0',alpha=.95);ax.plot(plt_x,plt_z,color='#c4e4d7',lw=1)
landmarks=[('NORTH PEAK',-800,2950),('HIGH TARN',680,2700),('CAIRN SADDLE',-90,1000),('BIRCHWOOD',-200,-900),('HIDDEN FOLD',-1450,480),('MIRELANDS',1500,-850),('WINDWARD',-2420,250),('SOUTH SHOULDER',-1030,-2400),('DUNES',800,-3080),('HOME COVE',1890,-2650)]
for name,px,pz in landmarks:
 t=ax.text(px,pz,name,ha='center',va='center',fontsize=7.5,color='#f5f4e8',weight='bold',fontfamily='DejaVu Sans',alpha=.95)
 t.set_path_effects([pe.withStroke(linewidth=2.5,foreground='#213c3c')])
ax.text(-3510,4270,'NORDIC ISLAND',color='#f6f2e4',fontsize=21,fontweight='bold')
ax.text(-3510,4080,'WORLD-01   /   HEIGHTFIELD DIAGNOSTIC',color='#c4d6d2',fontsize=9)
ax.text(-3510,-4400,'MODEL DATA · NOT A THREE.JS SCREENSHOT',color='#d2e3de',fontsize=8)
ax.set_xlim(-3600,3600);ax.set_ylim(-4620,4620);ax.set_xticks([]);ax.set_yticks([])
for spine in ax.spines.values():spine.set_visible(False)
fig.subplots_adjust(left=0,right=1,bottom=0,top=1)
fig.savefig(root/'docs/world01-terrain-diagnostic.png',dpi=165,facecolor=fig.get_facecolor())
plt.close(fig)
# elevation profile along main corridor
route=[(1730,-2670),(1470,-2340),(1250,-2010),(930,-1620),(650,-1120),(390,-640),(300,-200),(180,260),(0,910)]
# interpolate grid with bilinear sampling (exact profile is independently testable in browser)
xs=[];ys=[];distance=0
for a,b in zip(route[:-1],route[1:]):
 n=max(2,int(np.hypot(b[0]-a[0],b[1]-a[1])/15))
 for t in np.linspace(0,1,n,endpoint=False):
  px=a[0]+(b[0]-a[0])*t;pz=a[1]+(b[1]-a[1])*t
  if xs: distance+=15
  i=np.searchsorted(x,px)-1;j=np.searchsorted(z,pz)-1;i=np.clip(i,0,len(x)-2);j=np.clip(j,0,len(z)-2)
  tx=np.clip((px-x[i])/(x[i+1]-x[i]),0,1);tz=np.clip((pz-z[j])/(z[j+1]-z[j]),0,1)
  y=(h[j,i]*(1-tx)+h[j,i+1]*tx)*(1-tz)+(h[j+1,i]*(1-tx)+h[j+1,i+1]*tx)*tz
  xs.append(distance/1000);ys.append(y)
fig,ax=plt.subplots(figsize=(12,3.4),dpi=160);fig.patch.set_facecolor('#f4f1e9');ax.set_facecolor('#f4f1e9')
ax.fill_between(xs,ys,alpha=.45,color='#8d9a7a');ax.plot(xs,ys,color='#4c6b5a',lw=2)
ax.set_ylim(0,max(ys)*1.25);ax.set_xlabel('Approximate distance along authored route (km)');ax.set_ylabel('Elevation (m)');ax.set_title('Home Cove → Cairn Saddle · macro trail elevation diagnostic',loc='left',fontweight='bold',fontsize=12)
ax.spines[['top','right']].set_visible(False);ax.grid(axis='y',alpha=.15)
fig.tight_layout();fig.savefig(root/'docs/world01-route-profile.png',facecolor=fig.get_facecolor());plt.close(fig)
print('Created terrain diagnostic and route profile')
