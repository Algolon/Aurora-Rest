"""S1: one explicitly laid out geological surface. No Boolean, hull, noise or subdivision.
Blender coordinates: X right, -Y front, Z up. Metres. Run from any directory.
"""
import bpy, bmesh, json, math, os, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.render.engine='CYCLES'; scene.cycles.samples=24
scene.render.resolution_x=1100; scene.render.resolution_y=900; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world=bpy.data.worlds.new('Neutral studio'); scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.36,.39,.43,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
scene.view_settings.view_transform='AgX'

def collection(name):
 c=bpy.data.collections.new(name);scene.collection.children.link(c);return c
source=collection('01 EDITABLE • shared geological control cage')
export=collection('02 EXPORT • evaluated stone surface')
studio=collection('03 REVIEW • cameras and studio only')
refs=collection('04 REFERENCES • pinned unchanged Aurora meshes')
# Each row is a specific structural boundary; NOT scaled rings of one contour.
# All shoulder points belong to this SAME cage. Front joint B→C continues crown rake.
pts={
 'a':(-.70,-.59,0),'b':(.12,-.72,0),'c':(.78,-.57,0),'d':(1.02,-.22,0),
 'e':(.86,.48,0),'f':(.22,.69,0),'g':(-.64,.60,0),'h':(-.99,.12,0),'i':(-.94,-.32,0),
 'al':(-.84,-.64,.23),'bl':(.02,-.79,.18),'cl':(.72,-.68,.22),'dl':(1.06,-.24,.22),
 'el':(.93,.43,.30),'fl':(.22,.78,.26),'gl':(-.66,.66,.22),'hl':(-1.02,.10,.36),'il':(-.99,-.33,.26),
 'A':(-.75,-.54,1.18),'B':(-.10,-.65,1.10),'C':(.61,-.58,.78),'D':(1.00,-.17,.68),
 'E':(.78,.45,.91),'F':(.18,.71,1.16),'G':(-.68,.50,1.28),'H':(-.91,.06,1.12),'I':(-.88,-.31,1.12),
 # off-centre crown: broad back-left cap and two descending oblique roof planes
 'J':(-.55,-.29,1.56),'K':(-.13,-.32,1.66),'L':(.32,-.02,1.48),
 'M':(.16,.39,1.52),'N':(-.43,.40,1.60),
 # shared hinge between roof, frontal slab, and integral shoulder — no seam solid
 'R':(.38,-.640,1.00),
 'S':(.66,-.015,1.10)
}
# Geological patches have unequal area and explicitly chosen boundaries.
patches=[
 ('ground',list('ihgfedcba')),
 ('toe front-left',['a','b','bl','al']),('toe front',['b','c','cl','bl']),
 ('toe right',['c','d','dl','cl']),('toe flank',['d','e','el','dl']),
 ('toe rear',['e','f','fl','el']),('toe rear-left',['f','g','gl','fl']),
 ('toe west',['g','h','hl','gl']),('toe chip',['h','i','il','hl']),('toe corner',['i','a','al','il']),
 ('main frontal cleavage',['al','bl','B','A']),
 ('descending frontal plane',['bl','cl','C','R','B']),
 ('integral shoulder face',['cl','dl','D','C']),
 ('right supported flank',['dl','el','E','D']),
 ('rear diagonal fracture',['el','fl','F','E']),
 ('broad rear plane',['fl','gl','G','F']),
 ('west broad plane',['gl','hl','H','G']),
 ('west weathered corner',['hl','il','I','H']),('front corner',['il','al','A','I']),
 ('crown front bevel',['A','B','K','J']),
 ('long oblique roof',['B','R','S','L','K']),
 ('shoulder bridge',['R','C','D','S']),
 ('upper shoulder connecting plane',['S','D','E']),
 ('raked right roof',['S','E','M','L']),
 ('rear roof',['E','F','M']),('rear cap edge',['F','G','N','M']),
 ('left crown edge',['G','H','J','N']),('corner crown edge',['H','I','A','J']),
 ('glacial crown',['J','K','L','M','N'])
]
# Five points on one front cleavage plane; this prevents an artificial narrow seam.
for key in ['bl','cl','C','R','B']:
 x,y,z=pts[key];pts[key]=(x,-.79+.12*z+.08*x,z)
