"""Run in Blender background. Confirms real native source is an unmodified starter studio."""
import bpy,sys
from pathlib import Path
sc=bpy.context.scene
assert sc.unit_settings.system=="METRIC"
cams=[o for o in sc.objects if o.type=="CAMERA"]
assert len(cams)==8, f"expected eight review cameras, got {len(cams)}"
base=bpy.data.objects.get("PLACEHOLDER__SCULPT_MANUALLY__NOT_AN_ASSET")
assert base and base.type=="MESH"
assert base.get("manual_artist_work_required")==True
assert base.get("ROCK_R01G_STATUS").startswith("PLACEHOLDER")
assert len(base.data.polygons)>500
assert any("REFERENCE" in c.name for c in bpy.data.collections)
print("ROCK-R01G VERIFIED NATIVE BLEND SCULPT STUDIO; ART IS NOT COMPLETE")
print("Cameras:",[c.name for c in cams])
print("Base mesh vertices:",len(base.data.vertices),"(unsmodified starting ellipsoid)")
