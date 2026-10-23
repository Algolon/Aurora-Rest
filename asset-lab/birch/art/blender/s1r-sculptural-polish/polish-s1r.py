"""Edit the actual S1 source cage. Named edge splits and translations, not a generator.
Original files are read-only inputs. Blender Z up / -Y front / metres.
"""
import bpy,bmesh,json,sys,hashlib,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parent;BASE=ROOT.parent/'s1-geological-sculpt'
bpy.ops.wm.open_mainfile(filepath=str(BASE/'aurora-rock-s1.blend'))
scene=bpy.context.scene
original=next(o for o in bpy.data.objects if o.name.startswith('S1 EDITABLE'))
baseline=next(o for o in bpy.data.objects if o.name.startswith('S1 RUNTIME'))
assert len(original.data.vertices)==34 and len(original.data.polygons)==29
original_hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [BASE/'aurora-rock-s1.blend',BASE/'aurora-rock-s1.glb']}

def coll(name):
 c=bpy.data.collections.new(name);scene.collection.children.link(c);return c
editable=coll('10 S1R EDITABLE • refined original cage');evaluated=coll('11 S1R EXPORT • triangulated flat stone')
source=original.copy();source.data=original.data.copy();source.name='S1R EDITABLE • oblique cleavage polish';editable.objects.link(source)
source.hide_set(False);source.hide_render=True;source.data.name='S1R • edited S1 shared control cage'
labels={next(original.vertex_groups[g.group].name.split(' • ')[0] for g in v.groups if g.weight>.99):v.index for v in original.data.vertices}
bm=bmesh.new();bm.from_mesh(source.data);bm.verts.ensure_lookup_table();bm.faces.ensure_lookup_table()
v={k:bm.verts[i] for k,i in labels.items()};faces=list(bm.faces);old={k:list(p.co) for k,p in v.items()}
# S1R-A: small, specifically directed changes to EXISTING authored vertices.
changes={'A':(-.78,-.56,1.26),'B':(-.19,-.626,1.18),'I':(-.91,-.34,1.00),
 'H':(-1.01,.13,.97),'G':(-.75,.52,1.36),'F':(.10,.71,1.10),
 'J':(-.65,-.33,1.52),'N':(-.51,.43,1.62),'L':(.36,-.03,1.40),
 'M':(.20,.37,1.46),'S':(.68,-.015,1.16)}
for k,co in changes.items():v[k].co=co

def edge(a,b):return next(e for e in v[a].link_edges if v[b] in e.verts)
def insert(name,a,b,t):
 co=v[a].co.lerp(v[b].co,t);_,p=bmesh.utils.edge_split(edge(a,b),v[a],t);p.co=co;v[name]=p;return p

def fit_axis(p,a,b,c,axis):
 n=(b.co-a.co).cross(c.co-a.co)
 assert abs(n[axis])>1e-5
 p.co[axis]=a.co[axis]-sum(n[k]*(p.co[k]-a.co[k]) for k in range(3) if k!=axis)/n[axis]
# S1R-B: uneven front ridge through the original frontal face, sharing boundary points.
P=insert('FRONT_LEFT_BREAK','al','A',.62);P.co.x-=.025;P.co.y-=.10
Q=insert('FRONT_RIGHT_BREAK','bl','B',.43)
fit_axis(Q,v['al'],v['bl'],P,1);fit_axis(v['B'],v['A'],P,Q,1)
bmesh.utils.face_split(faces[10],P,Q)
# One connected oblique fracture around left/back, not a new solid.
PL=insert('LEFT_REAR_BREAK','gl','G',.56);PL.co.x-=.10;PL.co.y+=.065
QL=insert('LEFT_SIDE_BREAK','hl','H',.65)
fit_axis(QL,v['gl'],v['hl'],PL,0);fit_axis(v['H'],v['G'],PL,QL,0)
T=insert('REAR_BREAK','fl','F',.38)
fit_axis(T,v['fl'],v['gl'],PL,1);fit_axis(v['F'],v['G'],PL,T,1)
bmesh.utils.face_split(faces[16],PL,QL);bmesh.utils.face_split(faces[15],PL,T)
# Explicit roof/crown splits along the chosen structural crest directions.
def split(a,b,region):
 candidates=[f for f in bm.faces if v[a] in f.verts and v[b] in f.verts and len(f.verts)>3]
 f=next(f for f in candidates if f[patch_layer]==region)
 if any(v[b] in e.verts for e in v[a].link_edges):return
 bmesh.utils.face_split(f,v[a],v[b])
