"""ROCK-R01G-B read-only CC0 source acquisition via official Poly Haven API.
Two sources maximum. All received files individually MD5 checked. No Blender/no geometry edits.
"""
import hashlib,json,pathlib,urllib.request
IDS=("rock_moss_set_01","namaqualand_boulder_02")
ROOT=pathlib.Path("public/r01gb")
HEADERS={"User-Agent":"AuroraRest-R01GB-GenuineThreeJS/1.0 (+https://github.com/Algolon/Aurora-Rest)"}
def fetch(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=90) as r:
  raw=r.read(25_000_001)
 if len(raw)>25_000_000:raise RuntimeError("Source exceeds 25MB per file")
 return raw
records=[]
for asset_id in IDS:
 path=ROOT/asset_id;path.mkdir(parents=True,exist_ok=True)
 api=json.loads(fetch("https://api.polyhaven.com/files/"+asset_id))
 top=api["gltf"]["1k"]["gltf"]
 entries={asset_id+"_1k.gltf":top,**top["include"]}
 for name,entry in entries.items():
  dst=path/name
  if not dst.resolve().is_relative_to(path.resolve()):raise ValueError("Path traversal in published manifest")
  raw=fetch(entry["url"])
  md5=hashlib.md5(raw).hexdigest()
  if md5!=entry["md5"]:raise ValueError("MD5 mismatch: "+name)
  dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(raw)
  records.append({"asset":asset_id,"file":name,"bytes":len(raw),"md5":md5,"sha256":hashlib.sha256(raw).hexdigest()})
 gltf=json.loads((path/(asset_id+"_1k.gltf")).read_bytes())
 for b in gltf.get("buffers",[]):
  if not (path/b["uri"]).is_file():raise ValueError("Missing glTF buffer "+str(b))
 for img in gltf.get("images",[]):
  if "uri" in img and not (path/img["uri"]).is_file():raise ValueError("Missing image "+str(img))
 print("SOURCE VERIFIED",asset_id,"meshes",len(gltf.get("meshes",[])),"nodes",len(gltf.get("nodes",[])))
report={"title":"R01G-B two real source packages","license":"CC0", "verifiedFromOfficialPolyHavenAPI":True,
        "sources":[{"asset":"rock_moss_set_01","source":"https://polyhaven.com/a/rock_moss_set_01","author":"Kless Gyzen"},
                   {"asset":"namaqualand_boulder_02","source":"https://polyhaven.com/a/namaqualand_boulder_02","authors":"Greg Zaal, Rico Cilliers"}],
        "hashes":records,"artApproved":False,"worldIntegrated":False,"geometryModified":False}
ROOT.mkdir(parents=True,exist_ok=True)
(ROOT/"source-manifest.json").write_text(json.dumps(report,indent=2)+"\n")
