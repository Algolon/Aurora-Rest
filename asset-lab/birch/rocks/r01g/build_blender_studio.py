#!/usr/bin/env python3
"""ROCK-R01G: Create an ACTUAL Blender-native sculpting studio, NOT a final rock.

Run ONLY with Blender's Python interpreter:
  blender --background --python build_blender_studio.py -- --out output/ROCK-R01G-A-STUDIO-PLACEHOLDER.blend --refs /path/to/refs

No code-driven boulder modelling or procedural fake shape is performed. It sets
up cameras, studio lights, optional reference images, ground and a base ellipsoid
mesh clearly labeled PLACEHOLDER. Human Blender sculpting is still mandatory.
"""
import argparse, math, os, sys
from pathlib import Path
import bpy
from mathutils import Vector

args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
parser=argparse.ArgumentParser()
parser.add_argument("--out",default="output/ROCK-R01G-A-STUDIO-PLACEHOLDER.blend")
parser.add_argument("--refs",default="")
opt=parser.parse_args(args)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene
sc.name="ROCK-R01G / A / NATURAL FORM STUDIO — PLACEHOLDER"
sc.unit_settings.system="METRIC"
sc.unit_settings.scale_length=1.0
sc.render.engine="CYCLES"
sc.cycles.samples=24
sc.render.resolution_x=1000
sc.render.resolution_y=720
sc.render.resolution_percentage=85
try:sc.render.image_settings.file_format="PNG"
except Exception:pass
sc.world=bpy.data.worlds.new("Overcast Nordic Studio")
sc.world.use_nodes=True
world_bg=sc.world.node_tree.nodes.get("Background")
world_bg.inputs["Color"].default_value=(0.72,0.78,0.75,1)
world_bg.inputs["Strength"].default_value=.75
sc.view_settings.view_transform="Standard"

def col(name):
 c=bpy.data.collections.new(name);sc.collection.children.link(c);return c
clay_collection=col("01 HUMAN SCULPT — REPLACE PLACEHOLDER BY HAND")
view_collection=col("02 CAMERAS / TRUE ORTHOGRAPHIC STUDY")
studio_collection=col("03 STUDIO / HIDDEN FROM ART APPROVAL")
ref_collection=col("04 R01E 2D REFERENCES / CONCEPT, NOT PHOTOGRAMMETRY")
def relink(obj,c):
 for co in tuple(obj.users_collection):co.objects.unlink(obj)
 c.objects.link(obj)

# A deliberately *featureless* soft volume, never promoted as actual ROCK-R01G A.
# It provides a metrically sized object on which a human artist can begin sculpting.
bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=(0,0,1.01))
obj=bpy.context.object
obj.name="PLACEHOLDER__SCULPT_MANUALLY__NOT_AN_ASSET"
obj.scale=(1.77,1.36,1.10)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
relink(obj,clay_collection)
for p in obj.data.polygons:p.use_smooth=True
mat=bpy.data.materials.new("Plain natural-form clay; not a finished granite shader")
mat.diffuse_color=(.56,.60,.58,1)
mat.use_nodes=True
bsdf=mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
 bsdf.inputs["Base Color"].default_value=(.56,.60,.58,1)
 bsdf.inputs["Roughness"].default_value=.88
obj.data.materials.append(mat)
obj["ROCK_R01G_STATUS"]="PLACEHOLDER ONLY — ZERO HAND SCULPTING DONE"
obj["manual_artist_work_required"]=True
obj["selected_shape"]="A / Nordic Weathered Corestone"
obj["evidence"]="Myrstigen fracture; Kummakivi continuous mass, not actual 3D scan"
obj["starter_scene_generated"]=True

# Ground witness plane is a separate collection, never part of the stone.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.12))
ground=bpy.context.object;ground.name="REVIEW ONLY / neutral ground"
relink(ground,studio_collection)
neutral=bpy.data.materials.new("Non-rock stage material")
neutral.diffuse_color=(.54,.59,.57,1)
neutral.use_nodes=True
if neutral.node_tree.nodes.get("Principled BSDF"):
 neutral.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value=(.45,.50,.48,1)
ground.data.materials.append(neutral)

def look(obj,point):
 obj.rotation_euler=(Vector(point)-obj.location).to_track_quat("-Z","Y").to_euler()
def camera(name,loc,scale=6.25):
 cam=bpy.data.cameras.new(name)
 cam.type="ORTHO";cam.ortho_scale=scale;cam.lens=42
 c=bpy.data.objects.new(name,cam);view_collection.objects.link(c)
 c.location=loc;look(c,(0,0,1.02))
 return c
views=[
 ("01 Front", (0,-7,2.15)),
 ("02 Front Three Quarter",(5,-6,3.05)),
 ("03 Right",(7,0,2.2)),
 ("04 Rear Three Quarter",(5,6,2.95)),
 ("05 Rear",(0,7,2.15)),
 ("06 Left",(-7,0,2.2)),
 ("07 Top",(0,-.01,8)),
 ("08 Human Height",(5,-7,1.7))
]
cams=[camera(n,l,7.1 if n=="07 Top" else 6.25) for n,l in views]
sc.camera=cams[1]
def area(name,loc,power,size):
 data=bpy.data.lights.new(name,"AREA");data.energy=power;data.shape="DISK";data.size=size
 o=bpy.data.objects.new(name,data);studio_collection.objects.link(o);o.location=loc
 look(o,(0,0,.95))
area("Soft Nordic Sky Key",(-3.8,-4.6,7.2),1250,7)
area("Large right fill",(3.5,2.3,4.4),780,5)
area("Rear contour fill",(-2.5,4.2,5.0),480,4)

# Optional original Aurora-authored 2D concepts. These are only visual REFERENCE
# image empties (not a scanned or measured 3D photo reconstruction).
src=Path(opt.refs) if opt.refs else None
if src and src.is_dir():
 files=[("R01E-01-Natural-Shape-Variants.png",(-5,1.4,1.4)),
        ("R01E-02-Multi-View-Shape-Handoff.png",(5,1.4,1.4))]
 for fn,loc in files:
  path=src/fn
  if not path.is_file():continue
  image=bpy.data.images.load(str(path),check_existing=True)
  empty=bpy.data.objects.new("REFERENCE 2D / "+fn,None)
  ref_collection.objects.link(empty);empty.empty_display_type="IMAGE"
  empty.data=image;empty.location=loc
  empty.empty_display_size=3.0;empty.show_in_front=False;empty.hide_render=True

# Open in useful solid-shaded edit view with clay selected, all evidence visible.
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.context.view_layer.objects.active=obj
for area_space in bpy.context.screen.areas:
 if area_space.type=="VIEW_3D":
  space=area_space.spaces.active
  space.shading.type="SOLID"
  space.shading.light="STUDIO"
  space.shading.color_type="MATERIAL"
  space.shading.show_cavity=True
  space.overlay.show_floor=True

out=Path(opt.out).expanduser().resolve()
out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out))
assert out.is_file() and out.stat().st_size>50000
print("ROCK-R01G BLENDER NATIVE STUDIO SAVED:",out)
print("IMPORTANT: THIS CONTAINS A CLEARLY LABELLED BASE ELLIPSOID, NOT A SCULPTED ROCK")