patch_layer=bm.faces.layers.int.get('geological_patch')
assert patch_layer is not None
for a,b,region in [('B','S',20),('S','K',20),('K','N',28),('K','M',28),
 ('FRONT_RIGHT_BREAK','R',11),('FRONT_LEFT_BREAK','I',18),('LEFT_SIDE_BREAK','I',17)]:split(a,b,region)
bm.normal_update()
# S1R-C: resolve only materially warped remaining polygons into explicit flat patches.
# No new points or subdivision. Broad front/west/rear quads were planar-fitted above.
resolved=[]
for f in list(bm.faces):
 if len(f.verts)<=3:continue
 center=f.calc_center_median();distance=max(abs((p.co-center).dot(f.normal)) for p in f.verts)
 if distance>.001:
  resolved.append({'source_patch':f[patch_layer],'deviation_m':distance,'vertex_count':len(f.verts)})
  bmesh.ops.triangulate(bm,faces=[f],quad_method='FIXED',ngon_method='EAR_CLIP')
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.verts.index_update();bm.faces.index_update()
final_labels={k:p.index for k,p in v.items()}
bm.to_mesh(source.data);bm.free();source.data.update();source.data.validate(verbose=True)
for k,i in final_labels.items():
 if k not in labels:source.vertex_groups.new(name=k+' • authored fracture').add([i],1,'REPLACE')
source['source_checkpoint']='7ed1d43aa5e6577bba5238dfa53be645523c110f'
source['method']='Copied actual S1 cage; named vertex edits, five shared boundary inserts, three fracture splits and directed roof splits; no generator/CSG.'
source['named_vertex_indices']=json.dumps(final_labels);source['source_to_export']='Duplicate this cage; bevel only named edges; triangulate; flat normals; UV/color; selected GLB.'
# Evaluated copy. Original S1 objects remain unmodified backups in the new project.
rock=source.copy();rock.data=source.data.copy();rock.name='S1R RUNTIME • evaluated geological polish';rock.data.name='S1R • actual exported triangles';evaluated.objects.link(rock);rock.hide_render=False;rock.hide_set(False)
rock.data.materials.clear();neutral=baseline.data.materials[0];rock.data.materials.append(neutral)
for p in rock.data.polygons:p.material_index=0
bm=bmesh.new();bm.from_mesh(rock.data);bm.verts.ensure_lookup_table()
# Three chosen crown edges weathered at unequal widths; fractures remain hard.
runtime_vertices={k:bm.verts[i] for k,i in final_labels.items()}
def runtime_edge(a,b):return next(e for e in runtime_vertices[a].link_edges if runtime_vertices[b] in e.verts)
front_lips=[runtime_edge('J','K'),runtime_edge('K','L')];rear_lip=runtime_edge('N','G')
bmesh.ops.bevel(bm,geom=front_lips,offset=.024,segments=1,affect='EDGES',profile=.5)
bmesh.ops.bevel(bm,geom=[rear_lip],offset=.014,segments=1,affect='EDGES',profile=.5)
# Explicit runtime triangles BEFORE normals/attributes prevents accidental polygon interpolation.
bmesh.ops.triangulate(bm,faces=list(bm.faces),quad_method='FIXED',ngon_method='EAR_CLIP')
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(rock.data);bm.free();rock.data.update();rock.data.validate(verbose=True)
for p in rock.data.polygons:p.use_smooth=False
while rock.data.uv_layers:rock.data.uv_layers.remove(rock.data.uv_layers[0])
while rock.data.color_attributes:rock.data.color_attributes.remove(rock.data.color_attributes[0])
uv=rock.data.uv_layers.new(name='UVMap');color=rock.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
for p in rock.data.polygons:
 n=p.normal;axis=max(range(3),key=lambda i:abs(n[i]));axes=(1,2) if axis==0 else (0,2) if axis==1 else (0,1);up=max(0,n.z)
 for li in p.loop_indices:
  co=rock.data.vertices[rock.data.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]]*.38,co[axes[1]]*.38)
  color.data[li].color=(.235+up*.034,.263+up*.036,.298+up*.037,1)
source.hide_set(True);baseline.hide_render=True;original.hide_render=True
for o in bpy.data.objects:
 if o.name.startswith('Diagnostic'):o.hide_render=True

