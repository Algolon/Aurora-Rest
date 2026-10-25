#!/usr/bin/env python3
"""ROCK-R01H input-gated QA for OFFICIALLY obtained Sketchfab glTF ZIP / GLB.

Only checks provenance + basic source metadata; does not "create an original rock".
Usage: python inspect_authorized_gltf.py /path/to/official-sketchfab-download.zip --out /tmp/R01H-evidence.json
Never download Sketchfab viewer fragments or use private credentials.
"""
from __future__ import annotations
import argparse,hashlib,json,os,pathlib,struct,sys,zipfile
p=argparse.ArgumentParser(description="Inspect official, authorized Kummakivi model archive")
p.add_argument("source",help="User-provided original Sketchfab ZIP (.gltf+.bin) or .glb")
p.add_argument("--out",default="R01H-inspection.json")
args=p.parse_args()
src=pathlib.Path(args.source)
if not src.is_file() or src.stat().st_size>250_000_000:raise SystemExit("No file or source exceeds 250MB")
raw=src.read_bytes();inputSha=hashlib.sha256(raw).hexdigest()
manifest=[]
def fail(why):raise SystemExit("R01H SOURCE INVALID: "+why)
if zipfile.is_zipfile(src):
 with zipfile.ZipFile(src) as z:
  members=z.infolist()
  if len(members)>400:fail("excessive archive entries")
  if sum(i.file_size for i in members)>700_000_000:fail("excessive decompressed size")
  for i in members:
   clean=pathlib.PurePosixPath(i.filename.replace("\\","/"))
   if clean.is_absolute() or ".." in clean.parts:fail("unsafe archive path: "+i.filename)
   if (i.external_attr>>16)&0o170000==0o120000:fail("symlink in archive")
   if i.file_size>250_000_000:fail("oversized archive entry")
   manifest.append({"file":i.filename,"bytes":i.file_size})
  gltfs=[i for i in members if i.filename.lower().endswith(".gltf")]
  glbs=[i for i in members if i.filename.lower().endswith(".glb")]
  if gltfs:
   if len(gltfs)>2:fail("ambiguous multiple glTF scenes")
   data=json.loads(z.read(gltfs[0]).decode("utf-8"))
   mode="ZIP-GLTF"
   for b in data.get("buffers",[]):
    uri=b.get("uri","")
    if uri.startswith("data:"):continue
    parent=pathlib.PurePosixPath(gltfs[0].filename).parent
    needle=str(parent/uri)
    if needle not in z.namelist():fail("missing declared buffer "+needle)
    meta=z.getinfo(needle)
    if meta.file_size<int(b.get("byteLength",0)):fail("short buffer "+needle)
  elif glbs:
   mode="ZIP-GLB"
   candidate=z.read(glbs[0]);data=None
  else:fail("archive contains neither glTF nor GLB")
else:
 mode="GLB";candidate=raw;data=None
if data is None:
 if candidate[:4]!=b"glTF" or len(candidate)<20:fail("not a binary glTF model")
 version,total=struct.unpack_from("<II",candidate,4)
 if version!=2 or total!=len(candidate):fail("invalid GLB header/version/length")
 n,kind=struct.unpack_from("<I4s",candidate,12)
 if kind!=b"JSON" or n+20>len(candidate):fail("invalid glTF JSON chunk")
 data=json.loads(candidate[20:20+n])
a=data.get("accessors",[]);primitives=[]
for j,mesh in enumerate(data.get("meshes",[])):
 for k,q in enumerate(mesh.get("primitives",[])):
  posindex=q.get("attributes",{}).get("POSITION")
  if posindex is None or not 0<=posindex<len(a):continue
  ix=q.get("indices")
  count=int(a[ix]["count"]) if isinstance(ix,int) and ix<len(a) else int(a[posindex]["count"])
  primitives.append({
   "mesh":j,"primitive":k,"geometryCount":count,
   "estimatedTriangleCount":count//3 if q.get("mode",4)==4 else None,
   "posAccessor":posindex,"min":a[posindex].get("min"),"max":a[posindex].get("max"),
   "hasNormal":"NORMAL" in q.get("attributes",{}),
   "hasUV":"TEXCOORD_0" in q.get("attributes",{}),
   "hasColor":"COLOR_0" in q.get("attributes",{})})
if not primitives:fail("no accessible mesh POSITION primitives")
result={
 "milestone":"ROCK-R01H","authorization":"source supplied separately by authorized downloader",
 "sourceFilename":src.name,"sourceBytes":src.stat().st_size,"sha256":inputSha,"mode":mode,
 "objects":len(data.get("nodes",[])),"meshes":len(data.get("meshes",[])),
 "primitives":primitives,"fileManifest":manifest,
 "outputIsOriginalRock":False,"artisticallyApproved":False,
 "watertightnessVerified":False,"full360Verified":False,"webglVerified":False,
 "sourceLocked":"exact named model Kummakivi d8e3b15292df46f096faf488eeeb5ca0",
 "authorAttribution":"Lassi Kaukonen / thesidekick · CC BY 4.0 · https://sketchfab.com/3d-models/kummakivi-d8e3b15292df46f096faf488eeeb5ca0"
}
out=pathlib.Path(args.out);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(result,indent=2)+"\n")
print("R01H AUTHORIZED SOURCE METADATA PASS",len(primitives),"mesh primitives, SHA256",inputSha)
print("NOTE: render geometry and art approval still NOT performed")
