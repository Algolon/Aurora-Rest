"""ROCK-R01G Three.js-first: check REAL published model packages before import.
This is discovery of legitimate authored scans, not new geometry generation."""
import json,pathlib,urllib.request
out=pathlib.Path("asset-lab/birch/rocks/r01g3/probe")
out.mkdir(parents=True,exist_ok=True)
ids=["rock_moss_set_02","rock_moss_set_01","namaqualand_boulder_03"]
def read(id):
 u="https://api.polyhaven.com/"+id
 req=urllib.request.Request(u,headers={"User-Agent":"AuroraRest-NaturalShapeResearch/1.0 (+https://github.com/Algolon/Aurora-Rest)","Accept":"application/json"})
 with urllib.request.urlopen(req,timeout=45) as r:return json.load(r)
def recurse(x,path=""):
 result=[]
 if isinstance(x,dict):
  if isinstance(x.get("url"),str):
   result.append({"path":path,"url":x["url"],"size":x.get("size"),"md5":x.get("md5"),"include":x.get("include")})
  else:
   for k,v in x.items():result+=recurse(v,path+"/"+k)
 elif isinstance(x,list):
  for i,v in enumerate(x):result+=recurse(v,path+"/"+str(i))
 return result
rows=[]
for id in ids:
 try:
  info=read("info/"+id);files=read("files/"+id)
  all=recurse(files)
  minimal=[x for x in all if any(t in x["path"].lower() for t in ["gltf","glb"])]
  (out/(id+"-filetree.json")).write_text(json.dumps(files,indent=2)[:250000])
  rows.append({"id":id,"name":info.get("name"),"authors":info.get("authors"),"fileTreeRootKeys":list(files.keys()),"gltfCandidates":minimal[:20],"first12Files":all[:12]})
 except Exception as e:rows.append({"id":id,"error":str(e)})
(out/"report.json").write_text(json.dumps(rows,indent=2)+"\n")
for x in rows:
 print("MODEL",x["id"],"root",x.get("fileTreeRootKeys"),"glTF",[(a["path"],a.get("size")) for a in x.get("gltfCandidates",[])][:9],"ERROR",x.get("error"))
if not any(x.get("gltfCandidates") for x in rows):raise RuntimeError("No validated legitimate geometry packages")
