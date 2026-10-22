"""Compare default-mode (no query) captures of the untouched R1 build and the P0 build, view by view.
python tools/geo-r02c/compare_default.py <r1 capture dir> <p0 capture dir> [--out docs/geo-r02c-p0/captures/default-viewer-identity.json]"""
from pathlib import Path
import argparse,json,struct,sys,zlib
import numpy as np

def decode_png(path):
 """Minimal decoder for Chromium screenshots: 8-bit RGB/RGBA, non-interlaced."""
 b=Path(path).read_bytes();assert b[:8]==b'\x89PNG\r\n\x1a\n';pos=8;idat=b'';w=h=ct=None
 while pos<len(b):
  n,=struct.unpack('>I',b[pos:pos+4]);t=b[pos+4:pos+8];d=b[pos+8:pos+8+n];pos+=12+n
  if t==b'IHDR':w,h,depth,ct,_,_,inter=struct.unpack('>IIBBBBB',d);assert depth==8 and inter==0 and ct in (2,6)
  elif t==b'IDAT':idat+=d
 bpp=3 if ct==2 else 4;raw=zlib.decompress(idat);stride=w*bpp;out=np.zeros((h,stride),np.int32);prev=np.zeros(stride,np.int32)
 for r in range(h):
  f=raw[r*(stride+1)];line=np.frombuffer(raw,np.uint8,stride,r*(stride+1)+1).astype(np.int32);cur=np.zeros(stride,np.int32)
  if f==0:cur=line
  elif f==2:cur=(line+prev)&255
  else:
   for x in range(stride):
    a=cur[x-bpp] if x>=bpp else 0;c=prev[x-bpp] if x>=bpp else 0;up=prev[x]
    if f==1:p=a
    elif f==3:p=(a+up)//2
    else:
     pa=abs(up-c);pb=abs(a-c);pc=abs(a+up-2*c);p=a if pa<=pb and pa<=pc else up if pb<=pc else c
    cur[x]=(line[x]+p)&255
  out[r]=cur;prev=cur
 return out.reshape(h,w,bpp)[...,:3]

def main():
 p=argparse.ArgumentParser();p.add_argument('r1',type=Path);p.add_argument('p0',type=Path);p.add_argument('--out',type=Path);a=p.parse_args()
 A={c['view']:c for c in json.loads((a.r1/'capture-manifest.json').read_text())['captures']};B={c['view']:c for c in json.loads((a.p0/'capture-manifest.json').read_text())['captures']}
 rows=[];identical=0
 for v in A:
  x=decode_png(a.r1/A[v]['file']);y=decode_png(a.p0/B[v]['file']);d=np.abs(x-y).max(axis=2);h,w=d.shape
  # The R1 status panel prints a live FPS counter, so it differs run to run; compare everything else.
  keep=np.ones((h,w),bool);keep[:int(h*.41),int(w*.775):]=False;keep[int(h*.49):int(h*.52),int(w*.49):int(w*.51)]=False
  row={'view':v,'sha256R1Build':A[v]['sha256'],'sha256P0Build':B[v]['sha256'],'byteIdenticalPng':A[v]['sha256']==B[v]['sha256'],
   'comparedPixels':int(keep.sum()),'pixelsDifferingOutsideUi':int((d[keep]>0).sum()),'maxChannelDiffOutsideUi':int(d[keep].max()),'pixelsDifferingInUiPanel':int((d[~keep]>0).sum())}
  row['cameraIdentical']=A[v]['camera']==B[v]['camera'] and A[v]['yaw']==B[v]['yaw'] and A[v]['pitch']==B[v]['pitch']
  identical+=row['pixelsDifferingOutsideUi']==0 and row['cameraIdentical'];rows.append(row)
 out={'method':'same machine, same Chromium/SwiftShader, default URL (no review parameters), UI visible in both builds; the top-right status panel (live FPS text) and crosshair are excluded from the pixel comparison',
  'summary':f'{identical} of {len(rows)} R1 views are pixel-identical outside the UI panel, with identical cameras, between the untouched R1 build and the P0 build','views':rows}
 text=json.dumps(out,indent=1)+'\n'
 if a.out:a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(text)
 print(text)

if __name__=='__main__':main()