keys=list(pts);ids={k:i for i,k in enumerate(keys)}
mesh=bpy.data.meshes.new('S1 • named shared-vertex geological patches')
mesh.from_pydata(list(pts.values()),[],[[ids[k] for k in face] for _,face in patches]);mesh.update()
obj=bpy.data.objects.new('S1 EDITABLE • crown-to-shoulder cage',mesh);source.objects.link(obj)
for k,i in ids.items():
 vg=obj.vertex_groups.new(name=k+' • '+('integrated hinge' if k=='R' else 'structural point'));vg.add([i],1,'REPLACE')
obj['construction']='One shared surface, 34 structural vertices. No separately built shoulder; no union.'
obj['patch_names']=json.dumps([n for n,_ in patches])
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
# Save face ID for edit-mode inspection and plane highlighting.
attr=mesh.attributes.new('geological_patch','INT','FACE')
for i,d in enumerate(attr.data):d.value=i

def material(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.92
 return m
neutral=material('Neutral diagnostic • shape review only',(.37,.40,.44));obj.data.materials.append(neutral)
# Runtime copy is explicit triangles only where needed; source polygons stay editable.
rock=obj.copy();rock.data=obj.data.copy();rock.name='S1 RUNTIME • authored stone';export.objects.link(rock)
obj.hide_render=True;obj.hide_set(True)
# Split nonplanar patches using Blender's deterministic triangulator. The cage is retained.
# Bevel only the short crown lips and two exposed weathered vertical corners.
bm=bmesh.new();bm.from_mesh(rock.data);bm.verts.ensure_lookup_table();
chosen={tuple(sorted((ids[a],ids[b]))) for a,b in [('J','K'),('K','L'),('M','N'),('A','I'),('D','E')]}
edges=[e for e in bm.edges if tuple(sorted(v.index for v in e.verts)) in chosen]
bmesh.ops.bevel(bm,geom=edges,offset=.018,segments=1,affect='EDGES',profile=.5)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(rock.data);bm.free();rock.data.update()
rock.data.validate(verbose=True)
for p in rock.data.polygons:p.use_smooth=False
# Face-projected metric UVs, existing A2 density .38. glTF Y-up conversion is exporter-owned.
uv=rock.data.uv_layers.new(name='UVMap • local metric .38')
for p in rock.data.polygons:
 axis=max(range(3),key=lambda i:abs(p.normal[i]))
 for li in p.loop_indices:
  co=rock.data.vertices[rock.data.loops[li].vertex_index].co
  axes=(1,2) if axis==0 else (0,2) if axis==1 else (0,1)
  uv.data[li].uv=(co[axes[0]]*.38,co[axes[1]]*.38)
# Match A2 rock tint, using exported Y-up equivalent normal = Z in Blender.
colors=rock.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
for p in rock.data.polygons:
 up=max(0,p.normal.z)
 for li in p.loop_indices:colors.data[li].color=(.235+up*.034,.263+up*.036,.298+up*.037,1)
rock['source']='S1 EDITABLE • crown-to-shoulder cage';rock['art_status']='OWNER REVIEW PENDING'

def metrics(o):
 bm=bmesh.new();bm.from_mesh(o.data);bm.verts.ensure_lookup_table();bm.faces.ensure_lookup_table()
 unseen=set(bm.verts);components=0
 while unseen:
  components+=1;stack=[unseen.pop()]
  while stack:
   v=stack.pop()
   for e in v.link_edges:
    w=e.other_vert(v)
    if w in unseen:unseen.remove(w);stack.append(w)
 vol=bm.calc_volume(signed=True)
 out=dict(vertices=len(bm.verts),edges=len(bm.edges),faces_before_triangulation=len(bm.faces),
  triangles=sum(len(f.verts)-2 for f in bm.faces),connected_components=components,
  non_manifold_edges=sum(not e.is_manifold for e in bm.edges),boundary_edges=sum(e.is_boundary for e in bm.edges),
  inconsistent_edge_winding=sum(e.is_manifold and not e.is_contiguous for e in bm.edges),
  degenerate_faces=sum(f.calc_area()<1e-10 for f in bm.faces),signed_volume_m3=vol,
  euler_characteristic=len(bm.verts)-len(bm.edges)+len(bm.faces))
 bm.free();o.data.calc_loop_triangles()
 # BVH overlap diagnostic excluding triangles sharing structural vertices.
 from mathutils.bvhtree import BVHTree
 triangles=[tuple(t.vertices) for t in o.data.loop_triangles]
 tree=BVHTree.FromPolygons([v.co for v in o.data.vertices],triangles,all_triangles=True,epsilon=1e-7)
 pairs=[(a,b) for a,b in tree.overlap(tree) if a<b and not set(triangles[a])&set(triangles[b])]
 out['nonadjacent_triangle_overlap_candidates']=pairs
 out['bounds_blender']={'min':[min(v.co[k] for v in o.data.vertices) for k in range(3)],'max':[max(v.co[k] for v in o.data.vertices) for k in range(3)]}
 out['dimensions_W_H_D_m']=[o.dimensions.x,o.dimensions.z,o.dimensions.y]
 out['object_location']=list(o.location);out['object_rotation']=list(o.rotation_euler);out['object_scale']=list(o.scale)
 return out
bpy.context.view_layer.update()
report={'blender_version':bpy.app.version_string,'source':metrics(obj),'runtime':metrics(rock),'pivot':'[0,0,0] at ground plane inside support footprint','method':'hand-authored shared cage; five selective 18mm one-segment bevel edges; flat polygon normals','export':'GLB, selected runtime only, Y-up, metre scale, normals, UV, color, no camera/light/animation'}
assert report['runtime']['connected_components']==1
assert report['runtime']['non_manifold_edges']==report['runtime']['boundary_edges']==report['runtime']['degenerate_faces']==0
assert report['runtime']['signed_volume_m3']>0
(ROOT/'geometry-metrics.json').write_text(json.dumps(report,indent=2)+'\n')
# glTF export from actual Blender mesh.
bpy.ops.object.select_all(action='DESELECT');rock.select_set(True);bpy.context.view_layer.objects.active=rock
bpy.ops.export_scene.gltf(filepath=str(ROOT/'aurora-rock-s1.glb'),export_format='GLB',use_selection=True,export_yup=True,export_normals=True,export_texcoords=True,export_materials='EXPORT',export_cameras=False,export_lights=False,export_animations=False,export_vertex_color='NAME',export_vertex_color_name='Color',export_all_vertex_colors=True)
# Re-import actual GLB separately and verify its gross shape before studio creation.
bpy.ops.import_scene.gltf(filepath=str(ROOT/'aurora-rock-s1.glb'))
imported=[o for o in bpy.context.selected_objects if o.type=='MESH']
report['reimport']=[{'name':o.name,'vertices':len(o.data.vertices),'polygons':len(o.data.polygons),'dimensions_blender':list(o.dimensions)} for o in imported]
for o in list(bpy.context.selected_objects):bpy.data.objects.remove(o,do_unlink=True)
(ROOT/'geometry-metrics.json').write_text(json.dumps(report,indent=2)+'\n')
# Studio floor and physically neutral lights.
def link_studio(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 studio.objects.link(o)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.008));floor=bpy.context.object;floor.name='Studio floor • excluded from GLB';link_studio(floor);floor.data.materials.append(material('Studio floor',(.21,.235,.255)))
for name,loc,energy,size in [('Key',(-3,-4,6),600,4),('Fill',(4,-1,3),230,3),('Rim',(0,4,5),420,3)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size
 o=bpy.data.objects.new(name,d);studio.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('Review camera');cam=bpy.data.objects.new('Review camera',camdata);studio.objects.link(cam);scene.camera=cam
views={'front':(0,-6,.90),'rear':(0,6,.90),'left':(-6,0,.90),'right':(6,0,.90),'threequarter-front':(3.3,-5,2.6),'threequarter-rear':(-3.8,4.5,2.7),'top':(.0001,0,7),'human-height':(2.9,-4.4,1.70)}

def render(name,location,target=(0,0,.78),scale=3.2,perspective=False,folder='renders'):
 camdata.type='PERSP' if perspective else 'ORTHO';camdata.ortho_scale=scale;camdata.lens=52
 cam.location=location;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/folder/(name+'.png'));bpy.ops.render.render(write_still=True)
