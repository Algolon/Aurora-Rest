"""Grid constants for the A1a overlay. Canonical grid 1501 x 2001, 4 m: x = 4i - 3000, z = 4000 - 4j (row j runs south)."""
from pathlib import Path
import sys
import numpy as np
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools/geo-r02c/lib'))
from common import surface  # noqa: E402,F401  (P0 helper: height on the rendered SW-diagonal triangles)
NX,NZ,CELL=1501,2001,4.
R1_TERRAIN=ROOT/'public/geo-r02b/terrain.f32'
R1_TERRAIN_SHA256='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a'
# Sub-grid covering the window v2 bounding box (x -2000..1700, z 1700..4000): rows 0..575, cols 250..1175.
J=slice(0,576);I=slice(250,1176)
def sub_coords(J=J,I=I):
 jj,ii=np.meshgrid(np.arange(J.start,J.stop),np.arange(I.start,I.stop),indexing='ij');return ii*CELL-3000.,4000.-jj*CELL
def load_r1():return np.fromfile(R1_TERRAIN,'<f4').reshape(NZ,NX)
