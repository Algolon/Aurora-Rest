#!/usr/bin/env python3
"""Aurora Rest ROCK-R01F: authentic licensed source-geometry morphology audit.

NO procedural/generated boulder mesh, no artificial cracks, NO new modeling.
Only download a published CC0 natural model, inspect its actual geometry, render
plain-clay evidence and preserve the original GLB for voluntary owner comparison.
CC0 source geometry remains identified by its real creator.
"""
from __future__ import annotations
import hashlib, json, os, pathlib, ssl, sys, urllib.request
import numpy as np
import trimesh
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

ROOT=pathlib.Path(__file__).resolve().parent
OUT=ROOT/"evidence"
OUT.mkdir(parents=True, exist_ok=True)
SOURCE_URL="https://www.innerscene.com/api/library/boulder-c2eeb692/download"
OFFICIAL_URL="https://polyhaven.com/a/boulder_01"
TARGET=OUT/"boulder-01-original-CC0-from-polyhaven.glb"
req=urllib.request.Request(SOURCE_URL,headers={
 "User-Agent":"AuroraRest-R01F-NaturalShapeResearch/1.0 (CC0 editorial evaluation)",
 "Accept":"application/octet-stream,application/gltf-binary,*/*"
})
with urllib.request.urlopen(req,timeout=110,context=ssl.create_default_context()) as resp:
 with TARGET.open("wb") as fp:
  total=0
  while True:
   chunk=resp.read(1024*1024)
   if not chunk:break
   total+=len(chunk)
   if total>80_000_000:raise ValueError("source exceeds 80MB guard")
   fp.write(chunk)
data=TARGET.read_bytes()
if data[:4]!=b"glTF" or len(data)<100_000:
 raise RuntimeError("Not an actual GLB: "+str(len(data))+" bytes "+repr(data[:30]))
assert int.from_bytes(data[4:8],"little")==2
actual_size=int.from_bytes(data[8:12],"little")
if actual_size!=len(data):
 raise RuntimeError("GLB length mismatch")
digest=hashlib.sha256(data).hexdigest()
scene=trimesh.load(str(TARGET),force="scene",process=False)
meshes=[g for g in scene.geometry.values() if isinstance(g,trimesh.Trimesh)]
if not meshes:raise RuntimeError("No scan geometry, not a 3D source")
# Apply scene-instance transforms using actual world-geometry export.
mesh=scene.to_geometry() if hasattr(scene,"to_geometry") else scene.dump(concatenate=True)
if not isinstance(mesh,trimesh.Trimesh):
 mesh=trimesh.util.concatenate(meshes)
if len(mesh.faces)<1000 or not np.isfinite(mesh.vertices).all():
 raise RuntimeError("Geometry insufficient or nonfinite")
bounds=mesh.bounds.copy()
size=bounds[1]-bounds[0]
if max(size)>1000 or min(size)<=0:raise ValueError("invalid scale "+str(size))
# Render original scanned triangles (subset for graphic preview only).
# This sampling affects ONLY the preview; original mesh remains untouched.
vertices=np.asarray(mesh.vertices)
faces=np.asarray(mesh.faces)
rng=np.random.default_rng(1301)
sample=faces[rng.choice(len(faces),size=min(len(faces),4500),replace=False)]
# No normal/displacement/noise operations are applied to the rock itself.
points=vertices[sample]
center=bounds.mean(axis=0)
points=(points-center)
normals=np.cross(points[:,1,:]-points[:,0,:],points[:,2,:]-points[:,0,:])
nrm=normals/(np.linalg.norm(normals,axis=1,keepdims=True)+1e-10)
light=np.array([-.38,.52,.76]);light/=np.linalg.norm(light)
shade=.46+.42*np.clip(np.sum(nrm*light,axis=1),0,1)
grey=np.stack([shade*.92,shade*.96,shade],axis=1)
views=[("front",20,-90),("front-three-quarter",24,-45),("side",18,0),("rear-three-quarter",22,135),("rear",20,90),("top",89,-90)]
ext=np.max(size)*.72
for name,elev,azim in views:
 fig=plt.figure(figsize=(8.5,6.5),dpi=120,facecolor="#e9ebe9")
 ax=fig.add_subplot(111,projection="3d",computed_zorder=False)
 ax.set_facecolor("#e9ebe9")
 pc=Poly3DCollection(points,facecolors=grey,edgecolors="none",linewidths=0,zsort="average")
 ax.add_collection3d(pc)
 ax.set(xlim=(-ext,ext),ylim=(-ext,ext),zlim=(-ext,ext))
 ax.set_box_aspect([1,1,1],zoom=1.25)
 ax.view_init(elev=elev,azim=azim)
 ax.set_proj_type("ortho")
 ax.set_axis_off()
 fig.suptitle("ROCK-R01F | authentic CC0 natural model, not Aurora A",fontsize=14)
 ax.set_title(name.replace("-"," ").upper()+" | geometry review, no styling or shaping",fontsize=10)
 fig.savefig(OUT/f"{name}.png",bbox_inches="tight",pad_inches=.13,facecolor=fig.get_facecolor())
 plt.close(fig)
metrics={
 "milestone":"ROCK-R01F","study":"SOURCE SCAN FEASIBILITY ONLY","approvedForAurora":False,
 "geometrySource":"Poly Haven Boulder 01, Rico Cilliers",
 "officialSource":OFFICIAL_URL,"downloadedFrom":SOURCE_URL,
 "license":"CC0 1.0","licenseOfficial":"https://polyhaven.com/license",
 "assetName":"Boulder 01","rawGLBBytes":len(data),"sha256":digest,
 "vertices":len(mesh.vertices),"triangles":len(mesh.faces),
 "components":len(mesh.split(only_watertight=False)),
 "watertight":bool(mesh.is_watertight),
 "boundsSourceUnits":np.round(bounds,5).tolist(),
 "sourceDimensions":np.round(size,5).tolist(),
 "imagesRendered":len(views),"renderer":"Matplotlib original triangle 3D preview; NOT WebGL",
 "preservedOriginalScan":True,"modifiedSourceGeometry":False,
 "relevance":"Real scanned geometry to test natural surface hierarchy; not Myrstigen nor Kummakivi",
 "limitations":["The scanned asset is a separate unidentified specimen, not a reconstruction of selected reference A",
 "Renders use sampled original surface triangles for faster diagnostic only",
 "This workflow is not a hand-made Blender sculpt; no owner art approval, integration or deployment"]
}
(OUT/"metadata.json").write_text(json.dumps(metrics,indent=2)+"\n")
print("ROCK-R01F SCAN VERIFIED",len(mesh.faces),"tris",len(data),"bytes; SHA256",digest)
print("REVIEW LIMITATION: not R01E variant A, and no artistic approval")