def metrics(o):
 bm=bmesh.new();bm.from_mesh(o.data);unseen=set(bm.verts);components=0
 while unseen:
  components+=1;stack=[unseen.pop()]
  while stack:
   x=stack.pop()
   for e in x.link_edges:
    w=e.other_vert(x)
    if w in unseen:unseen.remove(w);stack.append(w)
 result={'vertices':len(bm.verts),'polygons':len(bm.faces),'edges':len(bm.edges),'components':components,
 'boundary_edges':sum(e.is_boundary for e in bm.edges),'non_manifold_edges':sum(not e.is_manifold for e in bm.edges),
 'inconsistent_winding':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),'degenerate_faces':sum(f.calc_area()<1e-10 for f in bm.faces),'euler':len(bm.verts)-len(bm.edges)+len(bm.faces)}
 bm.free();o.data.calc_loop_triangles();tris=[tuple(t.vertices) for t in o.data.loop_triangles];pts=[p.co for p in o.data.vertices]
 result['triangles']=len(tris);result['triangulated_volume_m3']=sum(pts[a].dot(pts[b].cross(pts[c]))/6 for a,b,c in tris)
 tree=BVHTree.FromPolygons(pts,tris,all_triangles=True,epsilon=1e-7);result['nonadjacent_overlap_candidates']=[(a,b) for a,b in tree.overlap(tree) if a<b and not set(tris[a])&set(tris[b])]
 result['bounds_blender']={'min':[min(p[i] for p in pts) for i in range(3)],'max':[max(p[i] for p in pts) for i in range(3)]}
 result['dimensions_W_H_D']=[max(p[i] for p in pts)-min(p[i] for p in pts) for i in [0,2,1]]
 result['location']=list(o.location);result['rotation']=list(o.rotation_euler);result['scale']=list(o.scale);result['material_slots']=len(o.data.materials)
 return result
bpy.context.view_layer.update();result={'blender_version':bpy.app.version_string,'input_hashes':original_hashes,'source':metrics(source),'runtime':metrics(rock),'named_vertices':{k:list(source.data.vertices[i].co) for k,i in final_labels.items()},'original_vertex_edits':{k:{'before':old[k],'after':list(source.data.vertices[final_labels[k]].co)} for k in changes},'explicitly_resolved_warped_patches':resolved}
for key in ['source','runtime']:
 m=result[key];assert m['components']==1 and m['boundary_edges']==m['non_manifold_edges']==m['inconsistent_winding']==m['degenerate_faces']==0 and m['euler']==2 and m['triangulated_volume_m3']>0
 assert not m['nonadjacent_overlap_candidates'],str(m['nonadjacent_overlap_candidates'])
