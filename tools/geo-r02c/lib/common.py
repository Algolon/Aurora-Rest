"""Shared read-only helpers for GEO-R02C diagnostics. Grid: 1501 x 2001, 4 m, north-up.
x = 4*i - 3000 (east), z = 4000 - 4*j (north); row j runs south. Nothing here writes into public/.
"""
from pathlib import Path
import hashlib,json,struct,zlib
import numpy as np

ROOT=Path(__file__).resolve().parents[3]
NX,NZ,CELL=1501,2001,4.0
R1_DIR=ROOT/'public/geo-r02b'

def sha256(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def load_grid(path,dtype='<f4'):return np.fromfile(path,dtype=dtype).reshape(NZ,NX).astype(float)
def load_features(path=R1_DIR/'features.json'):return json.loads(Path(path).read_text())
def x_of(i):return np.asarray(i)*CELL-3000.
def z_of(j):return 4000.-np.asarray(j)*CELL
def i_of(x):return np.clip(np.rint((np.asarray(x)+3000.)/CELL).astype(int),0,NX-1)
def j_of(z):return np.clip(np.rint((4000.-np.asarray(z))/CELL).astype(int),0,NZ-1)
def coords():
 jj,ii=np.meshgrid(np.arange(NZ),np.arange(NX),indexing='ij');return x_of(ii),z_of(jj)

def surface(H,x,z):
 """Height on the canonical SW-diagonal triangles, identical to src/geo-r02b/terrain.ts HeightGrid.surface."""
 x=np.asarray(x,float);z=np.asarray(z,float)
 gx=np.clip((x+3000.)/CELL,0,(NX-1)-1e-8);gz=np.clip((4000.-z)/CELL,0,(NZ-1)-1e-8)
 i=np.floor(gx).astype(int);j=np.floor(gz).astype(int);u=gx-i;v=gz-j
 a=H[j,i];b=H[j+1,i];c=H[j,i+1];d=H[j+1,i+1]
 return np.where(u+v<=1,a+(c-a)*u+(b-a)*v,d+(b-d)*(1-u)+(c-d)*(1-v))

def stats(values):
 v=np.abs(np.asarray(values,float).ravel())
 if v.size==0:return {'n':0}
 return {'n':int(v.size),'p50':float(np.percentile(v,50)),'p90':float(np.percentile(v,90)),'p99':float(np.percentile(v,99)),
  'p999':float(np.percentile(v,99.9)),'max':float(v.max())}

def write_png(path,rgb):
 """Minimal dependency-free RGB PNG writer for diagnostic maps (uint8 HxWx3)."""
 rgb=np.ascontiguousarray(rgb,dtype=np.uint8);h,w,_=rgb.shape
 raw=b''.join(b'\x00'+rgb[r].tobytes() for r in range(h))
 def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
 Path(path).write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))

def diverging(values,limit):
 """Blue (negative) - white - red (positive) colour map, clipped at +-limit; NaN shows mid grey."""
 t=np.clip(np.nan_to_num(values,nan=0.)/limit,-1,1);w=1-np.abs(t)
 r=np.where(t>0,1.,w);g=w;b=np.where(t<0,1.,w);img=np.stack([r,g,b],-1)*255
 img[np.isnan(values)]=128;return img

def hillshade(H,azimuth=315.,altitude=45.):
 gz,gx=np.gradient(H,CELL);gz=-gz  # north-positive gradient (rows run south)
 az=np.radians(azimuth);alt=np.radians(altitude)
 slope=np.arctan(np.hypot(gx,gz));aspect=np.arctan2(-gx,gz)
 s=np.sin(alt)*np.cos(slope)+np.cos(alt)*np.sin(slope)*np.cos(az-aspect)
 return np.clip(s,0,1)

def downsample(img,f):return img[::f,::f]

def load_mask(path):
 """Window mask from tools/geo-r02c/masks/*.json -> dict of boolean grids and feather weight."""
 m=json.loads(Path(path).read_text());X,Z=coords();w=m['window']
 inside=(X>=w['xMin'])&(X<=w['xMax'])&(Z>=w['zMin'])&(Z<=w['zMax'])
 # Distance (m) from the window edge measured inward along the axis-aligned box.
 edge=np.minimum.reduce([X-w['xMin'],w['xMax']-X,Z-w['zMin'],w['zMax']-Z])
 ring=inside&(edge<m['frozenRingM'])
 t=np.clip((edge-m['frozenRingM'])/m['featherM'],0,1);weight=np.where(inside&~ring,t*t*(3-2*t),0.)
 core=inside&(edge>=m['frozenRingM']+m['featherM'])
 return {'spec':m,'inside':inside,'ring':ring,'feather':inside&~ring&~core,'core':core,'weight':weight}