# Optional stage-only review to evaluate primary before committing secondary refinement.
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if '--primary-only' in args:
 rock.hide_render=True;obj.hide_render=False
 render('s1-a-primary-neutral',views['threequarter-front'],folder='diagnostics')
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'aurora-rock-s1.blend'))
 sys.exit(0)
for name,loc in views.items():render(name,loc,perspective=name=='human-height')
# Pure black silhouette, actual model.
sil=material('Silhouette black',(.015,.015,.015));old=rock.data.materials[0];rock.data.materials[0]=sil
render('silhouette',views['threequarter-front'],folder='diagnostics');rock.data.materials[0]=old
# Wire overlay follows authored cage edges, avoiding export triangulation clutter.
wire=obj.copy();wire.data=obj.data.copy();wire.name='Diagnostic • source cage edge overlay';studio.objects.link(wire);wire.hide_render=False;wire.hide_set(False)
wire.data.materials.clear();wire.data.materials.append(sil)
mod=wire.modifiers.new('Source polygon edges only','WIREFRAME');mod.thickness=.003;mod.use_replace=True
render('wireframe',views['threequarter-front'],folder='diagnostics');wire.hide_render=True;wire.hide_set(True)
# Plane colors are diagnostic and local to this duplicate.
palette=[material('Patch '+str(i),c) for i,c in enumerate([(.39,.47,.55),(.56,.49,.39),(.45,.52,.48),(.56,.57,.57),(.35,.41,.48),(.61,.55,.46)])]
for m in palette:rock.data.materials.append(m)
for p in rock.data.polygons:
 n=p.normal; axis=max(range(3),key=lambda i:abs(n[i]));p.material_index=1+axis*2+int(n[axis]<0)
