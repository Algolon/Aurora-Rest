import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
p=ROOT.parent/'s1r-sculptural-polish'/'aurora-rock-s1r.blend'
bpy.ops.wm.open_mainfile(filepath=str(p))
s=next(o for o in bpy.data.objects if o.name.startswith('S1R EDITABLE'))
r=next(o for o in bpy.data.objects if o.name.startswith('S1R RUNTIME'))
assert len(s.data.vertices)==39 and len(r.data.polygons)==96
assert hasattr(bpy.ops.export_scene,'gltf')
(ROOT/'preflight.json').write_text(json.dumps({'blender_version':bpy.app.version_string,'build_hash':bpy.app.build_hash.decode(),'actual_s1r_loaded':True,'editable_vertices':len(s.data.vertices),'runtime_triangles':len(r.data.polygons),'s1r_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'gltf_operator_available':True},indent=2)+'\n')
print('F01_PREFLIGHT_PASS',bpy.app.version_string)
