#!/usr/bin/env python3
"""ROCK-R01H: metadata-only verification of REAL named geological specimens.
Non-invasive public Sketchfab API. NEVER rip viewer data or bypass protected download.
No Three.js geometry work until actual licensed original download is authorized.
"""
import json,urllib.request,urllib.error,urllib.parse,pathlib,time
ROOT=pathlib.Path("asset-lab/birch/rocks/r01h")
OUT=ROOT/"evidence";OUT.mkdir(parents=True,exist_ok=True)
HEADER={"User-Agent":"AuroraRest-ROCK-R01H-Research/1.0 (+https://github.com/Algolon/Aurora-Rest)","Accept":"application/json"}
QUERIES=["Kummakivi","The Cumberland Stone Culloden","Cloughmore Stone Rostrevor","Split Granite Boulder","Glacial Boulder in Cannock Chase"]
MAX_MODELS=6
results=[]
def read(url):
 req=urllib.request.Request(url,headers=HEADER)
 try:
  with urllib.request.urlopen(req,timeout=22) as response:
   return json.load(response),response.status
 except urllib.error.HTTPError as e:
  return {"error":"HTTP "+str(e.code),"reason":str(e.reason)},e.code
 except Exception as e:
  return {"error":type(e).__name__+": "+str(e)},None
for q in QUERIES:
 url="https://api.sketchfab.com/v3/search?"+urllib.parse.urlencode({"type":"models","q":q,"count":MAX_MODELS})
 info,status=read(url)
 item={"term":q,"apiURL":url,"http":status,"total":info.get("count"),"error":info.get("error"),"candidates":[]}
 for entry in info.get("results",[])[:MAX_MODELS]:
  uid=entry.get("uid")
  d,detailstatus=read("https://api.sketchfab.com/v3/models/"+uid) if uid else ({},None)
  licenseObj=d.get("license") or entry.get("license") or {}
  if isinstance(licenseObj,str):licenseObj={"label":licenseObj}
  item["candidates"].append({
   "uid":uid,"name":d.get("name",entry.get("name")),
   "modelURL":d.get("viewerUrl") or entry.get("viewerUrl") or ("https://sketchfab.com/models/"+str(uid)),
   "creator":(d.get("user") or entry.get("user") or {}).get("username"),
   "description":str(d.get("description") or "")[:1200],
   "downloadable":d.get("isDownloadable",entry.get("isDownloadable")),
   "license":{k:licenseObj.get(k) for k in ["label","uid","slug","url"]},
   "faces":d.get("faceCount") or entry.get("faceCount"),
   "vertices":d.get("vertexCount") or entry.get("vertexCount"),
   "sourceDate":d.get("createdAt"),"detailHTTP":detailstatus
  })
 results.append(item)
 print("RESULT",q,"HTTP",status,"count",item["total"],"matches",[(r["name"],r["uid"],r["downloadable"],r["license"].get("label")) for r in item["candidates"]])
 time.sleep(.2)
manifest={
 "milestone":"ROCK-R01H","sourceType":"public official metadata only",
 "modeled":False,"meshAcquired":False,"downloadAuthorization":False,
 "licenseStatus":"per-model verification; permission to VIEW a model is NOT permission to EXTRACT it",
 "ownerDirection":"A / Myrstigen localized weathering + Kummakivi whole mass",
 "sources":results,"queryCount":len(results),
 "archiveBaseline":"eb80cca2b3a04d77ec37ac93daa98c18ee4906cc",
 "ethics":"No viewer extraction, authenticated download bypass or implied rights over source images"
}
(OUT/"sketchfab-specimen-metadata.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n")
# Source URLs are human navigational links, not artificial download promises.
with (OUT/"HUMAN_REVIEW.md").open("w") as f:
 f.write("# R01H genuine named specimens: metadata probe\n\n")
 for e in results:
  f.write("## "+e["term"]+"\n\n")
  f.write("API HTTP: "+str(e["http"])+"; public results "+str(e["total"])+"\n\n")
  for m in e["candidates"]:
   f.write("- ["+str(m["name"])+"]("+str(m["modelURL"])+") by "+str(m["creator"])+" — downloadable="+str(m["downloadable"])+", license="+str(m["license"].get("label"))+", triangles="+str(m["faces"])+"\n")
  f.write("\n")
 print("R01H_PUBLIC_SPECIMEN_METADATA_COMPLETE",len(results))