assert all((source.data.vertices[final_labels[k]].co-original.data.vertices[labels[k]].co).length<1e-8 for k in 'abcdefghi')
# Select runtime only: actual final mesh exported, no surrogate.
bpy.ops.object.select_all(action='DESELECT');rock.hide_set(False);rock.select_set(True);bpy.context.view_layer.objects.active=rock
bpy.ops.export_scene.gltf(filepath=str(ROOT/'aurora-rock-s1r.glb'),export_format='GLB',use_selection=True,export_yup=True,export_normals=True,export_texcoords=True,export_materials='EXPORT',export_cameras=False,export_lights=False,export_animations=False,export_vertex_color='NAME',export_vertex_color_name='Color',export_all_vertex_colors=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'aurora-rock-s1r.glb'));imported=list(bpy.context.selected_objects)
result['reimport']=[{'name':o.name,'dimensions':list(o.dimensions),'triangles':len(o.data.polygons)} for o in imported if o.type=='MESH']
for o in imported:bpy.data.objects.remove(o,do_unlink=True)
result['glb_bytes']=(ROOT/'aurora-rock-s1r.glb').stat().st_size
(ROOT/'geometry-metrics.json').write_text(json.dumps(result,indent=2)+'\n')
# Identical original neutral studio and cameras for baseline and refinement.
scene.render.engine='CYCLES';scene.cycles.samples=20;scene.render.resolution_x=1000;scene.render.resolution_y=820;scene.render.resolution_percentage=100
cam=scene.camera
views={'front':(0,-6,.90),'rear':(0,6,.90),'left':(-6,0,.90),'right':(6,0,.90),'threequarter-front':(3.3,-5,2.6),'threequarter-rear':(-3.8,4.5,2.7),'top':(.0001,0,7),'human-height':(2.9,-4.4,1.70)}
def render(name,loc,target=(0,0,.78),scale=3.2,perspective=False,folder='renders'):
 cam.data.type='PERSP' if perspective else 'ORTHO';cam.data.ortho_scale=scale;cam.data.lens=52;cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(ROOT/folder/(name+'.png'));bpy.ops.render.render(write_still=True)
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
preview='--preview' in args
for name in (['threequarter-front','left','threequarter-rear'] if preview else list(views)):render(name,views[name],perspective=name=='human-height')
if not preview:
 # Shared diagnostic framing, actual evaluated mesh and original source edges.
 for name,loc,target,scale in [('front-closeup',(0,-5,1.4),(-.28,-.4,.84),2.1),('left-closeup',(-5,-.6,1.6),(-.6,.1,.8),2.1),('rear-closeup',(-1,5,1.8),(-.1,.4,.85),2.3),('shoulder-closeup',(2.5,-3.4,1.9),(.43,-.3,.87),1.9),('ground-contact',(2.5,-4,1.2),(.1,-.1,.18),2.7)]:render(name,loc,target,scale,folder='diagnostics')
 sil=bpy.data.materials.new('S1R silhouette emission');sil.use_nodes=True;nodes=sil.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');em.inputs[0].default_value=(.015,.015,.015,1);sil.node_tree.links.new(em.outputs[0],out.inputs['Surface'])
 rock.data.materials[0]=sil;render('silhouette',views['threequarter-front'],folder='diagnostics');rock.data.materials[0]=neutral
 wire=source.copy();wire.data=source.data.copy();wire.name='S1R DIAGNOSTIC • editable patch edges';scene.collection.objects.link(wire);wire.hide_render=False;wire.hide_set(False);wire.data.materials.clear();wire.data.materials.append(sil);mod=wire.modifiers.new('Source edges','WIREFRAME');mod.thickness=.003;mod.use_replace=True
 render('wireframe',views['threequarter-front'],folder='diagnostics');wire.hide_render=True;wire.hide_set(True)
 palette=[]
 for i,c in enumerate([(.36,.44,.53),(.56,.47,.36),(.40,.50,.44),(.58,.56,.52),(.34,.40,.48),(.63,.54,.42)]):
  m=neutral.copy();m.name='S1R plane direction '+str(i);m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*c,1);palette.append(m);rock.data.materials.append(m)
 for p in rock.data.polygons:
  n=p.normal;axis=max(range(3),key=lambda i:abs(n[i]));p.material_index=1+axis*2+int(n[axis]<0)
 render('large-planes',views['threequarter-front'],folder='diagnostics')
 for p in rock.data.polygons:p.material_index=0
 # Restore just one used material slot in the final runtime object.
 while len(rock.data.materials)>1:rock.data.materials.pop(index=1)
 # Matching baseline diagnostic closeups, not a different light/camera.
 rock.hide_render=True;baseline.hide_render=False
 for name,loc,target,scale in [('front-closeup',(0,-5,1.4),(-.28,-.4,.84),2.1),('left-closeup',(-5,-.6,1.6),(-.6,.1,.8),2.1),('rear-closeup',(-1,5,1.8),(-.1,.4,.85),2.3),('shoulder-closeup',(2.5,-3.4,1.9),(.43,-.3,.87),1.9),('ground-contact',(2.5,-4,1.2),(.1,-.1,.18),2.7)]:render(name,loc,target,scale,folder='baseline')
 baseline.hide_render=True;rock.hide_render=False
# Keep original backups clearly labeled and hidden in the new project only.
scene['S1R_README']='10 EDITABLE is the actual modified S1 cage; 11 EXPORT is the evaluated triangulated copy. Original S1 collections are retained as hidden backups; original files are untouched.'
cam.data.type='ORTHO';cam.data.ortho_scale=3.2;cam.location=views['threequarter-front'];cam.rotation_euler=(Vector((0,0,.78))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.select_all(action='DESELECT');rock.select_set(True);bpy.context.view_layer.objects.active=rock
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'aurora-rock-s1r.blend'))
assert original_hashes=={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [BASE/'aurora-rock-s1.blend',BASE/'aurora-rock-s1.glb']}
print('S1R_COMPLETE',json.dumps(result))
