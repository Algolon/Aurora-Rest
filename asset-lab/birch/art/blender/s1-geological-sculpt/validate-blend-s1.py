"""Read actual saved .blend, independent of the constructor; no rendering or resave."""
import bpy,bmesh,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'aurora-rock-s1.blend'))
source=next(o for o in bpy.data.objects if o.name.startswith('S1 EDITABLE'))
rock=next(o for o in bpy.data.objects if o.name.startswith('S1 RUNTIME'))
assert source.type==rock.type=='MESH'
assert len(source.data.polygons)<len(rock.data.polygons)
assert all(abs(x-1)<1e-7 for x in rock.scale)
assert all(abs(x)<1e-7 for x in (*rock.location,*rock.rotation_euler))
results={}
for label,o in [('source',source),('runtime',rock)]:
 bm=bmesh.new();bm.from_mesh(o.data)
 assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
 assert all(f.calc_area()>1e-10 for f in bm.faces)
 assert bm.calc_volume(signed=True)>0
 bm.free()
 o.data.calc_loop_triangles()
 vol=sum(o.data.vertices[t.vertices[0]].co.dot(o.data.vertices[t.vertices[1]].co.cross(o.data.vertices[t.vertices[2]].co))/6 for t in o.data.loop_triangles)
 results[label]={'name':o.name,'vertices':len(o.data.vertices),'polygons':len(o.data.polygons),'triangles':len(o.data.loop_triangles),'triangulated_volume_m3':vol,'flat_polygons':all(not p.use_smooth for p in o.data.polygons),'vertex_groups':len(o.vertex_groups)}
assert source.vertex_groups.get('R • integrated hinge')
assert rock.data.uv_layers and rock.data.color_attributes
results['blender_version']=bpy.app.version_string
results['saved_collections']=[c.name for c in bpy.data.collections]
results['blend_sha256']=hashlib.sha256((ROOT/'aurora-rock-s1.blend').read_bytes()).hexdigest()
results['glb_sha256']=hashlib.sha256((ROOT/'aurora-rock-s1.glb').read_bytes()).hexdigest()
results['constructor_dependency']='None to open/edit the saved mesh; script retained for reproduction'
(ROOT/'saved-blend-validation.json').write_text(json.dumps(results,indent=2)+'\n')
print('S1_SAVED_BLEND_PASS',json.dumps(results))