render('large-plane-highlighting',views['threequarter-front'],folder='diagnostics')
for p in rock.data.polygons:p.material_index=0
render('shoulder-closeup',(2.5,-3.4,1.9),(.43,-.30,.87),1.9,folder='diagnostics')
render('ground-contact-closeup',(2.5,-4,1.2),(.10,-.1,.18),2.7,folder='diagnostics')
# Protected references, generated from exact original Three.js attribute arrays.
refpath=ROOT/'references'/'reference-geometry.json'
if refpath.exists():
 data=json.loads(refpath.read_text()); reference_objects=[]
 for label,parts in data['meshes'].items():
  group=[]
  for part in parts:
   pos=part['position'];verts=[(pos[i],-pos[i+2],pos[i+1]-part['groundY']) for i in range(0,len(pos),3)]
   me=bpy.data.meshes.new(label+' • unchanged triangles');me.from_pydata(verts,[],[(i,i+1,i+2) for i in range(0,len(verts),3)]);me.update()
   ob=bpy.data.objects.new(label,me);refs.objects.link(ob);ob.data.materials.append(neutral);group.append(ob);reference_objects.append(ob);ob.hide_render=True
  rock.hide_render=True
  for ob in group:ob.hide_render=False
  for name in ['front','threequarter-front','threequarter-rear']:
   if '--reuse-reference-renders' not in args or not (ROOT/'references'/(label+'-'+name+'.png')).exists():
    render(label+'-'+name,views[name],scale=5.3,folder='references')
  for ob in group:ob.hide_render=True
 rock.hide_render=False
 # G1 and S1 same physical scale, side by side.
 for ob in refs.objects:
  if ob.name.startswith('G1'):ob.hide_render=False;ob.location.x=-1.8
 rock.location.x=1.8
 render('G1-S1-same-scale',(4,-9,4),(0,0,1.1),8,folder='references')
 rock.location.x=0
 for ob in refs.objects:ob.hide_render=True;ob.hide_set(True);ob.location.x=0
# Store useful initial camera and outliner, source remains accessible in named collection.
cam.location=views['threequarter-front'];cam.rotation_euler=(Vector((0,0,.78))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=3.2
bpy.ops.object.select_all(action='DESELECT');rock.select_set(True);bpy.context.view_layer.objects.active=rock
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
scene['S1_README']='01 = editable polygon source, 02 = exported surface, 03 = studio (not asset), 04 = pinned references. Owner art approval pending.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'aurora-rock-s1.blend'))
print('S1_COMPLETE',json.dumps(report))
