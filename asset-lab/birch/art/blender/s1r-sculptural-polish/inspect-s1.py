"""S1R preflight: inspect actual protected source and render unchanged baseline."""
import bpy,bmesh,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
S1=ROOT.parent/'s1-geological-sculpt'
bpy.ops.wm.open_mainfile(filepath=str(S1/'aurora-rock-s1.blend'))
scene=bpy.context.scene
source=next(o for o in bpy.data.objects if o.name.startswith('S1 EDITABLE'))
rock=next(o for o in bpy.data.objects if o.name.startswith('S1 RUNTIME'))
assert len(source.data.vertices)==34 and len(source.data.polygons)==29
labels={v.index:next(source.vertex_groups[g.group].name.split(' • ')[0] for g in v.groups if g.weight>.99) for v in source.data.vertices}
patches=json.loads(source['patch_names'])
inspection={'blender_version':bpy.app.version_string,'bpy_access':True,'input_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [S1/'aurora-rock-s1.blend',S1/'aurora-rock-s1.glb']},'collections':{},'vertices':{},'faces':[]}
for c in bpy.data.collections:
 inspection['collections'][c.name]=[{'name':o.name,'type':o.type,'modifiers':[m.type for m in o.modifiers],'materials':[m.name if m else None for m in o.data.materials] if o.type=='MESH' else []} for o in c.objects]
for v in source.data.vertices:inspection['vertices'][labels[v.index]]=list(v.co)
for p in source.data.polygons:
 vs=[source.data.vertices[i].co for i in p.vertices];center=sum(vs,Vector())/len(vs)
 dist=max(abs((v-center).dot(p.normal)) for v in vs)
 inspection['faces'].append({'index':p.index,'name':patches[p.index],'vertices':[labels[i] for i in p.vertices],'max_distance_from_polygon_plane_m':dist,'normal':list(p.normal),'area_m2':p.area})
# Mesh editing/save/export are exercised on disposable copies, never protected files.
test=source.copy();test.data=source.data.copy();scene.collection.objects.link(test);test.name='DISPOSABLE preflight edit';test.data.vertices[0].co.x+=.001;test.data.vertices[0].co.x-=.001
bpy.ops.wm.save_as_mainfile(filepath='/private/tmp/s1r-preflight.blend')
bpy.data.objects.remove(test,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT');rock.hide_set(False);rock.select_set(True);bpy.context.view_layer.objects.active=rock
bpy.ops.export_scene.gltf(filepath='/private/tmp/s1r-preflight.glb',export_format='GLB',use_selection=True,export_yup=True,export_normals=True,export_texcoords=True,export_materials='EXPORT',export_cameras=False,export_lights=False,export_animations=False,export_vertex_color='NAME',export_vertex_color_name='Color')
inspection['disposable_edit_save_export']='PASS'
(ROOT/'s1-inspection.json').write_text(json.dumps(inspection,indent=2)+'\n')
scene.render.engine='CYCLES';scene.cycles.samples=20;scene.render.resolution_x=1000;scene.render.resolution_y=820;scene.render.resolution_percentage=100
cam=scene.camera
views={'front':(0,-6,.90),'rear':(0,6,.90),'left':(-6,0,.90),'right':(6,0,.90),'threequarter-front':(3.3,-5,2.6),'threequarter-rear':(-3.8,4.5,2.7),'top':(.0001,0,7),'human-height':(2.9,-4.4,1.70)}
for name,loc in views.items():
 cam.data.type='PERSP' if name=='human-height' else 'ORTHO';cam.data.ortho_scale=3.2;cam.data.lens=52;cam.location=loc;cam.rotation_euler=(Vector((0,0,.78))-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/'baseline'/(name+'.png'));bpy.ops.render.render(write_still=True)
print('S1R_PREFLIGHT_PASS',bpy.app.version_string,'original cage',len(source.data.vertices),len(source.data.polygons))
