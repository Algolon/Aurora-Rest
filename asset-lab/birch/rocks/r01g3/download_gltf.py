"""Download only publicly published 1K glTF model files from Poly Haven CC0.
Use the live API manifest URL and verify each supplier MD5, preserve original bytes.
Nothing is modified or generated; these files exist only in CI + review artifact.
"""
import hashlib,json,pathlib,urllib.request,os
ID="rock_moss_set_02"
OUT=pathlib.Path("public/r01g3"); OUT.mkdir(parents=True,exist_ok=True)
reqhdr={"User-Agent":"AuroraRest-R01G-GenuineThreeJS/1.0 (+https://github.com/Algolon/Aurora-Rest)"}
def download(url):
 req=urllib.request.Request(url,headers=reqhdr)
 with urllib.request.urlopen(req,timeout=90) as response:
  data=response.read(16_000_001)
 if len(data)>16_000_000:raise RuntimeError("Oversize untrusted source delivery")
 return data
filetree=json.loads(download("https://api.polyhaven.com/files/"+ID))
main=filetree["gltf"]["1k"]["gltf"]
outputs={f"{ID}_1k.gltf":main,**main["include"]}
for relative,entry in outputs.items():
 url=entry["url"];p=OUT/relative
 if not p.resolve().is_relative_to(OUT.resolve()):raise RuntimeError("Path escaping "+relative)
 data=download(url)
 md5=hashlib.md5(data).hexdigest()
 if md5!=entry["md5"]:raise RuntimeError("Official Poly Haven MD5 mismatch "+relative)
 p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
 print("VERIFIED SOURCE",relative,len(data),md5)
gltf=json.loads((OUT/(ID+"_1k.gltf")).read_text())
for asset in gltf.get("buffers",[]):
 p=OUT/asset["uri"]
 if not p.exists():raise RuntimeError("Missing required buffer "+asset["uri"])
for img in gltf.get("images",[]):
 if "uri" in img and not (OUT/img["uri"]).exists():raise RuntimeError("Missing material image "+img["uri"])
meta={
 "source":"https://polyhaven.com/a/"+ID,"author":"Kless Gyzen",
 "license":"CC0 1.0","officialLicense":"https://polyhaven.com/license",
 "files":[{"name":str(k),"sha256":hashlib.sha256((OUT/k).read_bytes()).hexdigest(),
           "bytes":(OUT/k).stat().st_size} for k in outputs],
 "gltfNodes":len(gltf.get("nodes",[])),"gltfMeshes":len(gltf.get("meshes",[])),
 "gltfScenes":len(gltf.get("scenes",[])),
 "gltfGeometryOnly":False,"geometryModified":False,"artApproved":False,
 "provenance":"real externally authored Poly Haven model; not a 3D scan of Myrstigen or Kummakivi"}
(OUT/"provenance.json").write_text(json.dumps(meta,indent=2)+"\n")
print("REAL GLTF SOURCE PASS",meta["gltfMeshes"],"meshes",meta["gltfNodes"],"nodes")
