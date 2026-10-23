"""F01: two independently authored connected cages, not scaled copies or random primitives.
Coordinates in metres, Blender Z up / -Y front. One initial candidate each.
"""
import bpy,bmesh,json,sys,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parent
# R2: long low glacial mass with an irregular broad crown; deliberately short right terminus.
R2_POINTS={
'a':(-2.15,-.85,0),'b':(-.75,-1.12,0),'c':(1.05,-1.08,0),'d':(2.35,-.55,0),'e':(2.48,.30,0),
'f':(1.75,.95,0),'g':(.05,1.18,0),'h':(-1.65,.96,0),'i':(-2.45,.25,0),'j':(-2.4,-.42,0),
'A':(-2.30,-.87,.62),'B':(-.78,-1.28,.48),'C':(1.10,-1.18,.58),'D':(2.55,-.48,.54),'E':(2.58,.35,.62),
'F':(1.80,1.13,.82),'G':(.02,1.28,.65),'H':(-1.75,1.07,.74),'I':(-2.55,.30,.68),'J':(-2.50,-.42,.72),
'K':(-2.00,-.58,1.45),'L':(-.70,-.88,1.70),'M':(.90,-.66,1.54),'N':(2.05,-.38,1.05),
'O':(1.98,.48,1.19),'P':(.80,.88,1.78),'Q':(-.55,.84,1.85),'R':(-1.90,.66,1.52),'S':(-2.17,.10,1.28),
'T':(-.85,-.05,1.88),'U':(.65,.12,1.83),'V':(-.20,.60,1.94)}
R2_FACES=[list('jihgfedcba'),list('abBA'),list('bcCB'),list('cdDC'),list('deED'),list('efFE'),list('fgGF'),list('ghHG'),list('hiIH'),list('ijJI'),list('jaAJ'),
list('ABLK'),list('BCML'),list('CDNM'),list('DEON'),list('EFPO'),list('FGQP'),list('GHRQ'),list('HISR'),list('I J K S'.replace(' ','')),list('JAK'),
list('KLTS'),list('LMUT'),list('MNOU'),list('OPVU'),list('PQV'),list('QRSTV'),list('TUV')]
# R3: deeper, taller upright erratic; high rear-left crown and one shared descending apron.
R3_POINTS={
'a':(-1.20,-1.12,0),'b':(.02,-1.45,0),'c':(1.11,-1.20,0),'d':(1.58,-.34,0),'e':(1.34,.98,0),
'f':(.42,1.50,0),'g':(-.94,1.33,0),'h':(-1.62,.36,0),'i':(-1.57,-.56,0),
'A':(-1.36,-1.22,.48),'B':(-.02,-1.62,.36),'C':(1.15,-1.38,.42),'D':(1.70,-.34,.51),
'E':(1.44,.99,.50),'F':(.45,1.70,.38),'G':(-1.05,1.44,.44),'H':(-1.80,.30,.57),'I':(-1.63,-.66,.48),
'J':(-1.10,-.90,1.95),'K':(-.08,-1.25,1.65),'L':(.74,-1.06,1.25),'M':(1.46,-.25,1.18),
'N':(1.18,.83,1.58),'O':(.25,1.36,2.06),'P':(-.95,1.18,2.13),'Q':(-1.49,.30,1.69),'R':(-1.42,-.48,1.61),
'S':(-.75,-.40,2.58),'T':(-.22,-.42,2.70),'U':(.42,.10,2.44),'V':(-.05,.83,2.70),'W':(-.93,.69,2.86),
'X':(.65,-.47,1.94)}
R3_FACES=[list('ihgfedcba'),list('abBA'),list('bcCB'),list('cdDC'),list('deED'),list('efFE'),list('fgGF'),list('ghHG'),list('hiIH'),list('iaAI'),
list('ABKJ'),list('BCLXK'),list('CDML'),list('DENM'),list('EFON'),list('FGPO'),list('GHQP'),list('HIRQ'),list('IAJR'),
list('JKTS'),list('KXUT'),list('XLMU'),list('MNVU'),list('NOV'),list('OPWV'),list('PQSW'),list('QRJS'),
list('STW'),list('TUVW')]
MODELS={
'broad-glacial':{'id':'broadGlacial','label':'R2 • Broad Glacial Boulder','points':R2_POINTS,'faces':R2_FACES,'bevels':[('L','T'),('T','U'),('Q','R')],'width':.035,'ortho':7.3},
'sculptural':{'id':'sculptural','label':'R3 • Sculptural Boulder','points':R3_POINTS,'faces':R3_FACES,'bevels':[('S','T'),('P','W'),('M','N')],'width':.028,'ortho':5.6}}

