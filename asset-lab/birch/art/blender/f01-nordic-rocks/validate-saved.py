"""Independent reopen of saved projects and GLBs, without executing their builder."""
import bpy,bmesh,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
reports={}
for key in ['broad-glacial','sculptural']:
 p=R/key;bpy.ops.wm.open_mainfile(filepath=str(p/('aurora-'+key+'.blend')))
 source=next(o for o in bpy.data.collections['01 EDITABLE • authored geological cage'].objects if o.type=='MESH')
 runtime=next(o for o in bpy.data.collections['02 EXPORT • evaluated triangles'].objects if o.type=='MESH')
 def inspect(o):
  bm=bmesh.new();bm.from_mesh(o.data);bm.normal_update()
  assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
  assert all(f.calc_area()>1e-10 for f in bm.faces)
  assert bm.calc_volume(signed=True)>0
  assert list(o.location)==[0,0,0] and list(o.scale)==[1,1,1] and list(o.rotation_euler)==[0,0,0]
  unseen=set(bm.verts);components=0
  while unseen:
   components+=1;stack=[unseen.pop()]
   while stack:
    v=stack.pop()
    for e in v.link_edges:
     q=e.other_vert(v)
     if q in unseen:unseen.remove(q);stack.append(q)
  assert components==1
  out={'vertices':len(bm.verts),'faces':len(bm.faces),'components':components,'signed_volume':bm.calc_volume(signed=True),'manifold':True};bm.free();return out
 result={'blender':bpy.app.version_string,'source':inspect(source),'runtime':inspect(runtime),'source_vertex_groups':len(source.vertex_groups),'collections':[c.name for c in bpy.data.collections],'source_modifiers':[m.type for m in source.modifiers]}
 assert len(source.vertex_groups)==len(source.data.vertices)
 assert 'geological_patch' in source.data.attributes
 for name in ['UVMap']:assert name in runtime.data.uv_layers
 assert 'Color' in runtime.data.color_attributes
 assert all(len(f.vertices)==3 and not f.use_smooth for f in runtime.data.polygons)
 coords=sorted(tuple(round(x,5) for x in v.co) for v in runtime.data.vertices)
 bpy.ops.object.select_all(action='DESELECT');bpy.ops.import_scene.gltf(filepath=str(p/('aurora-'+key+'.glb')))
 imported=[o for o in bpy.context.selected_objects if o.type=='MESH'];assert len(imported)==1
 obj=imported[0];obj.data.calc_loop_triangles();assert len(obj.data.loop_triangles)==len(runtime.data.polygons)
 # Imported seams duplicate vertices. Compare the complete spatial set and oriented triangle positions.
 assert set(coords)==set(tuple(round(x,5) for x in v.co) for v in obj.data.vertices)
 def triangles(me):
  me.calc_loop_triangles();return sorted(tuple(sorted(tuple(round(x,5) for x in me.vertices[i].co) for i in t.vertices)) for t in me.loop_triangles)
 assert triangles(obj.data)==triangles(runtime.data)
 result['glb_reimport_triangle_positions_match']=True
 result['files']={f.name:{'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in [p/('aurora-'+key+'.blend'),p/('aurora-'+key+'.glb')]}
 reports[key]=result
(R/'saved-project-validation.json').write_text(json.dumps(reports,indent=2)+'\n')
print('F01_SAVED_PROJECT_VALIDATION_PASS',json.dumps(reports))
