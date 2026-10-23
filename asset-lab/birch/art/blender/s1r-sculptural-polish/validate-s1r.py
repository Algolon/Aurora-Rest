"""Independently reopen the actual saved S1R project. Also render baseline diagnostics."""
import bpy,bmesh,json,hashlib,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'aurora-rock-s1r.blend'))
source=next(o for o in bpy.data.objects if o.name.startswith('S1R EDITABLE'))
rock=next(o for o in bpy.data.objects if o.name.startswith('S1R RUNTIME'))
baseline=next(o for o in bpy.data.objects if o.name.startswith('S1 RUNTIME'))
original=next(o for o in bpy.data.objects if o.name.startswith('S1 EDITABLE'))
assert len(source.data.vertices)==39 and len(original.data.vertices)==34
assert len(rock.data.materials)==1 and len(rock.data.polygons)==96
assert all(len(p.vertices)==3 and not p.use_smooth for p in rock.data.polygons)
assert all(abs(x)<1e-7 for x in (*rock.location,*rock.rotation_euler)) and all(abs(x-1)<1e-7 for x in rock.scale)
labels=json.loads(source['named_vertex_indices'])
assert len(source.vertex_groups)==39
for key in ['FRONT_LEFT_BREAK','FRONT_RIGHT_BREAK','LEFT_REAR_BREAK','LEFT_SIDE_BREAK','REAR_BREAK']:assert source.vertex_groups.get(key+' • authored fracture')
for key in 'abcdefghi':assert abs(source.data.vertices[labels[key]].co.z)<1e-8
out={'blender_version':bpy.app.version_string,'saved_collections':[c.name for c in bpy.data.collections],'source_vertices':len(source.data.vertices),'source_polygons':len(source.data.polygons),'runtime_triangles':len(rock.data.polygons),'runtime_material_slots':len(rock.data.materials),'modifiers':[m.type for m in source.modifiers],'source_without_generator':True,'protected_original_cage_present':True}
for label,o in [('source',source),('runtime',rock)]:
 bm=bmesh.new();bm.from_mesh(o.data);assert all(e.is_manifold and e.is_contiguous for e in bm.edges);assert all(f.calc_area()>1e-10 for f in bm.faces);bm.free()
 max_warp=0
 for p in o.data.polygons:
  co=[o.data.vertices[i].co for i in p.vertices];center=sum(co,Vector())/len(co);max_warp=max(max_warp,max(abs((v-center).dot(p.normal)) for v in co))
 out[label+'_max_face_nonplanarity_m']=max_warp
out['hashes']={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['aurora-rock-s1r.blend','aurora-rock-s1r.glb']}
out['bytes']={f:(ROOT/f).stat().st_size for f in ['aurora-rock-s1r.blend','aurora-rock-s1r.glb']}
(ROOT/'saved-blend-validation.json').write_text(json.dumps(out,indent=2)+'\n')
# Additional original diagnostic renders, with exactly the same cameras/light as S1R.
scene=bpy.context.scene;cam=scene.camera;rock.hide_render=True;baseline.hide_render=False
neutral=baseline.data.materials[0]
def render(name):
 cam.data.type='ORTHO';cam.data.ortho_scale=3.2;cam.data.lens=52;cam.location=(3.3,-5,2.6);cam.rotation_euler=(Vector((0,0,.78))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(ROOT/'baseline'/(name+'.png'));bpy.ops.render.render(write_still=True)
sil=next(m for m in bpy.data.materials if m.name.startswith('S1R silhouette emission'));baseline.data.materials[0]=sil;render('silhouette');baseline.data.materials[0]=neutral
wire=original.copy();wire.data=original.data.copy();scene.collection.objects.link(wire);wire.hide_set(False);wire.hide_render=False;wire.data.materials.clear();wire.data.materials.append(sil);mod=wire.modifiers.new('Original source edges','WIREFRAME');mod.thickness=.003;mod.use_replace=True
render('wireframe');wire.hide_render=True
for i,c in enumerate([(.36,.44,.53),(.56,.47,.36),(.40,.50,.44),(.58,.56,.52),(.34,.40,.48),(.63,.54,.42)]):
 m=neutral.copy();m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*c,1);baseline.data.materials.append(m)
for p in baseline.data.polygons:
 n=p.normal;axis=max(range(3),key=lambda i:abs(n[i]));p.material_index=1+axis*2+int(n[axis]<0)
render('large-planes')
# No resave: saved geometry/hash remains the actual final modeling file.
print('S1R_SAVED_PROJECT_PASS',json.dumps(out))