def metrics(o):
 bm=bmesh.new();bm.from_mesh(o.data);unseen=set(bm.verts);comp=0
 while unseen:
  comp+=1;stack=[unseen.pop()]
  while stack:
   p=stack.pop()
   for e in p.link_edges:
    n=e.other_vert(p)
    if n in unseen:unseen.remove(n);stack.append(n)
 out={'vertices':len(bm.verts),'polygons':len(bm.faces),'edges':len(bm.edges),'components':comp,'boundary_edges':sum(e.is_boundary for e in bm.edges),'non_manifold_edges':sum(not e.is_manifold for e in bm.edges),'degenerate_faces':sum(f.calc_area()<1e-10 for f in bm.faces),'inconsistent_winding':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),'euler':len(bm.verts)-len(bm.edges)+len(bm.faces)}
 bm.free();o.data.calc_loop_triangles();tri=[tuple(t.vertices) for t in o.data.loop_triangles];co=[v.co for v in o.data.vertices]
 tree=BVHTree.FromPolygons(co,tri,all_triangles=True,epsilon=1e-7)
 out.update(triangles=len(tri),volume_m3=sum(co[a].dot(co[b].cross(co[c]))/6 for a,b,c in tri),nonadjacent_overlap_candidates=[(a,b) for a,b in tree.overlap(tree) if a<b and not set(tri[a])&set(tri[b])],dimensions_W_H_D=[max(v[i] for v in co)-min(v[i] for v in co) for i in [0,2,1]],min_blender=[min(v[i] for v in co) for i in range(3)],max_blender=[max(v[i] for v in co) for i in range(3)],material_slots=len(o.data.materials),location=list(o.location),rotation=list(o.rotation_euler),scale=list(o.scale))
 assert out['components']==1 and out['boundary_edges']==out['non_manifold_edges']==out['degenerate_faces']==out['inconsistent_winding']==0 and out['euler']==2 and out['volume_m3']>0 and not out['nonadjacent_overlap_candidates'],out
 return out

def build(key,d,preview=False):
 out=ROOT/key;(out/'renders').mkdir(exist_ok=True)
 bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.unit_settings.system='METRIC'
 def collection(name):
  c=bpy.data.collections.new(name);scene.collection.children.link(c);return c
 src=collection('01 EDITABLE • authored geological cage');exp=collection('02 EXPORT • evaluated triangles');studio=collection('03 STUDIO • excluded from GLB')
 def material(name,c):
  m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*c,1);m.use_backface_culling=True
  p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.94;return m
 neutral=material('Neutral diagnostic granite',(.37,.40,.44))
 names=list(d['points']);ids={k:i for i,k in enumerate(names)}
 me=bpy.data.meshes.new(d['label']+' • shared control surface');me.from_pydata(list(d['points'].values()),[],[[ids[k] for k in f] for f in d['faces']]);me.update()
 obj=bpy.data.objects.new(d['label']+' EDITABLE',me);src.objects.link(obj);me.materials.append(neutral)
 for name,i in ids.items():obj.vertex_groups.new(name=name+' • authored structural point').add([i],1,'REPLACE')
 attr=me.attributes.new('geological_patch','INT','FACE')
 for i,v in enumerate(attr.data):v.value=i
 obj['construction']='One explicit connected cage; independently authored F01 asset. No scaled S1/G1 mesh, noise, hull or Boolean.'
 obj['named_points']=json.dumps(ids);obj['source_patch_boundaries']=json.dumps(d['faces'])
 bm=bmesh.new();bm.from_mesh(me);bm.normal_update()
 warped=[]
 for f in list(bm.faces):
  if len(f.verts)>3:
   center=f.calc_center_median();dist=max(abs((v.co-center).dot(f.normal)) for v in f.verts)
   if dist>.001:
    warped.append(f.index);bmesh.ops.triangulate(bm,faces=[f],quad_method='FIXED',ngon_method='EAR_CLIP')
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free();me.update();me.validate(verbose=True)
 rock=obj.copy();rock.data=me.copy();rock.name=d['label']+' RUNTIME';exp.objects.link(rock)
 bm=bmesh.new();bm.from_mesh(rock.data);bm.verts.ensure_lookup_table()
 selected=[]
 for a,b in d['bevels']:
  va,vb=bm.verts[ids[a]],bm.verts[ids[b]];selected.append(next(e for e in va.link_edges if vb in e.verts))
 bmesh.ops.bevel(bm,geom=selected,offset=d['width'],segments=1,affect='EDGES',profile=.5)
 bmesh.ops.triangulate(bm,faces=list(bm.faces),quad_method='FIXED',ngon_method='EAR_CLIP');bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(rock.data);bm.free();rock.data.update();rock.data.validate(verbose=True)
 for p in rock.data.polygons:p.use_smooth=False
 uv=rock.data.uv_layers.new(name='UVMap');color=rock.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
 for p in rock.data.polygons:
  axis=max(range(3),key=lambda i:abs(p.normal[i]));axes=(1,2) if axis==0 else (0,2) if axis==1 else (0,1);up=max(0,p.normal.z)
  for li in p.loop_indices:
   co=rock.data.vertices[rock.data.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]]*.38,co[axes[1]]*.38);color.data[li].color=(.235+up*.034,.263+up*.036,.298+up*.037,1)
 obj.hide_render=True;obj.hide_set(True);bpy.context.view_layer.update()
 report={'id':d['id'],'candidate':'focused crown correction' if key=='sculptural' else 'initial','correction_passes':1 if key=='sculptural' else 0,'blender_version':bpy.app.version_string,'source':metrics(obj),'runtime':metrics(rock),'resolved_nonplanar_source_faces':warped,'bevel_edges':d['bevels'],'bevel_width_m':d['width'],'source_is_independently_authored':True}
 bpy.ops.object.select_all(action='DESELECT');rock.select_set(True);bpy.context.view_layer.objects.active=rock
 glb=out/('aurora-'+key+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_yup=True,export_normals=True,export_texcoords=True,export_materials='EXPORT',export_cameras=False,export_lights=False,export_animations=False,export_vertex_color='NAME',export_vertex_color_name='Color')
 bpy.ops.import_scene.gltf(filepath=str(glb));imported=list(bpy.context.selected_objects)
 report['reimport']=[{'dimensions':list(o.dimensions),'triangles':len(o.data.polygons)} for o in imported if o.type=='MESH']
 for o in imported:bpy.data.objects.remove(o,do_unlink=True)
 report['glb_bytes']=glb.stat().st_size
 (out/'geometry-metrics.json').write_text(json.dumps(report,indent=2)+'\n')
 scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=1000;scene.render.resolution_y=760;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
 scene.world=bpy.data.worlds.new('Neutral studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.36,.39,.43,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
 def to_studio(o):
  for c in list(o.users_collection):c.objects.unlink(o)
  studio.objects.link(o)
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.008));floor=bpy.context.object;floor.name='Studio floor';to_studio(floor);floor.data.materials.append(material('Studio ground',(.21,.235,.255)))
 for name,loc,power,size in [('Key',(-5,-6,9),1100,6),('Fill',(6,-1,4),400,5),('Rim',(0,5,7),750,5)]:
  ld=bpy.data.lights.new(name,'AREA');ld.energy=power;ld.shape='DISK';ld.size=size;o=bpy.data.objects.new(name,ld);studio.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
 cd=bpy.data.cameras.new('Review camera');cam=bpy.data.objects.new('Review camera',cd);studio.objects.link(cam);scene.camera=cam
 height=report['runtime']['dimensions_W_H_D'][1];target=Vector((0,0,height*.46))
 views={'front':(0,-9,height*.50),'rear':(0,9,height*.50),'left':(-9,0,height*.50),'right':(9,0,height*.50),'threequarter-front':(5,-8,4.6),'threequarter-rear':(-6,8,4.8),'top':(.001,0,12),'human-height':(4,-8,1.70)}
 for name in (['threequarter-front','threequarter-rear'] if preview else views):
  cd.type='PERSP' if name=='human-height' else 'ORTHO';cd.ortho_scale=d['ortho'];cd.lens=48;cam.location=views[name];cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/'renders'/(name+'.png'));bpy.ops.render.render(write_still=True)
 cam.location=views['threequarter-front'];cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cd.type='ORTHO';cd.ortho_scale=d['ortho'];bpy.ops.object.select_all(action='DESELECT');rock.select_set(True);bpy.context.view_layer.objects.active=rock
 bpy.ops.wm.save_as_mainfile(filepath=str(out/('aurora-'+key+'.blend')))
 print('F01_MODEL_COMPLETE',key,json.dumps(report))
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for key,d in MODELS.items():
 if not any(k in args for k in MODELS) or key in args:build(key,d,'--preview' in args)
